-- Support fast cross-table place_id dedup during discovery (see lib/discovery-dedup.ts).
--
-- The two discovery paths historically wrote the Google Places id under different
-- json keys in projects.business_data:
--   admin site-gen  -> business_data->>'placeId'  (camelCase)
--   sales promoted  -> business_data->>'place_id' (snake_case)
-- so dedup must probe both keys. These expression indexes make those lookups (and
-- the lead_lists.place_id lookup) index-backed instead of full scans.
--
-- NOTE: intentionally NOT unique. Existing rows may already contain duplicates
-- (the historical bug this fixes), and legitimate project re-generation can reuse
-- a place_id, so a unique constraint would fail to create / break valid flows.
-- De-duplicating existing rows + adding a unique guard is a separate cleanup task.

create index if not exists idx_projects_business_placeid
  on projects ((business_data->>'placeId'));

create index if not exists idx_projects_business_place_id
  on projects ((business_data->>'place_id'));

create index if not exists idx_lead_lists_place_id
  on lead_lists (place_id);
