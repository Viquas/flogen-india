-- Persist the Maintenance Pack upsell selected on the claim confirmation modal.
--
-- Previously the "Maintenance Pack" checkbox in the payment modal was collected in
-- component state but never sent to the server, so every opt-in was silently
-- discarded — lost recurring revenue and a trust gap (the customer believed they
-- had signed up). This records the selection so it can be onboarded/billed.
--
-- It is a RECURRING MONTHLY add-on ($99 standard / $149 pro), billed separately
-- from the one-time website charge (claims.amount_paise), so it is intentionally
-- NOT folded into the Razorpay order amount.

alter table claims
  add column if not exists maintenance_selected boolean not null default false,
  add column if not exists maintenance_monthly_cents integer;

comment on column claims.maintenance_selected is
  'Customer opted into the recurring Maintenance Pack at checkout.';
comment on column claims.maintenance_monthly_cents is
  'Monthly Maintenance Pack price in cents at time of opt-in (null if not selected).';
