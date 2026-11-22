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
const STORE_KEY='irembo-redesign-v1';
const Store = {
  load(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY)) || {apps:{}}; }catch(e){ return {apps:{}}; } },
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
const tag = s => `<span class="tag ${STATUS_CLASS[s]||'grey'}">${s}</span>`;

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

/* ---------- header + footer (same on every page) ---------- */
function chrome(){
  const page=document.body.dataset.page;
  const nav=[['home','index.html','Home'],['services','index.html#services','Services'],['find','find.html','Find application'],['mine','my-applications.html','My applications <span class="count" id="appCount"></span>'],['help','help.html','Help']];
  $('#site-header').outerHTML = `
  <a class="skip" href="#main">Skip to content</a>
  <header class="top"><div class="top-in">
    <a class="logo" href="index.html"><span class="mark">iG</span>IremboGov</a>
    <button class="tbtn menu-btn" id="menuBtn" aria-expanded="false" aria-controls="mainNav">☰ Menu</button>
    <nav class="main" id="mainNav" aria-label="Main">${nav.map(n=>`<a href="${n[1]}"${n[0]===page?' aria-current="page"':''}>${n[2]}</a>`).join('')}</nav>
    <div class="tools" role="toolbar" aria-label="Display and language">
      <button class="tbtn" id="tLarge" aria-pressed="false" title="Larger text">Aa+<span class="sr"> Larger text</span></button>
      <button class="tbtn" id="tContrast" aria-pressed="false" title="High contrast">◐<span class="sr"> High contrast</span></button>
      <div class="lang" role="group" aria-label="Language">
        <button data-lang="rw" aria-current="false" lang="rw">RW</button><button data-lang="en" aria-current="true">EN</button><button data-lang="fr" aria-current="false" lang="fr">FR</button>
      </div>
    </div>
  </div></header>
  <div class="trust"><div class="top-in">🛡&nbsp; Official e-services of the Government of Rwanda · Secure connection · Your data is used only by the institution that handles your request</div></div>`;

  $('#site-footer').outerHTML = `
  <footer class="site"><div class="in">
    <div><h4>IremboGov</h4><p style="margin:0 0 8px">Government services in one place, in Kinyarwanda, English and French.</p>
      <p style="margin:0">📞 <b>9099</b> (free call, Mon–Sat 7:00–21:00)</p></div>
    <div><h4>Services</h4><ul><li><a href="renew-visa.html">Renew my visa</a></li><li><a href="find.html">Find application</a></li><li><a href="my-applications.html">My applications</a></li></ul></div>
    <div><h4>Help</h4><ul><li><a href="help.html">Help centre</a></li><li><a href="help.html#agents">Find an Irembo agent</a></li><li><a href="help.html#privacy">Privacy: how your data is used</a></li></ul></div>
  </div>
  <div class="legal">Redesign concept by ULK Usability Engineering, Group 4 (2026). Not the official IremboGov service: for real applications use <a href="https://irembo.gov.rw" rel="noopener">irembo.gov.rw</a>. Applications you enter here stay in this browser only and are not sent anywhere. Fees and rules shown are sample values.</div>
  </footer>
  <button class="btn helpfab" id="helpBtn" aria-expanded="false">? Help</button>`;

  /* menu (mobile) */
  $('#menuBtn').onclick=e=>{ const open=$('#mainNav').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded',open); };

  /* display tools, remembered between pages */
  const pref=k=>localStorage.getItem('irembo-pref-'+k)==='1';
  const setPref=(k,on)=>{ document.documentElement.classList.toggle(k,on); $('#t'+(k==='large'?'Large':'Contrast')).setAttribute('aria-pressed',on); localStorage.setItem('irembo-pref-'+k,on?'1':'0'); };
  setPref('large',pref('large')); setPref('contrast',pref('contrast'));
  $('#tLarge').onclick=()=>setPref('large',!pref('large'));
  $('#tContrast').onclick=()=>setPref('contrast',!pref('contrast'));
  $$('.lang button').forEach(b=>b.onclick=()=>{
    if(b.dataset.lang==='en') return;
    toast(b.dataset.lang==='rw' ? 'Kinyarwanda version coming soon. Call 9099 for help in Kinyarwanda.' : 'Version française bientôt disponible. Appelez le 9099 pour de l\'aide en français.');
  });

  /* help */
  let hp=null; const hb=$('#helpBtn');
  hb.onclick=()=>{
    if(hp){ hp.remove(); hp=null; hb.setAttribute('aria-expanded','false'); return; }
    hp=document.createElement('div'); hp.className='helpp';
    hp.innerHTML=`<h3>How can we help?</h3><p>📞 Call <b>9099</b> (free, Mon–Sat)<br>🧑‍💼 <a href="help.html#agents">Find an Irembo agent near you</a><br>❓ <a href="help.html">Common questions</a><br>🔎 <a href="find.html">Find my application</a></p><p class="rule">You can ask in Kinyarwanda, English or French.</p>`;
    document.body.appendChild(hp); hb.setAttribute('aria-expanded','true');
  };
  updateCount();
}
function updateCount(){ const c=$('#appCount'); if(c){ const n=Store.all().length; c.textContent=n||''; c.style.display=n?'':'none'; } }

/* side panel shown during an application */
function sidePanel(a){
  if(!a) return `<div class="card tint"><h3>Need help?</h3><p style="margin:0">📞 Call <b>9099</b> (free)<br>🧑‍💼 <a href="help.html#agents">Find an Irembo agent near you</a><br>💬 Ask in Kinyarwanda, English or French</p></div>`;
  return `<div class="card"><div class="rule">Your application number</div><div class="num">${a.no}</div>
    <p class="rule" style="margin-top:6px">Renew visa · DGIE<br>Saved automatically. You can close this page and continue later from <a href="my-applications.html">My applications</a> or <a href="find.html">Find application</a>.</p>
    <hr style="border:0;border-top:1px solid var(--line)"><p style="margin:0">📞 Help: <b>9099</b><br>🧑‍💼 <a href="help.html#agents">Nearest agent</a></p></div>`;
}

document.addEventListener('DOMContentLoaded', chrome);
