-- Cost tracking silently failed: lib/ai/cost-tracker.ts inserts prompt_version_id
-- but the live generation_costs table lacks the column. Add it (nullable) so
-- cost rows persist again.
alter table generation_costs add column if not exists prompt_version_id text;
