-- ============================================================================
-- Hidden Agent Audit Tables                          2026-08-12
--
-- Creates three append-only (or controlled-update) audit tables for the
-- command-board AI agent layer:
--
--   oracle_forecasts      — demand forecasts produced by the Oracle agent
--   phantom_pricing_log   — pricing decisions produced by Phantom-Pricer
--   sentinel_log          — security / anomaly events from Sentinel
--
-- Security model:
--   1. RLS enabled AND forced on every table.
--   2. anon + authenticated roles receive zero privileges.
--   3. service_role (server-side admin client) is the sole access path.
--   4. phantom_pricing_log is append-only: INSERT + SELECT only.
--   5. All invariants are double-enforced: TypeScript brands + DB constraints.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- Shared: updated_at auto-stamp trigger
-- --------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
grant execute on function public.set_updated_at() to service_role;

-- --------------------------------------------------------------------------
-- oracle_forecasts
-- --------------------------------------------------------------------------

create table if not exists public.oracle_forecasts (
  id                  uuid        primary key default gen_random_uuid(),

  period_starts_at    date        not null,
  period_ends_at      date        not null,

  demand_score        numeric(5,4) not null,
  confidence          numeric(5,4) not null,

  model_version       text        not null,
  generated_at        timestamptz not null default timezone('utc', now()),

  signals             jsonb       not null default '[]'::jsonb,
  is_stale            boolean     not null default false,

  created_at          timestamptz not null default timezone('utc', now()),
  updated_at          timestamptz not null default timezone('utc', now()),

  constraint oracle_forecasts_period_ordered
    check (period_ends_at >= period_starts_at),
  constraint oracle_forecasts_demand_score_unit
    check (demand_score >= 0 and demand_score <= 1),
  constraint oracle_forecasts_confidence_unit
    check (confidence >= 0 and confidence <= 1),
  constraint oracle_forecasts_model_version_nonempty
    check (length(trim(model_version)) > 0),
  constraint oracle_forecasts_signals_is_array
    check (jsonb_typeof(signals) = 'array')
);

create index if not exists oracle_forecasts_period_idx
  on public.oracle_forecasts (period_starts_at, period_ends_at);
create index if not exists oracle_forecasts_generated_at_idx
  on public.oracle_forecasts (generated_at desc);
create index if not exists oracle_forecasts_active_idx
  on public.oracle_forecasts (period_starts_at, period_ends_at, generated_at desc)
  where is_stale = false;

drop trigger if exists set_oracle_forecasts_updated_at on public.oracle_forecasts;
create trigger set_oracle_forecasts_updated_at
  before update on public.oracle_forecasts
  for each row execute function public.set_updated_at();

alter table public.oracle_forecasts enable row level security;
alter table public.oracle_forecasts force row level security;
revoke all on table public.oracle_forecasts from anon, authenticated, public;
grant select, insert, update on table public.oracle_forecasts to service_role;

-- --------------------------------------------------------------------------
-- phantom_pricing_log  (append-only — no UPDATE grant)
-- --------------------------------------------------------------------------

create table if not exists public.phantom_pricing_log (
  id                              uuid        primary key default gen_random_uuid(),

  forecast_id                     uuid        not null
                                    references public.oracle_forecasts(id)
                                    on delete restrict,

  stay_period_starts_at           date        not null,
  stay_period_ends_at             date        not null,

  currency_code                   char(3)     not null default 'USD',

  recommended_nightly_rate_cents  bigint      not null,
  minimum_nightly_rate_cents      bigint      not null,
  maximum_nightly_rate_cents      bigint      not null,
  estimated_total_cents           bigint      not null,

  confidence                      numeric(5,4) not null,
  disposition                     text        not null,
  strategy                        text        not null,

  model_version                   text        not null,
  rationale                       jsonb       not null default '[]'::jsonb,

  created_at                      timestamptz not null default timezone('utc', now()),

  constraint phantom_period_ordered
    check (stay_period_ends_at >= stay_period_starts_at),
  constraint phantom_currency_usd
    check (currency_code = 'USD'),
  constraint phantom_rate_floor_positive
    check (minimum_nightly_rate_cents > 0),
  constraint phantom_rate_order_valid
    check (
      minimum_nightly_rate_cents <= recommended_nightly_rate_cents
      and recommended_nightly_rate_cents <= maximum_nightly_rate_cents
    ),
  constraint phantom_total_nonnegative
    check (estimated_total_cents >= 0),
  constraint phantom_confidence_unit
    check (confidence >= 0 and confidence <= 1),
  constraint phantom_disposition_valid
    check (disposition in (
      'automatic', 'requires_human_review', 'manual_override', 'blocked'
    )),
  constraint phantom_strategy_valid
    check (strategy in (
      'demand_based', 'competitor_based', 'seasonal',
      'floor_enforced', 'ceiling_enforced'
    )),
  constraint phantom_model_version_nonempty
    check (length(trim(model_version)) > 0),
  constraint phantom_rationale_is_array
    check (jsonb_typeof(rationale) = 'array')
);

create index if not exists phantom_pricing_log_forecast_id_idx
  on public.phantom_pricing_log (forecast_id);
create index if not exists phantom_pricing_log_stay_period_idx
  on public.phantom_pricing_log (stay_period_starts_at, stay_period_ends_at, created_at desc);
create index if not exists phantom_pricing_log_created_at_idx
  on public.phantom_pricing_log (created_at desc);

alter table public.phantom_pricing_log enable row level security;
alter table public.phantom_pricing_log force row level security;
revoke all on table public.phantom_pricing_log from anon, authenticated, public;
grant select, insert on table public.phantom_pricing_log to service_role;

-- --------------------------------------------------------------------------
-- sentinel_log  (insert always, update only for resolution)
-- --------------------------------------------------------------------------

create table if not exists public.sentinel_log (
  id               uuid        primary key default gen_random_uuid(),

  occurred_at      timestamptz not null default timezone('utc', now()),

  event_type       text        not null,
  threat_level     text        not null,
  action           text        not null,

  subject_type     text        not null,
  subject_id       text,
  request_id       uuid,
  source_ip        inet,

  evidence         jsonb       not null default '[]'::jsonb,
  metadata         jsonb       not null default '{}'::jsonb,

  resolved_at      timestamptz,
  resolved_by      uuid        references auth.users(id) on delete set null,
  resolution_note  text,

  created_at       timestamptz not null default timezone('utc', now()),

  constraint sentinel_event_type_nonempty
    check (length(trim(event_type)) > 0),
  constraint sentinel_threat_level_valid
    check (threat_level in ('low', 'medium', 'high', 'critical')),
  constraint sentinel_action_valid
    check (action in ('allow', 'flag', 'block', 'require_human_approval')),
  constraint sentinel_subject_type_nonempty
    check (length(trim(subject_type)) > 0),
  constraint sentinel_evidence_is_array
    check (jsonb_typeof(evidence) = 'array'),
  constraint sentinel_metadata_is_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint sentinel_resolution_consistent
    check (
      (resolved_at is null and resolved_by is null and resolution_note is null)
      or resolved_at is not null
    )
);

create index if not exists sentinel_log_occurred_at_idx
  on public.sentinel_log (occurred_at desc);
create index if not exists sentinel_log_open_incidents_idx
  on public.sentinel_log (threat_level, occurred_at desc)
  where resolved_at is null;
create index if not exists sentinel_log_subject_idx
  on public.sentinel_log (subject_type, subject_id, occurred_at desc);
create index if not exists sentinel_log_evidence_gin
  on public.sentinel_log using gin (evidence);

alter table public.sentinel_log enable row level security;
alter table public.sentinel_log force row level security;
revoke all on table public.sentinel_log from anon, authenticated, public;
grant select, insert, update on table public.sentinel_log to service_role;

commit;
