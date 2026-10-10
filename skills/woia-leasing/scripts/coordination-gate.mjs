import { resolveOutcomeContract } from './outcome-contract.mjs';
const department="leasing";
export function evaluateCoordination(input){
 const blockers=[];const require=(ok,code)=>{if(!ok)blockers.push(code)};
 require(input&&typeof input==='object'&&!Array.isArray(input),'INVALID_INPUT');if(blockers.length)return {result:'BLOCKED',blockers};
 require(input.department===department,'DEPARTMENT_MISMATCH');
 for(const key of ['organization','actor','purpose','subject_ref','subject_version','operation_id','policy_version','source_map_version'])require(typeof input[key]==='string'&&input[key].trim().length>0,'MISSING_'+key.toUpperCase());
 require(input.access_authenticated===true&&input.access_authorized===true,'ACCESS_DENIED');
 require(input.source_status==='ACCEPTED_CURRENT','SOURCE_UNKNOWN_OR_STALE');
 require(input.authority_status==='EFFECTIVE'&&input.authority_version===input.subject_version,'AUTHORITY_NOT_BOUND');
 require(input.grant && ['organization','actor','purpose','subject_ref','subject_version'].every(k=>input.grant[k]===input[k]) && input.grant.operation===input.operation,'EXACT_SCOPE_GRANT_REQUIRED');
 require(input.effect_status==='NONE'||input.effect_status==='RECONCILED','RECONCILE_BEFORE_RETRY');
 require(Array.isArray(input.evidence_refs)&&input.evidence_refs.length>0&&input.evidence_refs.every(v=>typeof v==='string'&&v.trim()),'EVIDENCE_REQUIRED');
 const allowed=['prepare','evaluate','request-contribution','record-contribution','close-contribution'];require(allowed.includes(input.operation),'UNSUPPORTED_OPERATION');
 if(input.operation==='request-contribution')require(typeof input.receiver==='string'&&input.receiver.trim()&&input.core_transport==='QUALIFIED','RECEIVER_OR_TRANSPORT_UNAVAILABLE');
 if(input.operation==='record-contribution')require(input.receiver_acceptance==='ACCEPTED'&&input.correlation_id&&input.contribution_status==='EVIDENCED','CONTRIBUTION_NOT_ACCEPTED');
 if(input.operation==='close-contribution')require(input.competent_acceptance==='ACCEPTED'&&input.fulfillment==='EVIDENCED'&&Array.isArray(input.residuals)&&input.residuals.every(r=>r.owner&&r.next_action),'FULFILLMENT_OR_RESIDUAL_OWNER_MISSING');
 require(!input.external_contact&&!input.scheduling_mutation&&!input.financial_effect&&!input.autonomous_negotiation&&!input.business_fact_write,'OWNER_BOUNDARY_VIOLATION');
 return {result:blockers.length?'BLOCKED':'PASS',blockers,department,operation_id:input.operation_id,dispatch:false,business_fact_written:false};
}

export function evaluateOutcome(phase, facts, scope, ports){
 let resolved;try{resolved=resolveOutcomeContract(scope,ports)}catch(error){return {result:'BLOCKED',blockers:[error.message],accepted_business_fact:false,dispatch:false}};
 const {descriptor,fact_bindings}=resolved;
 if(descriptor.department!==department)return {result:'BLOCKED',blockers:['OUTCOME_DEPARTMENT_MISMATCH'],accepted_business_fact:false,dispatch:false};
 const needed=Object.hasOwn(descriptor.phases,phase)?descriptor.phases[phase]:null;if(!needed)return {result:'BLOCKED',blockers:['UNKNOWN_METHOD_OUTCOME'],accepted_business_fact:false,dispatch:false};
 const blockers=needed.filter(key=>facts?.[key]?.status!=='ACCEPTED'||fact_bindings[key]?.status!=='ACCEPTED_CURRENT'||facts[key].evidence_ref!==fact_bindings[key].evidence_ref||facts[key].version!==fact_bindings[key].version||typeof facts[key].evidence_ref!=='string'||!facts[key].evidence_ref.trim()||typeof facts[key].version!=='string'||!facts[key].version.trim());
 return {result:blockers.length?'BLOCKED':'EVIDENCE_READY_FOR_OWNER_REVIEW',blockers,phase,contract_ref:descriptor.source_ref,contract_revision:descriptor.revision,accepted_business_fact:false,dispatch:false};
}
