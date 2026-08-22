import type { Database, Json } from './supabase';

/**
 * Tables declared in supabase/migrations/20260812073400_agent_audit_tables.sql.
 *
 * The connected Supabase project does not yet include this migration. This
 * extension lets TypeScript validate code against the reviewed target schema,
 * but the migration must be applied to staging and production before deploying
 * any route that reads or writes these tables. Regenerate types afterwards and
 * remove this extension once the generated contract includes these tables.
 */
type AgentAuditTables = {
  oracle_forecasts: {
    Row: {
      id: string;
      period_starts_at: string;
      period_ends_at: string;
      demand_score: number;
      confidence: number;
      model_version: string;
      generated_at: string;
      signals: Json;
      is_stale: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      period_starts_at: string;
      period_ends_at: string;
      demand_score: number;
      confidence: number;
      model_version: string;
      generated_at?: string;
      signals?: Json;
      is_stale?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      period_starts_at?: string;
      period_ends_at?: string;
      demand_score?: number;
      confidence?: number;
      model_version?: string;
      generated_at?: string;
      signals?: Json;
      is_stale?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  phantom_pricing_log: {
    Row: {
      id: string;
      forecast_id: string;
      stay_period_starts_at: string;
      stay_period_ends_at: string;
      currency_code: string;
      recommended_nightly_rate_cents: number;
      minimum_nightly_rate_cents: number;
      maximum_nightly_rate_cents: number;
      estimated_total_cents: number;
      confidence: number;
      disposition: string;
      strategy: string;
      model_version: string;
      rationale: Json;
      created_at: string;
    };
    Insert: {
      id?: string;
      forecast_id: string;
      stay_period_starts_at: string;
      stay_period_ends_at: string;
      currency_code?: string;
      recommended_nightly_rate_cents: number;
      minimum_nightly_rate_cents: number;
      maximum_nightly_rate_cents: number;
      estimated_total_cents: number;
      confidence: number;
      disposition: string;
      strategy: string;
      model_version: string;
      rationale?: Json;
      created_at?: string;
    };
    Update: {
      id?: string;
      forecast_id?: string;
      stay_period_starts_at?: string;
      stay_period_ends_at?: string;
      currency_code?: string;
      recommended_nightly_rate_cents?: number;
      minimum_nightly_rate_cents?: number;
      maximum_nightly_rate_cents?: number;
      estimated_total_cents?: number;
      confidence?: number;
      disposition?: string;
      strategy?: string;
      model_version?: string;
      rationale?: Json;
      created_at?: string;
    };
    Relationships: [];
  };
  sentinel_log: {
    Row: {
      id: string;
      occurred_at: string;
      event_type: string;
      threat_level: string;
      action: string;
      subject_type: string;
      subject_id: string | null;
      request_id: string | null;
      source_ip: string | null;
      evidence: Json;
      metadata: Json;
      resolved_at: string | null;
      resolved_by: string | null;
      resolution_note: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      occurred_at?: string;
      event_type: string;
      threat_level: string;
      action: string;
      subject_type: string;
      subject_id?: string | null;
      request_id?: string | null;
      source_ip?: string | null;
      evidence?: Json;
      metadata?: Json;
      resolved_at?: string | null;
      resolved_by?: string | null;
      resolution_note?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      occurred_at?: string;
      event_type?: string;
      threat_level?: string;
      action?: string;
      subject_type?: string;
      subject_id?: string | null;
      request_id?: string | null;
      source_ip?: string | null;
      evidence?: Json;
      metadata?: Json;
      resolved_at?: string | null;
      resolved_by?: string | null;
      resolution_note?: string | null;
      created_at?: string;
    };
    Relationships: [];
  };
};

export type CommandBoardDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Database['public']['Tables'] & AgentAuditTables;
  };
};
