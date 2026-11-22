/* =====================================================================
   core.js — shared by every page: data, storage, header/footer, tools,
   help, toast and modal.
   Applications are saved in this browser (localStorage). Nothing is sent
   to any server.
   ===================================================================== */

/* ---------- service data (sample values: confirm with DGIE / IremboPay) ---------- */
const FEES = { student:30000, work:50000, visitor:20000, dependant:25000 };
const VISA = {
  student:  ['Student visa',           'You study at a school or university in Rwanda'],
  work:     ['Work visa',              'You are employed by a company in Rwanda'],
  visitor:  ['Visitor / tourist visa', 'You are visiting, on holiday or for business meetings'],
  dependant:['Dependant visa',         'You live with a family member who holds a Rwandan visa or permit']
};
const DOCTYPE = { passport:'Passport', refugee:'Refugee travel document', laissez:'Laissez-passer' };
const STEPS = ['Your visa','About you','Documents','Check & submit','Pay'];
const PAY_DAYS = 6;   // how long a payment code (Bill ID) stays valid

/* ---------- helpers ---------- */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const param = k => new URLSearchParams(location.search).get(k);
const rnd = n => Math.floor(Math.random()*n);
const rwf = n => n.toLocaleString('en-US')+' RWF';
const kb  = n => n>=1048576 ? (n/1048576).toFixed(1)+' MB' : Math.round(n/1024)+' KB';
function esc(s){ return String(s ?? '').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function maskPhone(p){ p=String(p||''); return p ? '+250 '+p.slice(0,2)+'• ••• •'+p.slice(-2) : ''; }
function fmtDate(t, time=true){ const d=new Date(t); return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})+(time?', '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):''); }
function timeLeft(t){
  const ms=t-Date.now(); if(ms<=0) return 'expired';
  const d=Math.floor(ms/864e5), h=Math.floor(ms%864e5/36e5), m=Math.floor(ms%36e5/6e4);
  return d>0 ? `${d} day${d>1?'s':''} ${h} h left` : h>0 ? `${h} h ${m} min left` : `${m} min left`;
}
function feeOf(a){ return FEES[a.app.visa] || 30000; }

/* ---------- storage ---------- */
/* Own key, so other pages on the same site (e.g. the irembogov-redesign design export,
   which saves its state under 'irembo-redesign-v1') can't overwrite the applications. */
const STORE_KEY='irembogov-site-applications-v2';
const OLD_STORE_KEY='irembo-redesign-v1';
function readApps(key){
  try{
    const d=JSON.parse(localStorage.getItem(key));
    if(!d || typeof d.apps!=='object' || d.apps===null || Array.isArray(d.apps)) return null;   // not our format
    for(const k of Object.keys(d.apps)){ const a=d.apps[k]; if(!a || typeof a!=='object' || !a.no || typeof a.app!=='object' || a.app===null) delete d.apps[k]; }
    return d;
  }catch(e){ return null; }
}
const Store = {
  load(){
    const d=readApps(STORE_KEY); if(d) return d;
    const old=readApps(OLD_STORE_KEY);                 // one-time move of applications saved by the previous version
    if(old && Object.keys(old.apps).length){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(old)); }catch(e){} return old; }
    return {apps:{}};
  },
  save(d){
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(d)); }
    catch(e){ // storage full: drop photo previews and try again
      Object.values(d.apps).forEach(a=>{ if(a.photo) a.photo.url=null; });
      try{ localStorage.setItem(STORE_KEY, JSON.stringify(d)); }catch(e2){ toast('Could not save on this device (storage is full).'); }
    }
  },
  get(no){ return this.load().apps[no] || null; },
  put(a){ const d=this.load(); a.updated=Date.now(); d.apps[a.no]=a; this.save(d); updateCount(); },
  remove(no){ const d=this.load(); delete d.apps[no]; this.save(d); updateCount(); },
  all(){ return Object.values(this.load().apps).sort((a,b)=>b.updated-a.updated); }
};
function newAppNo(){
  const used=Store.load().apps; let no;
  do{ no='B2-'+(1000+rnd(8999))+'-'+new Date().getFullYear(); }while(used[no]);
  return no;
}
function newBill(a){
  a.billId='880 '+(100+rnd(899))+' '+(100+rnd(899));
  const d=new Date(); d.setDate(d.getDate()+PAY_DAYS); d.setHours(23,59,0,0);
  a.deadline=d.getTime();
}

/* status in the shared vocabulary */
function statusOf(a){
  if(!a.submitted) return 'Draft';
  if(a.paidAt)     return 'Under review';
  if(Date.now() > a.deadline) return 'Payment expired';
  return 'Payment pending';
}
const STATUS_CLASS = {'Draft':'grey','Payment pending':'warn','Payment expired':'warn','Under review':'info','Approved':'ok','Ready for collection':'ok','Rejected':'warn'};
const tag = s => `<span class="pill ${STATUS_CLASS[s]||'grey'}">${s}</span>`;

/* ---------- toast + modal ---------- */
let _tt;
function toast(msg){
  let t=$('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
  t.textContent=msg; clearTimeout(_tt); _tt=setTimeout(()=>t.remove(),4500);
}
function modal(html){
  const s=document.createElement('div'); s.className='scrim';
  s.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(s);
  s.addEventListener('click',e=>{ if(e.target===s || e.target.closest('[data-close]')) s.remove(); });
  s.querySelector('button')?.focus();
  return s;
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape') $$('.scrim').forEach(s=>s.remove()); });

/* ---------- page containers (tolerant of an older cached page) ---------- */
function flowEl(){ return $('#flow') || $('#main'); }
function setSide(html){ const s=$('#side'); if(s) s.innerHTML=html; }
/* never leave a blank page: if a script fails before the content is drawn, say how to recover */
window.addEventListener('error', e=>{
  if(!e.message) return;                       // ignore failed images/fonts
  const m=flowEl();
  if(m && !m.textContent.trim()) m.innerHTML='<div class="warnbox" role="alert">This page did not load correctly. Press <b>Ctrl + F5</b> (or <b>Cmd + Shift + R</b> on a Mac) to reload it. If it still happens, call 9099.</div>';
});

/* ---------- icons (Dazzle Line Icons, CC BY, stored in assets/icons) ---------- */
const ICO = (n, cls='') => `<img class="ic ${cls}" src="assets/icons/${n}.svg" alt="">`;

/* ---------- header + footer (same on every page) ---------- */
function chrome(){
  const page=document.body.dataset.page;
  const nav=[['home','index.html','Home'],['services','renew-visa.html','Services'],['find','find.html','Find application'],['mine','my-applications.html','My applications <span class="badge" id="appCount"></span>'],['help','help.html','Help']];
  $('#site-header').outerHTML = `
  <a class="skip" href="#main">Skip to content</a>
  <div class="trustbar"><div class="in">
    <span style="display:flex;align-items:center;gap:8px"><img src="assets/icons/shield.svg" alt=""><strong>Official e-services of the Government of Rwanda</strong></span>
    <span style="opacity:.8">Secure connection · Your data is seen only by the institution handling your request</span>
  </div></div>
  <header class="top"><div class="in">
    <a class="brandlink" href="index.html"><span class="brandmark">iG</span><span class="brandname">IremboGov</span></a>
    <button class="hbtn menu-btn" id="menuBtn" aria-expanded="false" aria-controls="mainNav">☰ Menu</button>
    <nav class="main" id="mainNav" aria-label="Main">${nav.map(n=>`<a href="${n[1]}"${n[0]===page?' aria-current="page"':''}>${n[2]}</a>`).join('')}</nav>
    <div class="tools" role="toolbar" aria-label="Display and language">
      <button class="hbtn" id="tLarge" aria-pressed="false" title="Larger text">Aa+<span class="sr"> Larger text</span></button>
      <button class="hbtn" id="tTheme" title="Switch light / dark"></button>
      <div class="seg" role="group" aria-label="Language">
        <button data-lang="rw" aria-current="false" lang="rw">RW</button><button data-lang="en" aria-current="true">EN</button><button data-lang="fr" aria-current="false" lang="fr">FR</button>
      </div>
    </div>
  </div></header>`;

  $('#site-footer').outerHTML = `
  <footer class="site"><div class="in">
    <div class="cols3">
      <div><div class="fb"><span>iG</span>IremboGov</div><p>Government services in one place, in Kinyarwanda, English and French.</p>
        <div style="display:flex;align-items:center;gap:8px"><img src="assets/icons/phone.svg" alt=""><span><strong style="color:#fff">9099</strong> · free call, Mon–Sat 7:00–21:00</span></div></div>
      <div class="col"><div class="h">Services</div><a href="renew-visa.html">Renew my visa</a><a href="find.html">Find application</a><a href="my-applications.html">My applications</a></div>
      <div class="col"><div class="h">Help</div><a href="help.html">Help centre</a><a href="help.html#agents">Find an Irembo agent</a><a href="help.html#privacy">Privacy: how your data is used</a></div>
    </div>
    <p class="legal">Redesign concept by ULK Usability Engineering, Group 4 (2026). Not the official IremboGov service: for real applications use <a href="https://irembo.gov.rw" rel="noopener">irembo.gov.rw</a>. Applications you enter here stay in this browser only. Fees and rules shown are sample values. Icons: Dazzle Line Icons by Dazzle UI (CC BY).</p>
  </div></footer>
  <div class="fab" id="fab"><button id="helpBtn" aria-expanded="false"></button></div>`;

  /* menu (mobile) */
  $('#menuBtn').onclick=e=>{ const open=$('#mainNav').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded',open); };

  /* display tools, remembered between pages (theme.js applies them before the page is drawn) */
  const root=document.documentElement;
  const setLarge=on=>{ root.classList.toggle('large',on); $('#tLarge').setAttribute('aria-pressed',on); localStorage.setItem('irembo-pref-large',on?'1':'0'); };
  const drawTheme=()=>{ const dark=root.getAttribute('data-theme')==='dark'; $('#tTheme').innerHTML=`${ICO(dark?'sun':'moon')}${dark?'Light':'Dark'}`; };
  setLarge(root.classList.contains('large')); drawTheme();
  $('#tLarge').onclick=()=>setLarge(!root.classList.contains('large'));
  $('#tTheme').onclick=()=>{ const t=root.getAttribute('data-theme')==='dark'?'light':'dark'; root.setAttribute('data-theme',t); localStorage.setItem('irembo-pref-theme',t); drawTheme(); };
  $$('.seg button').forEach(b=>b.onclick=()=>{
    if(b.dataset.lang==='en') return;
    toast(b.dataset.lang==='rw' ? 'Kinyarwanda version coming soon. Call 9099 for help in Kinyarwanda.' : 'Version française bientôt disponible. Appelez le 9099 pour de l\'aide en français.');
  });

  /* help button + popover */
  const hb=$('#helpBtn'); let hp=null;
  const drawHelp=()=>{ hb.innerHTML=`${ICO(hp?'xmark':'life-ring')}${hp?'Close':'Help'}`; hb.setAttribute('aria-expanded',!!hp); };
  hb.onclick=()=>{
    if(hp){ hp.remove(); hp=null; drawHelp(); return; }
    hp=document.createElement('div'); hp.className='pop';
    hp.innerHTML=`<div class="t">How can we help?</div>
      <div class="row plain">${ICO('phone')}<span>Call <strong>9099</strong> <span class="muted" style="font-size:.875rem">· free, Mon–Sat</span></span></div>
      <a class="row" href="help.html#agents">${ICO('agent')}Find an agent near you</a>
      <a class="row" href="help.html#faq">${ICO('question')}Common questions</a>
      <a class="row" href="find.html">${ICO('search')}Find my application</a>
      <div class="foot">Ask in Kinyarwanda, English or French.</div>`;
    $('#fab').insertBefore(hp, hb); drawHelp();
  };
  drawHelp();
  updateCount();
}
function updateCount(){ const c=$('#appCount'); if(c){ const n=Store.all().length; c.textContent=n||''; c.style.display=n?'':'none'; } }

/* side panel (right column) */
function sidePanel(a){
  if(!a) return `<div class="side-card"><div class="t">Need help?</div><div class="side-list">
      <div>${ICO('phone')}<span>Call <strong>9099</strong>, free, Mon–Sat 7:00–21:00</span></div>
      <div>${ICO('agent')}<span><a href="help.html#agents">Find an Irembo agent near you</a></span></div>
      <div>${ICO('chat')}<span>Ask in Kinyarwanda, English or French</span></div></div></div>`;
  const v=VISA[a.app.visa];
  return `<div class="side-card">
    <div><div class="rule">Your application number</div><div class="appno">${a.no}</div><div class="rule">The only number you need</div></div>
    <div class="side-split"><div style="flex:1"><div class="k">Visa</div><div class="v">${v?v[0]:'Not chosen yet'}</div></div><div><div class="k">Fee</div><div class="v">${v?rwf(FEES[a.app.visa]):'—'}</div></div></div>
    <p style="margin:0;font-size:.875rem;color:var(--ink2)">Saved automatically. Close this page any time and continue from <a href="my-applications.html">My applications</a> or <a href="find.html">Find application</a>.</p>
    <div class="side-list" style="font-size:.875rem"><div>${ICO('phone')}<span>Help: call <strong>9099</strong></span></div><div>${ICO('agent')}<span><a href="help.html#agents">Nearest agent</a></span></div></div>
  </div>`;
}

document.addEventListener('DOMContentLoaded', chrome);
