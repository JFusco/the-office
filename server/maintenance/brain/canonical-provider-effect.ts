export interface ProviderEffectIdentity {kind:string;target:string}
export interface ProviderEffectContext {repositoryPath:string;originalWorkId:string}
/** Exact observed spellings only. Projection for comparison; never rewrites the raw audit. */
export function canonicalProviderEffectIdentity(effect:ProviderEffectIdentity,context:ProviderEffectContext):ProviderEffectIdentity {
 const {kind}=effect;let {target}=effect;
 if(kind==='git-fetch'&&context.repositoryPath&&[`${context.repositoryPath}: origin`,`${context.repositoryPath} origin`].includes(target))
  target=`${context.repositoryPath}: origin`;
 if(kind==='native-claim'&&context.originalWorkId&&[`Brain native maintenance/publication claims for ${context.originalWorkId}`,`Brain original attempt ${context.originalWorkId}`].includes(target))
  target=`Brain native maintenance/publication claims for ${context.originalWorkId}`;
 return {kind,target};
}
