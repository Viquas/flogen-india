-- Store a "before" screenshot of the prospect's real website, captured during
-- automation-pitch prep (lib/screenshot.ts captureAuditScreenshot). Rendered
-- side-by-side with the generated demo ("after") in the pitch deck for
-- before/after proof — the single strongest persuasion element in cold outreach.

alter table projects
  add column if not exists audit_screenshot_url text;

comment on column projects.audit_screenshot_url is
  'Screenshot URL of the prospect''s existing website (the "before" in before/after).';
