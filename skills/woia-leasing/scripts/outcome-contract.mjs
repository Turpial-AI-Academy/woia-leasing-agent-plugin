import { createHash } from 'node:crypto';

const text = value => typeof value === 'string' && value.trim().length > 0;
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const assert = (value, code) => { if (!value) throw new Error(code); };
const stable = value => Array.isArray(value) ? value.map(stable) : plain(value)
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
export const outcomeDescriptorDigest = descriptor => createHash('sha256').update(JSON.stringify(stable(descriptor))).digest('hex');

/** Resolve only through the embedding host. A JSON request cannot supply this port. */
export function resolveOutcomeContract(request, { resolveTrustedContext } = {}) {
  assert(plain(request) && Object.keys(request).every(key => ['org_id', 'scope', 'task_ref', 'purpose', 'subject_ref'].includes(key)), 'INVALID_OUTCOME_SCOPE');
  assert(['org_id', 'scope', 'task_ref', 'purpose', 'subject_ref'].every(key => text(request[key])), 'OUTCOME_SCOPE_REQUIRED');
  assert(typeof resolveTrustedContext === 'function', 'TRUSTED_OUTCOME_RESOLVER_REQUIRED');
  const context = resolveTrustedContext(Object.freeze(structuredClone(request)));
  assert(plain(context) && context.authenticated === true && context.current === true, 'AUTHENTICATED_CURRENT_CONTEXT_REQUIRED');
  assert(Object.keys(request).every(key => context[key] === request[key]), 'OUTCOME_SCOPE_MISMATCH');
  const binding = context.outcome_binding, source = context.domain_source;
  assert(plain(binding) && binding.status === 'ACCEPTED_CURRENT' && plain(source) && source.current === true, 'ACCEPTED_OUTCOME_CONTRACT_REQUIRED');
  const descriptor = binding.descriptor;
  assert(plain(descriptor) && descriptor.schema === 'dev.woia.outcome-contract/v1' &&
    Object.keys(descriptor).every(key => ['schema','id','revision','source_ref','org_id','scope','subject_ref','department','phases'].includes(key)), 'INVALID_OUTCOME_DESCRIPTOR');
  assert(['id','revision','source_ref','department'].every(key => text(descriptor[key])) &&
    ['org_id','scope','subject_ref'].every(key => descriptor[key] === request[key]), 'DESCRIPTOR_SCOPE_MISMATCH');
  assert(plain(descriptor.phases) && Object.keys(descriptor.phases).length > 0 &&
    Object.entries(descriptor.phases).every(([phase, facts]) => text(phase) && Array.isArray(facts) && facts.length > 0 &&
      facts.every(text) && new Set(facts).size === facts.length), 'INVALID_REQUIRED_OUTCOMES');
  const digest = outcomeDescriptorDigest(descriptor);
  assert(binding.source_ref === descriptor.source_ref && binding.revision === descriptor.revision &&
    binding.digest_sha256 === digest && source.source_ref === descriptor.source_ref &&
    source.revision === descriptor.revision && source.digest_sha256 === digest, 'OUTCOME_CONTRACT_BINDING_MISMATCH');
  assert(plain(context.fact_bindings), 'ACCEPTED_FACT_BINDINGS_REQUIRED');
  return { descriptor: structuredClone(descriptor), fact_bindings: structuredClone(context.fact_bindings) };
}
