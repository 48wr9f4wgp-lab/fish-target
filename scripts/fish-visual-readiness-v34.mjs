import {readFileSync} from 'node:fs';
import {publicationReady} from './fish-asset-authoring.mjs';
import {loadContentModel} from './content-expansion-readiness.mjs';

const root=new URL('../',import.meta.url);
const readJson=file=>JSON.parse(readFileSync(new URL(file,root),'utf8'));
const text=value=>String(value??'').trim();

export const MASTER_VISUAL_PILOT=Object.freeze([
  Object.freeze({species:'ブリ・ワラサ',archetype:'saltwater-fish'}),
  Object.freeze({species:'ニジマス',archetype:'freshwater-fish'}),
  Object.freeze({species:'ヒラメ',archetype:'flatfish'}),
  Object.freeze({species:'アオリイカ',archetype:'cephalopod'})
]);

export async function collectVisualReadiness(){
  const model=await loadContentModel();
  const registeredNames=new Set(model.records.map(row=>text(row.name)).filter(Boolean));
  const assets=readJson('authoring/fish-assets.v1.json').assets||[];
  const candidates=readJson('authoring/fish-asset-candidates.v1.json').records||[];
  const bundled=assets.filter(asset=>registeredNames.has(text(asset.species_name)));
  const publication=bundled.filter(publicationReady);
  const publicationNames=new Set(publication.map(asset=>text(asset.species_name)));
  const bundledNames=new Set(bundled.map(asset=>text(asset.species_name)));
  const relevantCandidates=candidates.filter(record=>registeredNames.has(text(record.species_name)));
  const candidateByName=new Map(relevantCandidates.map(record=>[text(record.species_name),record]));
  const statusCounts=relevantCandidates.reduce((acc,record)=>{
    const status=text(record.status)||'unknown';
    acc[status]=(acc[status]||0)+1;
    return acc;
  },{});
  const verifiedCandidateNames=new Set(relevantCandidates.filter(record=>record.status==='verified-candidate').map(record=>text(record.species_name)));
  const taxonomyReviewNames=new Set(relevantCandidates.filter(record=>record.status==='taxonomy-review').map(record=>text(record.species_name)));
  const noCandidate= [...registeredNames].filter(name=>!publicationNames.has(name)&&!candidateByName.has(name));
  const masterPilot=MASTER_VISUAL_PILOT.map(entry=>{
    const candidate=candidateByName.get(entry.species)||null;
    const isBundled=bundledNames.has(entry.species);
    const isPublication=publicationNames.has(entry.species);
    const candidateStatus=text(candidate?.status)||null;
    const state=isPublication?'publication-ready':candidateStatus==='verified-candidate'?'verified-candidate':candidateStatus==='taxonomy-review'?'taxonomy-review':isBundled?'legacy-unverified':'no-candidate';
    return {...entry,bundled:isBundled,publication_ready:isPublication,candidate_status:candidateStatus,state};
  });
  return {
    version:'FISH-VISUAL-READINESS-V34',
    targets:registeredNames.size,
    bundled:bundled.length,
    publication_ready:publication.length,
    publication_blocked_bundled:bundled.length-publication.length,
    verified_candidates:verifiedCandidateNames.size,
    taxonomy_review:taxonomyReviewNames.size,
    no_candidate_or_publication_asset:noCandidate.length,
    safe_fallback_needed:registeredNames.size-publication.length,
    master_pilot:masterPilot,
    taxonomy_review_targets:[...taxonomyReviewNames].sort((a,b)=>a.localeCompare(b,'ja')),
    no_candidate_targets:noCandidate.sort((a,b)=>a.localeCompare(b,'ja'))
  };
}
