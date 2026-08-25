(()=>{
  const source=()=>({
    source_type:'synthetic',
    source_provider:'FISH TARGET synthetic fixture',
    source_url:null,
    retrieved_at:'2026-08-25',
    last_verified:'2026-08-25',
    license_status:'synthetic'
  });
  const product=(maker,category,series,generation,model,specs,status='current')=>({maker,category,series,generation,model,display_name:`${series} ${model}`,status,specs,source:source()});
  globalThis.FISH_TARGET_CATALOG_FIXTURES=Object.freeze([
    product('DAIWA','rod','DEMO SHORE','v23-demo','96M',{length_ft:9.6,power:'M',lure_min_g:10,lure_max_g:50,line_pe_min:0.8,line_pe_max:2}),
    product('DAIWA','rod','DEMO SHORE','v23-demo','100MH',{length_ft:10,power:'MH',lure_min_g:20,lure_max_g:80,jig_max_g:100,line_pe_min:1.5,line_pe_max:3}),
    product('DAIWA','rod','DEMO LIGHT','v23-demo','76L',{length_ft:7.6,power:'L',lure_min_g:1,lure_max_g:12,line_pe_min:0.3,line_pe_max:0.8}),
    product('DAIWA','rod','DEMO LEGACY','v22-demo','90M',{length_ft:9,power:'M',lure_min_g:8,lure_max_g:42,line_pe_min:0.8,line_pe_max:1.5},'discontinued'),
    product('DAIWA','reel','DEMO SPIN','v23-demo','3000',{reel_size:3000,gear_ratio:5.2,max_drag_kg:10}),
    product('DAIWA','reel','DEMO SPIN','v23-demo','4000XH',{reel_size:4000,gear_ratio:6.2,max_drag_kg:12}),
    product('DAIWA','reel','DEMO SW','v23-demo','6000H',{reel_size:6000,gear_ratio:5.7,max_drag_kg:15}),
    product('SHIMANO','rod','DEMO SEABASS','v23-demo','90ML',{length_ft:9,power:'ML',lure_min_g:6,lure_max_g:36,line_pe_min:0.6,line_pe_max:1.5}),
    product('SHIMANO','rod','DEMO SHORE','v23-demo','100M',{length_ft:10,power:'M',lure_min_g:10,lure_max_g:60,jig_max_g:70,line_pe_min:1,line_pe_max:2.5}),
    product('SHIMANO','rod','DEMO EGING','v23-demo','86M',{length_ft:8.6,power:'M',line_pe_min:0.5,line_pe_max:1}),
    product('SHIMANO','reel','DEMO SPIN','v23-demo','C3000HG',{reel_size:3000,gear_ratio:6,max_drag_kg:9}),
    product('SHIMANO','reel','DEMO SPIN','v23-demo','4000XG',{reel_size:4000,gear_ratio:6.2,max_drag_kg:11}),
    product('SHIMANO','reel','DEMO SW','v23-demo','6000HG',{reel_size:6000,gear_ratio:5.7,max_drag_kg:14}),
    product('SHIMANO','reel','DEMO UNKNOWN','v23-demo','5000X',{reel_size:5000,gear_ratio:5.8,max_drag_kg:12},'unknown')
  ]);
})();
