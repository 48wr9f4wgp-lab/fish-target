import {readFileSync} from 'node:fs';
import {validateAuthoring} from './fish-asset-authoring.mjs';
import {validateCandidateRegistry} from './fish-asset-candidate-contract.mjs';
import {validateIntakeReceipts} from './fish-asset-intake-receipt-contract.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const loadJson=file=>JSON.parse(read(file));
const freezeRecord=record=>Object.freeze({...record,asset:Object.freeze({...record.asset}),provenance:Object.freeze({...record.provenance,transformations:Object.freeze([...record.provenance.transformations])})});

export function buildPromotionPlan({receiptLedger=null,authoringData=null,candidateRegistry=null}={}){
  const receipts=receiptLedger||loadJson('authoring/fish-asset-intake-receipts.v1.json');
  const authoring=authoringData||loadJson('authoring/fish-assets.v1.json');
  const candidates=candidateRegistry||loadJson('authoring/fish-asset-candidates.v1.json');
  validateCandidateRegistry(candidates);
  validateIntakeReceipts(receipts,{candidateRegistry:candidates});
  const currentErrors=validateAuthoring(authoring);
  if(currentErrors.length)throw new Error(`Current fish asset authoring invalid: ${currentErrors.join('; ')}`);

  const candidateByName=new Map(candidates.records.map(row=>[row.species_name,row]));
  const existing=new Set(authoring.assets.map(row=>row.species_name));
  const plan=[];
  for(const receipt of receipts.records){
    if(existing.has(receipt.species_name))throw new Error(`${receipt.species_name}: already bundled`);
    const candidate=candidateByName.get(receipt.species_name);
    if(!candidate||candidate.status!=='verified-candidate')throw new Error(`${receipt.species_name}: verified candidate required`);
    const authoringRecord=freezeRecord({
      species_name:receipt.species_name,
      asset:{type:'file',file:receipt.output_file},
      source:candidate.source,
      source_url:candidate.source_url,
      author:candidate.author??null,
      license:receipt.output_license,
      attribution:candidate.attribution??null,
      verified_at:candidate.verified_at,
      rights_status:'verified',
      provenance:{
        source_file_url:receipt.source_file_url,
        source_sha256:receipt.source_sha256,
        output_sha256:receipt.output_sha256,
        transformations:[...receipt.transformations],
        transformation_notice:receipt.transformation_notice
      }
    });
    const errors=validateAuthoring({...authoring,assets:[...authoring.assets,authoringRecord]});
    if(errors.length)throw new Error(`${receipt.species_name}: promotion record invalid: ${errors.join('; ')}`);
    plan.push(Object.freeze({species_id:receipt.species_id,species_name:receipt.species_name,execution_state:'planned-only',authoring_record:authoringRecord}));
    existing.add(receipt.species_name);
  }
  return Object.freeze(plan);
}

if(process.argv[1]&&new URL(`file://${process.argv[1]}`).href===import.meta.url){
  const plan=buildPromotionPlan();
  console.log(JSON.stringify({count:plan.length,plan},null,2));
}
