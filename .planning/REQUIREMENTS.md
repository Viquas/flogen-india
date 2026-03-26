# Requirements: Flogen — Lead Lists & Custom Builds

**Defined:** 2026-03-26
**Core Value:** Maximize high-quality websites generated per hour with minimal manual intervention, and convert them into paying clients.

## v5.0 Requirements

Requirements for Lead Lists & Custom Builds milestone. Each maps to roadmap phases.

### Lead Lists

- [ ] **LEAD-01**: User can click "Get List" in Discovery Engine to fetch Google Places results without triggering generation
- [ ] **LEAD-02**: Lead results are saved to `lead_lists` table with batch grouping and full RJSON
- [ ] **LEAD-03**: User can view lead batches at /dashboard/leads filtered by date
- [ ] **LEAD-04**: User can click a lead row to view full RJSON in a detail popup
- [ ] **LEAD-05**: User can click "Generate Website" from a lead to run it through the full generation pipeline
- [ ] **LEAD-06**: User can download a CSV of any batch (name, email, phone, location, maps URL)
- [ ] **LEAD-07**: "Lead Lists" menu item appears in sidebar under Fulfillment

### Custom Build

- [ ] **CUST-01**: User can click "Custom Build" on dashboard header to open the custom build modal
- [ ] **CUST-02**: User can paste a Google Maps URL to generate a website from that business
- [ ] **CUST-03**: User can paste/upload business data (text or JSON) to generate a website
- [ ] **CUST-04**: Custom-built projects are tagged with `source='custom'` on the projects table
- [ ] **CUST-05**: User can view custom-built projects at /dashboard/custom filtered by source
- [ ] **CUST-06**: "Custom Builds" menu item appears in sidebar under Fulfillment

### Schema

- [ ] **SCHM-01**: `lead_lists` table created with batch_id, business fields, raw_data JSONB, and indexes
- [ ] **SCHM-02**: `source` column added to projects table (default 'discovery', values: discovery/custom/code-drop)

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
| SCHM-01 | TBD | Pending |
| SCHM-02 | TBD | Pending |
| LEAD-01 | TBD | Pending |
| LEAD-02 | TBD | Pending |
| LEAD-07 | TBD | Pending |
| LEAD-03 | TBD | Pending |
| LEAD-04 | TBD | Pending |
| LEAD-05 | TBD | Pending |
| LEAD-06 | TBD | Pending |
| CUST-01 | TBD | Pending |
| CUST-02 | TBD | Pending |
| CUST-03 | TBD | Pending |
| CUST-04 | TBD | Pending |
| CUST-05 | TBD | Pending |
| CUST-06 | TBD | Pending |

**Coverage:**
- v5.0 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14 (pending roadmap)

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after initial definition*
