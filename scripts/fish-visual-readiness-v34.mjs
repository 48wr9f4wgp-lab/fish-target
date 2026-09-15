import {readFileSync} from 'node:fs';
import {publicationReady} from './fish-asset-authoring.mjs';
import {loadContentModel} from './content-expansion-readiness.mjs';

const root=new URL('../',import.meta.url);
const readJson=file=>JSON.parse(readFileSync(new URL(file,root),'utf8'));
const text=value=>String(value??'').trim();
const master=(species,archetype,slug,identity_cues,must_avoid)=>Object.freeze({
  species,
  archetype,
  asset_path:`fish-master-v34-${slug}.avif`,
  frame:Object.freeze({width:1200,height:768,safe_margin_pct:8,mobile_review_width:390}),
  composition:'single full-body subject; diagnostic anatomy visible; no crop at frame edge',
  identity_cues:Object.freeze(identity_cues),
  must_avoid:Object.freeze(['text','logo','watermark','fishing hook','human hand','duplicate animal',...must_avoid]),
  provenance_required:'project-generated-original',
  human_identity_review_required:true
});

export const MASTER_VISUAL_PILOT=Object.freeze([
  master('ブリ・ワラサ','saltwater-fish','buri-warasa',[
    'streamlined fusiform body',
    'yellow lateral stripe remains visible',
    'deeply forked tail remains fully visible'
  ],['tuna-like finlets','amberjack-style exaggerated vertical band']),
  master('ニジマス','freshwater-fish','nijimasu',[
    'pink-to-red lateral band remains visible',
    'dark spotting remains visible across back and fins',
    'adipose fin silhouette remains visible'
  ],['salmon spawning coloration','char-like white fin edging']),
  master('ヒラメ','flatfish','hirame',[
    'flat asymmetric body is immediately readable',
    'both eyes are shown on the left side of the head',
    'large predatory mouth and continuous dorsal/anal fin silhouette remain visible'
  ],['right-eye flounder anatomy','generic oval flatfish without head asymmetry']),
  master('アオリイカ','cephalopod','aoriika',[
    'broad oval mantle remains fully visible',
    'lateral fins extend along most of the mantle',
    'arms and two longer feeding tentacles remain visually distinguishable'
  ],['cuttlefish-like short broad body','octopus-like arm-only silhouette'])
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
  const noCandidate=[...registeredNames].filter(name=>!publicationNames.has(name)&&!candidateByName.has(name));
  const masterPilot=MASTER_VISUAL_PILOT.map(entry=>{
    const candidate=candidateByName.get(entry.species)||null;
    const asset=assets.find(record=>text(record.species_name)===entry.species)||null;
    const isBundled=bundledNames.has(entry.species);
    const isPublication=publicationNames.has(entry.species);
    const candidateStatus=text(candidate?.status)||null;
    const expectedMasterPresent=text(asset?.asset?.file)===entry.asset_path;
    const state=isPublication?'publication-ready':candidateStatus==='verified-candidate'?'verified-candidate':candidateStatus==='taxonomy-review'?'taxonomy-review':isBundled?'legacy-unverified':'no-candidate';
    return {...entry,bundled:isBundled,publication_ready:isPublication,candidate_status:candidateStatus,expected_master_present:expectedMasterPresent,state};
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
    master_assets_ready:masterPilot.filter(row=>row.publication_ready&&row.expected_master_present).length,
    master_assets_pending:masterPilot.filter(row=>!(row.publication_ready&&row.expected_master_present)).length,
    master_pilot:masterPilot,
    candidate_status_counts:statusCounts,
    taxonomy_review_targets:[...taxonomyReviewNames].sort((a,b)=>a.localeCompare(b,'ja')),
    no_candidate_targets:noCandidate.sort((a,b)=>a.localeCompare(b,'ja'))
  };
}
