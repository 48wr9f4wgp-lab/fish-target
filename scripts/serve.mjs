import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.FISH_TARGET_QA_PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};

createServer(async(request,response)=>{
  try{
    const url=new URL(request.url,'http://127.0.0.1');
    let relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if(!relative)relative='index.html';
    let file=path.resolve(root,relative);
    if(file!==root&&!file.startsWith(root+path.sep))throw new Error('outside root');
    const info=await stat(file);
    if(info.isDirectory())file=path.join(file,'index.html');
    response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    createReadStream(file).pipe(response);
  }catch{
    response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
    response.end('not found');
  }
}).listen(port,'127.0.0.1',()=>console.log(`FISH TARGET QA http://127.0.0.1:${port}/dist/`));
