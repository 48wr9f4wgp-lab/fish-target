export function versionContract({config,html,worker}){
  const errors=[];
  const version=config.version;
  const buildId=version.toLowerCase();
  if(!html.includes(`<title>FISH TARGET ${version}</title>`))errors.push('HTML title version mismatch');
  if(!html.includes(`<span class="version">${version}</span>`))errors.push('HTML badge version mismatch');
  if(!html.includes(`TARGET GAME PLAN · ${version}`))errors.push('result header version mismatch');
  if(!html.includes(`data-build="${buildId}"`))errors.push('HTML build id mismatch');
  if(!worker.includes(`fish-target-shell-${buildId}`))errors.push('SW cache version mismatch');
  if(!html.includes(`data-field-live="${config.features?.fieldLive?'on':'off'}"`))errors.push('fieldLive feature mismatch');
  if(/__(?:BUILD_VERSION|BUILD_ID|CACHE_BUILD_ID|FIELD_LIVE_STATE|SHELL_MANIFEST)__/.test(html+worker))errors.push('unresolved build token');

  const localAssets=[...html.matchAll(/(?:href|src)="(?!https?:|#)([^"?]+)(?:\?v=([^"&]+))?"/g)];
  for(const [,asset,assetVersion] of localAssets){
    if(asset==='manifest.webmanifest'||asset.endsWith('.css')||asset.endsWith('.js')||asset.endsWith('.svg')||asset.endsWith('.png')){
      if(assetVersion!==buildId)errors.push(`asset version mismatch: ${asset}`);
    }
  }
  return errors;
}