# Pin Courier companion-issue compatibility

Inactive implementation; activation and deployment require the separately reviewed
central rollout. No service environment change is part of this implementation.

Delivery: [Office issue 133](https://github.com/JFusco/the-office/issues/133),
with [central issue 29](https://github.com/JFusco/renovate-config/issues/29).

`OFFICE_PIN_COURIER_CENTRAL_ISSUES=true` enables the handoff only for
`JFusco/brain` and `JFusco/cms-field-vocabulary`. The default is disabled, retaining
the existing Office issue creation. Migrator is never a handoff target; this work
does not enroll it in Office or change its Renovate dependency updates.

With handoff enabled, existing Joe-created/assigned Office tracking issues remain
valid. A central issue is accepted only with the numeric Pin Courier identity,
exact repository issue URL, repository/PR companion marker and Office tracking
marker. Known issue identities are retained. Duplicates, closed records and
changed known records stop adoption for reconciliation rather than creating a
replacement. A missing issue waits for the central runner without issuing a
competing POST. Dependabot and wiki-sync lookup/creation are unchanged.

The compatibility enters the existing adoption path: native closing links,
review cards, current-head verification, holds, merge readiness and closeout
continue through the existing harness. This does not grant merge authority or
replace those checks. Provider mutations remain inside existing Effects.

Activation order: reviewed inactive code and tests; approved idle-service
deployment; explicit handoff enablement; central admission for Brain/CMS; live
read-back of issue reuse and native adoption. Keep the handoff enabled during a
central outage so Office cannot create duplicates. Before disabling compatibility
or restoring an older Office build, reconcile central-issued records and known
adoptions. Preserve all existing issues during rollback.
