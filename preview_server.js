const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname;
http.createServer((req,res)=>{
  let p=decodeURIComponent((req.url||'/').split('?')[0]); if(p==='/')p='/index.html';
  const f=path.join(root,p);
  fs.readFile(f,(e,data)=>{
    if(e){res.writeHead(404);res.end('404');return;}
    const ext=path.extname(f);
    const ct={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[ext]||'text/plain';
    res.writeHead(200,{'Content-Type':ct+'; charset=utf-8'}); res.end(data);
  });
}).listen(8123,()=>console.log('preview up on 8123'));
