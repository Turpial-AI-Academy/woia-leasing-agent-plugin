# Accepted outcome contract

Load this resource before calling `evaluateOutcome`.

The scope request contains only `org_id`, `scope`, `task_ref`, `purpose` and `subject_ref`. A separate `resolveTrustedContext` function belongs to the embedding host. It resolves authenticated current scope, an `outcome_binding`, a `domain_source` and `fact_bindings` from independently verified organization/source records. Requests cannot supply a descriptor, policy, resolver module path or authority flags.

The descriptor uses `dev.woia.outcome-contract/v1` with `id`, `revision`, `source_ref`, `org_id`, `scope`, `subject_ref`, `department` and `phases`. Each phase maps to a nonempty list of distinct required fact names. Only the competent accepted contract determines these requirements; there is no mandatory universal money, signature or physical fulfillment template.

`outcome_binding.status` is `ACCEPTED_CURRENT`. Its source reference, revision and `digest_sha256` match both the descriptor and a current `domain_source`. The digest is SHA-256 of recursively key-sorted JSON; use `outcomeDescriptorDigest` from `scripts/outcome-contract.mjs`. The host rechecks source acceptance, applicable policy and scope before resolving this context. Digest equality alone is not source acceptance.

Every supplied required fact has `status: ACCEPTED`, a nonempty `evidence_ref` and `version`. The independently resolved host entry in `fact_bindings[factName]` has `status: ACCEPTED_CURRENT` and the identical evidence and version. Missing, stale, forged, altered or differently scoped inputs block evaluation. A descriptor for another department is rejected.

The result is evidence readiness for competent owner review, with exact contract source/revision. It never dispatches, persists, grants authority or accepts a business fact. Qualified stores/adapters remain responsible for authentication, access, concurrency, revocation and real acceptance.
