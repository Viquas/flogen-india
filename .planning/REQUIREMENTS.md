# Requirements: Flogen — Lead Lists & Custom Builds

**Defined:** 2026-03-26
**Core Value:** Maximize high-quality websites generated per hour with minimal manual intervention, and convert them into paying clients.

## v5.0 Requirements

Requirements for Lead Lists & Custom Builds milestone. Each maps to roadmap phases.

### Lead Lists

- [x] **LEAD-01**: User can click "Get List" in Discovery Engine to fetch Google Places results without triggering generation
- [x] **LEAD-02**: Lead results are saved to `lead_lists` table with batch grouping and full RJSON
- [x] **LEAD-03**: User can view lead batches at /dashboard/leads filtered by date
- [x] **LEAD-04**: User can click a lead row to view full RJSON in a detail popup
- [x] **LEAD-05**: User can click "Generate Website" from a lead to run it through the full generation pipeline
- [x] **LEAD-06**: User can download a CSV of any batch (name, email, phone, location, maps URL)
- [x] **LEAD-07**: "Lead Lists" menu item appears in sidebar under Fulfillment

### Custom Build

- [x] **CUST-01**: User can click "Custom Build" on dashboard header to open the custom build modal
- [x] **CUST-02**: User can paste a Google Maps URL to generate a website from that business
- [x] **CUST-03**: User can paste/upload business data (text or JSON) to generate a website
- [x] **CUST-04**: Custom-built projects are tagged with `source='custom'` on the projects table
- [ ] **CUST-05**: User can view custom-built projects at /dashboard/custom filtered by source
- [ ] **CUST-06**: "Custom Builds" menu item appears in sidebar under Fulfillment

### Schema

- [x] **SCHM-01**: `lead_lists` table created with batch_id, business fields, raw_data JSONB, and indexes
- [x] **SCHM-02**: `source` column added to projects table (default 'discovery', values: discovery/custom/code-drop)

## Future Requirements

None — scope is complete for v5.0.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Lead list email sending | Will use Instantly AI later, not part of this milestone |
| Bulk "Generate Website" from lead list | One-at-a-time from detail popup is sufficient for v5.0 |
| Auto-enrichment on lead save | Enrichment happens at generation time, not discovery time |
| Custom build from Yelp/other sources | Google Maps/Places only for v5.0 |
| Client-facing flows for custom builds | Custom builds are internal/admin-only, no claim/portal |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHM-01 | Phase 21 | Complete |
| SCHM-02 | Phase 21 | Complete |
| LEAD-01 | Phase 21 | Complete |
| LEAD-02 | Phase 21 | Complete |
| LEAD-07 | Phase 21 | Complete |
| LEAD-03 | Phase 22 | Complete |
| LEAD-04 | Phase 22 | Complete |
| LEAD-05 | Phase 22 | Complete |
| LEAD-06 | Phase 22 | Complete |
| CUST-01 | Phase 23 | Complete |
| CUST-02 | Phase 23 | Complete |
| CUST-03 | Phase 23 | Complete |
| CUST-04 | Phase 23 | Complete |
| CUST-05 | Phase 23 | Pending |
| CUST-06 | Phase 23 | Pending |

**Coverage:**
- v5.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after roadmap creation*
