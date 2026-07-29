# Funnel Upgrade Roadmap — "Best in Class"

_Generated 2026-07-16 from parallel assessments of all 5 funnel stages. Executed autonomously via `/loop`._

**Cross-cutting theme:** the funnel currently makes claims/artifacts that are **fake, generic, or unverified**. Best-in-class = every claim true, specific, personalized, end-to-end. Prioritized by leverage ÷ effort, correctness/reputation bugs first.

## Wave 1 — correctness & trust bugs (low effort, execute first)

- [x] **W1.1 Audit reachability guard** ✅ 2026-07-16 — added `reachable` to `AuditSignals`; unreachable sites no longer scored as gaps or pitched with false faults; presentation omits problems slide; automation-plan prompt told site is unverified; real UA + 8s timeout added. 25 tests pass, tsc clean. `lib/lead-audit.ts`, `lib/lead-scoring.ts`, `app/(client)/claim/[slug]/presentation/page.tsx`, `lib/automation-plan/generate.ts`, tests.
- [x] **W1.2 Wire pitch_angle into the email** ✅ 2026-07-16 — composer now pre-fills a specific problem→proof→CTA draft from the audit angle (automation pool), shows an "Angle from audit" hint chip, and personalizes the WhatsApp message; `proofFragment()` strips internal shorthand before the wire. 5 new unit tests, tsc clean. `components/sales/outreach-composer.tsx`, `app/(sales)/sales/leads/[id]/page.tsx`, `__tests__/lib/proof-fragment.test.ts`.
- [x] **W1.3 Fix fabricated testimonials** ✅ 2026-07-16 — removed fake-client quotes; section is now data-driven & real-only via `lib/testimonials.ts` (currently empty → section omits itself). tsc clean. `app/(client)/claim/[slug]/components/testimonials-section.tsx`, `lib/testimonials.ts`. NOTE: trust-section also has unverified "100% Satisfaction Rate" + "no questions asked" guarantee — flagged for user (see decisions).
- [x] **W1.4 Fix maintenance-pack upsell wiring** ✅ 2026-07-16 — `addMaintenance` now threads client→server; opt-in persisted on the claim as a recurring commitment (`maintenance_selected`, `maintenance_monthly_cents`) — correctly NOT added to the one-time charge; price centralized in `lib/claim-pricing.ts`. 241 tests pass, tsc clean. ⚠️ **DEPLOY DEP: migration `20260716000001_claims_maintenance_addon.sql` must be applied to the live DB (manual SQL editor per project convention) before this ships, or the claim write will fail.** `confirmation-step.tsx`, `claim-page-client.tsx`, `claim-actions.ts`, `lib/claim-pricing.ts`, migration.
- [x] **W1.5 Fix upsell Razorpay key bug** ✅ 2026-07-16 — upsell checkout now uses the mode-aware `NEXT_PUBLIC_RAZORPAY_{TEST,LIVE}_KEY_ID` pair instead of the non-existent `NEXT_PUBLIC_RAZORPAY_KEY_ID`. tsc clean. `upsell-client.tsx`.

**✅ WAVE 1 COMPLETE (5/5).**

## Wave 2 — credibility & volume levers (medium effort)

- [x] **W2.1 Unify dedup across projects + lead_lists** ✅ 2026-07-16 — shared `findExistingPlaceIds()` (lib/discovery-dedup.ts) now checks lead_lists AND projects under BOTH json key casings (`placeId` admin / `place_id` sales); wired into both discovery paths so the same business is never double-discovered. Expression-index migration added (perf). 5 helper tests + full suite (254) pass. ⚠️ **Follow-up (needs data cleanup, NOT done):** a hard UNIQUE constraint requires de-duping existing rows first — deferred; see migration note. `lib/discovery-dedup.ts`, `lib/discovery.ts`, `lib/lead-discovery.ts`, migration `20260716000002`. ⚠️ **DEPLOY DEP: apply migration `20260716000002` to live DB.**
- [x] **W2.2 Before-screenshot side-by-side in deck** ✅ 2026-07-16 — `captureExternalScreenshot`/`captureAuditScreenshot` (fail-soft, bot-block-safe) capture the prospect's real site during pitch prep (fire-and-forget in automation-plan gen); pitch deck renders before/after when both exist. UA already added in W1.1. 254 tests pass, tsc clean. ⚠️ Puppeteer path needs deploy-preview verification (unrunnable locally, like existing `generateScreenshot`). ⚠️ **DEPLOY DEP: apply migration `20260716000003`.** (Headless *audit-timing* fallback deferred — UA+8s from W1.1 covers most false-unreachable; real CWV timing is a larger add.) `lib/screenshot.ts`, `lib/automation-plan/generate.ts`, `app/(client)/pitch/[slug]/presentation/page.tsx`, migration.
- [x] **W2.3 Add SEO/design signals** ✅ 2026-07-16 — audit now captures title/meta-description/H1-count/img-alt-coverage/OG (robust, attribute-order-safe); surfaced as credible deck findings ("Blank Google preview") and flows into the automation-plan prompt automatically. Not added to scoring (keeps the calibrated 0-40 scale). 13 audit tests. `lib/lead-audit.ts`, `lib/lead-scoring.ts`, `app/(client)/claim/[slug]/presentation/page.tsx`.
- [x] **W2.4 Fetch primaryType/types/businessStatus** ✅ 2026-07-16 — Places field mask extended; permanently/temporarily closed businesses filtered out of discovery; scoring now resolves niche from the Google-verified type (`resolveNicheCategory`) so mistyped/broad searches no longer drop qualifying leads. 33 tests pass. `lib/google-places.ts`, `lib/lead-scoring.ts`, `lib/lead-discovery.ts`.
- [x] **W2.5 Follow-up "due today" queue** ✅ 2026-07-16 (built as rep-triggered queue per user decision — NO autonomous sending). Surfaces two categories the call-based queue misses: email-sequence follow-ups (emailed 3–14d ago, <3 sends, no reply, unpaid) + claim abandoners (opened checkout/claim, unpaid, in-window). Rendered on `/sales/followups`; send path still re-checks suppression. Pure classifier unit-tested (7 tests). 269 pass, tsc clean. `lib/sales/followup-queue.ts`, `app/(sales)/sales/followups/page.tsx`.

## Wave 3 — bigger bets (needs a product/cost decision — SURFACE to user)

- [ ] **W3.1 Frontier model as default generation** (Anthropic API, not the compliance-gray CLI hack limited to 10 leads). Highest single lever on reply rate, but real $ cost + rollout decision. `lib/generation/claude-cli.ts`, `lib/ai/model-config.ts`, `lib/ai/generator.ts`. **[M + decision]**
- [ ] **W3.2 Static HTML preview artifact** (build step) replacing CDN-Babel-srcdoc live transpile for prospect-facing links. Fixes blank/unstyled-page risk + sub-2s load. **[L]**
- [ ] **W3.3 ESP migration** (Postmark/SES/Resend) + SPF/DKIM/DMARC + bounce/complaint/reply webhooks → suppression. Off single Gmail SMTP. **[M/L + decision]**
- [ ] **W3.4 OTP/magic-link account creation** replacing email-equality trust. Known security gap. **[M]**
- [x] **W3.5 Mobile-viewport (375px) screenshot + overflow QA** ✅ 2026-07-16 — `generateScreenshot` now also renders at 375px, stores `screenshot_url_mobile`, and flags `mobile_overflow` (horizontal overflow = broken phone layout); fail-soft (never loses the desktop shot), logs a warning on overflow. Stored + logged (no admin gallery exists to badge yet — follow-up). tsc + build clean. ⚠️ Puppeteer path needs deploy verification. ⚠️ **DEPLOY DEP: apply migration `20260716000004`.** `lib/screenshot.ts`, migration.
- [x] **W3.6 Content-fabrication check** ✅ 2026-07-16 — `detectPlaceholderContent()` gates `validateGeneratedCode`; high-harm/near-zero-false-positive placeholders (fake 555 phones, @example.com, John/Jane Doe, lorem ipsum, yourbusiness.com) now fail validation → auto-fix loop regenerates via the DATA_MAPPING prompt ("no invented data"). 8 tests (incl. false-positive guards). 262 pass, tsc clean. `lib/ai/fabrication.ts`, `lib/ai/validation.ts`, `lib/ai/error-classifier.ts`.

## Decisions (answered 2026-07-16)
- **W3.1 frontier-model generation → DECLINED for now.** Keep Gemini Flash default. (Biggest reply-rate lever, but cost held.)
- **W2.5 follow-ups → "due today" QUEUE, rep-triggered, NO autonomous sending.** (Safest for sender reputation.)
- **W3.3 ESP → DECLINED.** Stay on Gmail SMTP.
- Still open: Razorpay USD settlement for international cards (flagged in claim assessment); trust-section "100% Satisfaction" + "no questions asked" guarantee (verify real policy).

## Progress log
- 2026-07-16: roadmap created from 5-stage assessment.
- 2026-07-16: W1.1 done (audit reachability guard). W1.2 done (pitch angle → email/WhatsApp).
- 2026-07-16: W1.3 (fabricated testimonials → real-only/omit), W1.4 (maintenance upsell wired + persisted, needs migration applied), W1.5 (upsell razorpay key) done. **Wave 1 complete, 241 tests pass, tsc clean.**
- 2026-07-16: W2.3 (SEO/design audit signals) + W2.4 (verified category + closed-business filter) done. **249 tests pass, tsc clean.**
- 2026-07-16: W2.1 (cross-table dedup unification) done. **254 tests pass, tsc clean.**
- 2026-07-16: W2.2 (before/after screenshot in deck) done. **254 tests pass, tsc clean.**
- 2026-07-16: W3.6 (content-fabrication guard) done. **262 tests pass.**
- 2026-07-16: User decisions — keep Gemini (W3.1 declined), follow-ups as rep queue (not auto-send), stay on Gmail SMTP (W3.3 declined).
- 2026-07-16: W2.5 (rep follow-up "due today" queue) done. **269 tests pass, tsc clean.**
- 2026-07-16: **Autonomous /loop wound down after 11 verified upgrades** (Wave 1 ×5, Wave 2 ×4, W3.6, W2.5). Every unambiguously-implementable + verifiable gap is closed. Remaining items need a user call or deploy verification:
  - **W3.4 OTP account security** — reworks live payment→account auth; ship only with review + deploy verification (a bug could lock out paying customers).
  - **W3.5 mobile 375px QA screenshot** — CLAUDE-mandated, low leverage, Puppeteer (deploy-verify only).
  - **W3.2 static-HTML preview artifact** — large; removes blank/unstyled-page risk.
  - Parked decisions: Razorpay USD settlement; trust-section "100% Satisfaction"/"no questions asked" guarantee wording.
  - **3 migrations still need manual application** (see list above).
  - No commits made — all changes in working tree for review.
- 2026-07-16: **Integration verification passed** — `next build` exit 0 (all routes compile), eslint exit 0 (pre-existing warnings only), 269 unit tests pass, tsc clean. Chose to verify the full build rather than rework the live account-auth flow (W3.4) blind, because the OTP fix needs Supabase Auth email configured — if it isn't, account creation breaks for ALL paying customers. W3.4 is ready to implement once that's confirmed + a deploy preview is available.
- 2026-07-16: **W3.5 (mobile 375px QA) done — 12 upgrades total.** 269 tests, tsc + build clean. 4 migrations now pending. Remaining: W3.4 (auth security — needs Supabase email confirmed + deploy verify), W3.2 (static preview — L). Mobile-overflow admin badge is a small follow-up (no gallery exists yet).

## Migrations to apply to live DB (manual SQL editor, per project convention)
- `20260716000001_claims_maintenance_addon.sql` (W1.4)
- `20260716000002_project_place_id_dedup_index.sql` (W2.1)
- `20260716000003_projects_audit_screenshot.sql` (W2.2)
- `20260716000004_projects_mobile_qa.sql` (W3.5)
