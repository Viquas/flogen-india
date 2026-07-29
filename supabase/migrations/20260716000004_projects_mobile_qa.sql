-- Mobile QA for generated sites. CLAUDE.md requires every generated site to look
-- good at 375px, but nothing captured/checked mobile before. generateScreenshot now
-- also renders at 375px, stores a mobile preview, and flags horizontal overflow
-- (a broken-at-phone-width layout) for review — without blocking the pipeline.

alter table projects
  add column if not exists screenshot_url_mobile text,
  add column if not exists mobile_overflow boolean;

comment on column projects.screenshot_url_mobile is
  'Screenshot of the generated site rendered at 375px (mobile).';
comment on column projects.mobile_overflow is
  'True when the generated site overflows horizontally at 375px (broken mobile layout).';
