-- ============================================================
-- Mermicorn Vacation Rental — Supabase Schema
-- Run via: supabase db push
-- ============================================================

-- Bookings
create table if not exists bookings (
  id            uuid primary key default gen_random_uuid(),
  guest_name    text not null,
  guest_email   text not null,
  platform      text not null check (platform in ('airbnb','vrbo','direct','email')),
  check_in      date not null,
  check_out     date not null,
  guests        int not null default 1,
  nightly_rate  numeric(10,2),
  total_amount  numeric(10,2),
  status        text not null default 'pending'
                  check (status in ('pending','confirmed','active','completed','cancelled')),
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Guest messages (inbound)
create table if not exists guest_messages (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid references bookings(id) on delete set null,
  guest_name    text not null,
  guest_email   text not null,
  platform      text not null,
  body          text not null,
  received_at   timestamptz default now()
);

-- AI-generated replies
create table if not exists ai_replies (
  id                uuid primary key default gen_random_uuid(),
  message_id        uuid references guest_messages(id) on delete cascade,
  draft             text not null,
  topic             text,
  sentiment         text,
  confidence        numeric(4,3),
  auto_send         boolean default false,
  escalate          boolean default false,
  escalation_reason text,
  sent_at           timestamptz,
  approved_by       text,
  created_at        timestamptz default now()
);

-- Scheduled outbound messages
create table if not exists scheduled_messages (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid references bookings(id) on delete cascade,
  guest_email   text not null,
  guest_name    text not null,
  topic         text not null,
  send_at       timestamptz not null,
  status        text not null default 'pending'
                  check (status in ('pending','sent','failed')),
  sent_at       timestamptz,
  error         text,
  created_at    timestamptz default now()
);

-- Ad listings
create table if not exists listings (
  id              uuid primary key default gen_random_uuid(),
  platform        text not null,
  listing_url     text,
  title           text not null,
  description     text,
  nightly_rate    numeric(10,2),
  status          text not null default 'draft'
                    check (status in ('draft','active','paused','archived')),
  last_synced_at  timestamptz,
  created_at      timestamptz default now()
);

-- Row-level security
alter table bookings enable row level security;
alter table guest_messages enable row level security;
alter table ai_replies enable row level security;
alter table scheduled_messages enable row level security;
alter table listings enable row level security;

-- Service role bypass (for API routes using SUPABASE_SERVICE_ROLE_KEY)
create policy "service role full access" on bookings
  for all using (auth.role() = 'service_role');
create policy "service role full access" on guest_messages
  for all using (auth.role() = 'service_role');
create policy "service role full access" on ai_replies
  for all using (auth.role() = 'service_role');
create policy "service role full access" on scheduled_messages
  for all using (auth.role() = 'service_role');
create policy "service role full access" on listings
  for all using (auth.role() = 'service_role');
