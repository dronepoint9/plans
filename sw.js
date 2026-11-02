// Network first so plan updates arrive when there is signal; cache fallback for the field.
const CACHE='dp-plans-v2';
const CORE=['./','index.html','sites.json','icon-180.png','icon-192.png'];
// Saves the app plus every site listed in sites.json (plan file and photo), so each plan opens with no signal.
async function precache(){
  const c=await caches.open(CACHE);
  const put=async u=>{try{await c.add(new Request(u,{cache:'reload'}))}catch(e){}};
  await Promise.all(CORE.map(put));
  try{
    const list=await (await fetch('sites.json',{cache:'no-store'})).json();
    for(const s of list.sites||[]){
      const pf=s.plan||('plan-'+s.id+'.json');
      await put(pf);
      try{const p=await (await fetch(pf,{cache:'no-store'})).json(); if(p.image)await put(p.image);}catch(e){}
    }
  }catch(e){}
}
self.addEventListener('install',e=>{e.waitUntil(precache().then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  e.respondWith(fetch(req).then(res=>{
    if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}
    return res;
  }).catch(()=>caches.match(req,{ignoreSearch:false}).then(r=>r||caches.match(req,{ignoreSearch:true})).then(r=>r||caches.match('index.html'))));
});
