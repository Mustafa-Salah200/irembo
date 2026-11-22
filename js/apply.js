/* =====================================================================
   apply.js — the 4 form steps of "Renew my visa" (step 5, Pay, is on
   application.html). Answers are saved automatically as you type.
   URL: apply.html?no=B2-xxxx-2026#step-2
   ===================================================================== */

/* ---------- load or create the application ---------- */
let A = param('no') && Store.get(param('no'));
if(A && A.paidAt){ location.replace('application.html?no='+A.no); }      // paid: can no longer be edited
if(!A){ A = {no:newAppNo(), service:'Renew visa', app:{}, photo:null, bio:null, created:Date.now(), submitted:false, sms:true, step:1}; markOwn(A.no); }   // started here: no code needed in this session
let stored = !!Store.get(A.no);          // saved only once the person starts answering
let photoImg = null;                     // the real image, kept in memory for "Make it fit for me"

function save(){
  A.updated=Date.now(); Store.put(A);
  if(!stored){ stored=true; history.replaceState(null,'',`apply.html?no=${A.no}${location.hash}`); }
  const s=$('#savedMsg'); if(s) s.textContent='✓ Saved automatically';
  setSide(sidePanel(A));
}

/* ---------- pieces ---------- */
function stepper(n){
  return `<div>
    <div class="stephead"><span class="muted">Step ${n} of 5 · <strong style="color:var(--ink)">${STEPS[n-1]}</strong></span><span class="saved" id="savedMsg" role="status">${stored?'✓ Saved automatically':'Your answers save as you type'}</span></div>
    <ol class="stepbar" aria-label="Progress">${STEPS.map((s,i)=>{ const k=i+1, cls=k<n?'done':k===n?'cur':'';
      const inner=`<span class="bar"></span><span class="lbl">${k<n?'✓ ':''}${s}</span>`;
      return `<li class="${cls}">${k<n?`<a href="#step-${k}" class="${cls}">${inner}</a>`:`<span class="s ${cls}"${k===n?' aria-current="step"':''}>${inner}</span>`}</li>`; }).join('')}</ol>
  </div>`;
}
function field(id,label,{hint='',type='text',req=true,msg='',opts=null,why=''}={}){
  const v=esc(A.app[id]??'');
  const input = opts
    ? `<select id="${id}" name="${id}" aria-describedby="${id}-m"><option value="">Choose…</option>${opts.map(o=>`<option value="${esc(o[0])}" ${A.app[id]===o[0]?'selected':''}>${esc(o[1])}</option>`).join('')}</select>`
    : `<input id="${id}" name="${id}" type="${type}" value="${v}" aria-describedby="${id}-m" autocomplete="off">`;
  return `<div class="f" data-f="${id}"><label for="${id}">${label}${hint?` <span class="hint">· ${hint}</span>`:''}${req?'':' <span class="hint">· optional</span>'}</label>
    ${input}<div class="msg" id="${id}-m">${msg}</div>
    ${why?`<details class="why"><summary>Why do we ask this?</summary><p>${why}</p></details>`:''}</div>`;
}
const actions = (back, nextLabel, n) => `<div class="actions">${back}<div class="right"><button class="btn" data-next="${n}">${nextLabel}</button></div></div>`;

/* ---------- steps ---------- */
const V={};
V[1] = () => `
  <div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="renew-visa.html">Renew my visa</a><span>/</span><span>Apply</span></div>
  ${stepper(1)}
  <div><h1 class="step">Your visa</h1><p class="sublead">Which visa are you renewing?</p></div>
  <div id="es"></div>
  <fieldset class="f" data-f="visa"><legend class="sr">Which visa are you renewing?</legend>
    <div class="optgrid">${Object.keys(VISA).map(k=>`<label class="opt"><input type="radio" name="visa" value="${k}" ${A.app.visa===k?'checked':''}><span class="radio"></span><span class="ot"><span class="on">${VISA[k][0]}</span><span class="od">${VISA[k][1]}</span><span class="of">Fee ${rwf(FEES[k])}</span></span></label>`).join('')}</div>
    <div class="msg">Choose the type of visa you have now.</div>
  </fieldset>
  <div class="grid-auto">
    ${field('nationality','Nationality',{opts:[['Sudan','Sudanese'],['DRC','Congolese (DRC)'],['Burundi','Burundian'],['Kenya','Kenyan'],['Uganda','Ugandan'],['Tanzania','Tanzanian'],['Nigeria','Nigerian'],['India','Indian'],['China','Chinese'],['Other','Other…']],msg:'Choose your nationality.'})}
    ${field('doctype','Travel document',{hint:'most people use their passport',opts:Object.entries(DOCTYPE),msg:'Choose your travel document.'})}
  </div>
  ${actions('<a class="btn sec" href="renew-visa.html">← Back</a>','Continue →',1)}`;

V[2] = () => `
  ${stepper(2)}
  <div><h1 class="step">About you</h1><p class="sublead">Write your names exactly as they appear in your passport.</p></div>
  <div id="es"></div>
  <div class="grid-auto">
    ${field('surname','Family name',{hint:'e.g. HASSAN',msg:'Enter your family name as written in your passport.'})}
    ${field('given','Given names',{hint:'e.g. Amina',msg:'Enter your given names as written in your passport.'})}
    ${field('dob','Date of birth',{type:'date',msg:'Enter your date of birth.'})}
    <fieldset class="f" data-f="gender"><legend>Sex <span class="hint">· as in passport</span></legend>
      <div class="seg2"><label class="opt"><input type="radio" name="gender" value="f" ${A.app.gender==='f'?'checked':''}>Female</label><label class="opt"><input type="radio" name="gender" value="m" ${A.app.gender==='m'?'checked':''}>Male</label></div>
      <div class="msg">Choose the sex shown in your passport.</div></fieldset>
  </div>
  <div class="panel">
    <div class="t">Family details</div>
    <div class="grid-auto">
      ${field('father',"Father's full name",{msg:"Enter your father's full name. Write \"Unknown\" if you don't know it."})}
      ${field('mother',"Mother's full name",{msg:"Enter your mother's full name. Write \"Unknown\" if you don't know it."})}
    </div>
    <details class="why"><summary>Why do we ask for your parents' names?</summary><p>They help DGIE match your request to your immigration record and prevent identity fraud. Only DGIE sees them. If you don't know a name, write "Unknown": your application will not be refused for this.</p></details>
    <div style="max-width:420px">${field('civil','Marital status',{opts:[['single','Single'],['married','Married'],['divorced','Divorced'],['widowed','Widowed']],msg:'Choose your marital status.',why:'Some visa types (for example Dependant) depend on your family situation.'})}</div>
  </div>
  <div class="grid-auto">
    ${field('job','What do you do?',{hint:'e.g. Student',msg:'Tell us your job or main activity.'})}
    ${field('district','Where do you live in Rwanda?',{opts:[['Gasabo','Gasabo (Kigali)'],['Kicukiro','Kicukiro (Kigali)'],['Nyarugenge','Nyarugenge (Kigali)'],['Musanze','Musanze'],['Huye','Huye'],['Rubavu','Rubavu'],['Rusizi','Rusizi'],['Other','Other district']],msg:'Choose your district.'})}
    <div class="f" data-f="phone"><label for="phone">Phone for SMS updates</label>
      <span class="prefixed"><span>+250</span><input id="phone" type="tel" inputmode="numeric" placeholder="78 812 3467" value="${esc(A.app.phone??'')}" aria-describedby="phone-m" autocomplete="tel-national"></span>
      <div class="msg" id="phone-m">Enter 9 digits, e.g. 788 123 456 (without the first 0).</div></div>
    ${field('email','Email',{type:'email',req:false})}
  </div>
  ${actions('<a class="btn sec" href="#step-1">← Back</a>','Continue →',2)}`;

/* documents: each rule is checked on the real file */
function chip(state, text){ return `<span class="chip ${state}">${state==='y'?'✓':state==='n'?'✕':'○'} ${text}</span>`; }
function photoCard(){
  const p=A.photo, st=!p?'':(p.ok?'good':'bad');
  const c=(ok,txt)=>chip(!p?'':ok?'y':'n',txt);
  const canFix = p && !p.ok && p.typeOk && photoImg;
  const thumb = p && (p.url || (photoImg && p.tmpUrl));
  return `<div class="doc ${st}" id="photoCard">
    <div class="tile" style="${thumb?`background-image:url(&quot;${thumb}&quot;)`:''}">${thumb?'':`${ICO(p?'photo':'photo')}${p?(p.ok?'✓ Accepted':'Not accepted'):'No file yet'}`}</div>
    <div class="body">
      <div class="title">1. Passport photo</div>
      <div class="chips" aria-live="polite">
        ${c(p&&p.typeOk, p&&!p.typeOk?`File is ${esc(p.ext)}: must be JPG`:'JPG file')}
        ${c(p&&p.sizeOk, p&&!p.sizeOk?`${p.sizeTxt}: must be 200 KB or smaller`:`200 KB or smaller${p?` (${p.sizeTxt})`:''}`)}
        ${c(p&&p.dimOk,  p&&!p.dimOk?`${p.w||'?'} × ${p.h||'?'} px: must be square, ≥ 400 × 400`:`Square, ≥ 400 × 400 px${p&&p.w?` (${p.w} × ${p.h})`:''}`)}
      </div>
      ${p&&!p.ok?`<div class="fix" role="alert"><b>This photo can't be used yet.</b> ${canFix?`We can fix it for you: we cut it to a square around the centre and make the file smaller. <b>Your face is not changed.</b>`:p.typeOk?`Choose the photo again and we can fix it for you.`:`Please choose a JPG photo, or take a new one with your phone camera.`}</div>`:''}
      ${p&&p.ok?`<div class="okline">✓ Photo accepted${p.fixed?' (made smaller for you)':''}</div>`:''}
      <div class="upbtns">
        ${canFix?`<button class="btn small" data-act="fixphoto">Make it fit for me</button>`:''}
        <span class="btn small ${canFix||(p&&p.ok)?'sec':''} filebtn">${p?'Choose another photo':'Choose photo'}<input type="file" id="photoIn" accept=".jpg,.jpeg,image/jpeg" aria-label="Choose passport photo"></span>
      </div>
    </div></div>`;
}
function bioCard(){
  const b=A.bio, st=!b?'':(b.ok?'good':'bad');
  const c=(ok,txt)=>chip(!b?'':ok?'y':'n',txt);
  return `<div class="doc ${st}" id="bioCard">
    <div class="tile">${ICO(b&&b.ok?'doc-ok':'file')}${b?(b.ok?'✓ Accepted':'Not accepted'):'No file yet'}</div>
    <div class="body">
      <div class="title">2. Passport biodata page</div>
      <div class="chips">
        ${c(b&&b.typeOk, b&&!b.typeOk?`File is ${esc(b.ext)}: must be PDF`:'PDF file')}
        ${c(b&&b.sizeOk, b&&!b.sizeOk?`${b.sizeTxt}: must be 500 KB or smaller`:`500 KB or smaller${b?` (${b.sizeTxt})`:''}`)}
      </div>
      ${b?`<div class="file">${esc(b.name)}</div>`:''}
      ${b&&!b.typeOk?`<div class="fix" role="alert"><b>This must be a PDF.</b> Tip: scan the page with your phone's "Scan document" function.</div>`:''}
      ${b&&b.typeOk&&!b.sizeOk?`<div class="fix" role="alert"><b>This file is too big.</b> Scan it again in black and white, or at a lower quality.</div>`:''}
      <div class="upbtns"><span class="btn small ${b&&b.ok?'sec':''} filebtn">${b?'Replace':'Choose file'}<input type="file" id="bioIn" accept=".pdf,application/pdf" aria-label="Choose passport biodata page"></span></div>
    </div></div>`;
}
V[3] = () => {
  const missing=[!(A.photo&&A.photo.ok)&&'Passport photo', !(A.bio&&A.bio.ok)&&'Passport biodata page'].filter(Boolean);
  return `${stepper(3)}
  <div><h1 class="step">Documents</h1><p class="sublead">We check each file the moment you choose it, so you know straight away if it can be used.</p></div>
  ${photoCard()}${bioCard()}
  ${missing.length ? `<div class="warnbox" id="missingBox" tabindex="-1">Still missing: ${missing.join(', ')} · <a href="#" data-act="jump">jump to it</a></div>`
                   : `<div class="okbox"><strong>✓ All documents are ready.</strong></div>`}
  ${actions('<a class="btn sec" href="#step-2">← Back</a>','Continue →',3)}`;
};
V[4] = () => {
  const a=A.app, vt=VISA[a.visa]||['—'];
  const sec=(t,n,rows)=>`<div class="card tight rev"><div class="head"><h2>${t}</h2><a href="#step-${n}" aria-label="Edit ${t}">Edit</a></div>${rows.map(r=>`<div class="kv"><span class="k">${r[0]}</span><span class="v">${esc(r[1])||'—'}</span></div>`).join('')}</div>`;
  return `${stepper(4)}
  <div><h1 class="step">Check your answers</h1><p class="sublead">Look everything over. You can change any part.</p></div>
  <div id="es"></div>
  ${sec('Your visa',1,[['Request','Renew visa'],['Visa type',vt[0]],['Fee',a.visa?rwf(FEES[a.visa]):''],['Nationality',a.nationality],['Travel document',DOCTYPE[a.doctype]]])}
  ${sec('About you',2,[['Name',`${a.given||''} ${a.surname||''}`.trim()],['Date of birth',a.dob?fmtDate(a.dob+'T12:00',false):''],['Sex',{f:'Female',m:'Male'}[a.gender]],['Parents',[a.father,a.mother].filter(Boolean).join(' · ')],['Marital status',{single:'Single',married:'Married',divorced:'Divorced',widowed:'Widowed'}[a.civil]],['Activity',a.job],['District',a.district],['Phone (SMS)',maskPhone(a.phone)],['Email',a.email]])}
  ${sec('Documents',3,[['Passport photo',A.photo&&A.photo.ok?'✓ Accepted':'Missing'],['Biodata page',A.bio&&A.bio.ok?'✓ Accepted':'Missing']])}
  <div class="f" data-f="consent"><label class="check"><input type="checkbox" id="consent" ${A.app.consent?'checked':''}><span class="box"></span><span>The information I gave is <strong>true</strong>. I agree that <strong>DGIE</strong> may use it <strong>only</strong> to process this visa request.</span></label><div class="msg">Please tick the box to confirm before submitting.</div></div>
  <p style="margin:0;font-size:.875rem;color:var(--ink3)">You can still change your answers until DGIE starts the review.</p>
  ${actions('<a class="btn sec" href="#step-3">← Back</a>', A.submitted?'Save changes':'Submit application', 4)}`;
};

/* ---------- validation ---------- */
function setErr(id,on,msg){ const f=document.querySelector(`[data-f="${id}"]`); if(!f) return; f.classList.toggle('err',on); if(msg&&on){ const m=f.querySelector('.msg'); if(m) m.textContent=msg; } }
function summary(errs){
  const box=$('#es'); if(!box) return;
  box.innerHTML = errs.length?`<div class="errsum" role="alert" tabindex="-1"><h3>Please fix ${errs.length} thing${errs.length>1?'s':''}:</h3><ul>${errs.map(e=>`<li><a href="#" data-focus="${e[0]}">${e[1]}</a></li>`).join('')}</ul></div>`:'';
  if(errs.length) box.firstChild.focus();
}
function collect(){
  $$('#main input, #main select').forEach(el=>{
    if(el.type==='file' || el.closest('.verify')) return;
    if(el.type==='radio'){ if(el.checked) A.app[el.name]=el.value; }
    else if(el.type==='checkbox'){ if(el.id==='consent') A.app.consent=el.checked; }
    else A.app[el.id]=el.value.trim();
  });
}
const NEED={
  1:[['visa','Choose which visa you are renewing'],['nationality','Choose your nationality'],['doctype','Choose your travel document']],
  2:[['surname','Enter your family name'],['given','Enter your given names'],['dob','Enter your date of birth'],['gender','Choose your sex'],['father',"Enter your father's name (or \"Unknown\")"],['mother',"Enter your mother's name (or \"Unknown\")"],['civil','Choose your marital status'],['job','Tell us your job or activity'],['district','Choose your district'],['phone','Enter a valid phone number']]
};
function validate(n){
  collect(); const errs=[];
  (NEED[n]||[]).forEach(([id,txt])=>{
    let bad=!A.app[id];
    if(id==='phone'&&!bad){ const d=A.app.phone.replace(/\D/g,'').replace(/^(250|0)/,''); bad=!/^7[2389]\d{7}$/.test(d); if(!bad) A.app.phone=d; }
    if(id==='dob'&&!bad){ const y=+A.app.dob.slice(0,4), age=(Date.now()-new Date(A.app.dob))/31557600000; bad = y<1900 || age<0; if(bad) setErr('dob',true,'Enter a real date of birth.'); }
    setErr(id,bad); if(bad) errs.push([id,txt]);
  });
  if(n===2 && A.app.email && !/^\S+@\S+\.\S+$/.test(A.app.email)){ setErr('email',true,'Enter an email like name@example.com, or leave it empty.'); errs.push(['email','Check your email address']); }
  if(n===3){
    const miss=[!(A.photo&&A.photo.ok)&&'Passport photo', !(A.bio&&A.bio.ok)&&'Passport biodata page'].filter(Boolean);
    if(miss.length){ const mb=$('#missingBox'); if(mb){ mb.className='warnbox bad'; mb.focus(); } toast('Still missing: '+miss.join(' · ')); return false; }
  }
  if(n===4){
    const bad=!A.app.consent; setErr('consent',bad); if(bad) errs.push(['consent','Tick the box to confirm your information']);
    for(let k=1;k<=2;k++){ if(NEED[k].some(([id])=>!A.app[id])) errs.push(['step-'+k,`Complete step ${k}: ${STEPS[k-1]}`]); }
    if(!(A.photo&&A.photo.ok&&A.bio&&A.bio.ok)) errs.push(['step-3','Complete step 3: Documents']);
  }
  summary(errs); return errs.length===0;
}

/* ---------- files (checked on the real file) ---------- */
function readPhoto(file){
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  const p={ext, typeOk:/^(jpe?g)$/.test(ext)||file.type==='image/jpeg', sizeTxt:kb(file.size), sizeOk:file.size<=200*1024};
  const tmp=URL.createObjectURL(file), img=new Image();
  img.onload=()=>{
    p.w=img.naturalWidth; p.h=img.naturalHeight; photoImg=img; p.tmpUrl=tmp;
    p.dimOk=Math.abs(p.w-p.h)/Math.max(p.w,p.h)<=0.05 && Math.min(p.w,p.h)>=400;
    p.ok=p.typeOk&&p.sizeOk&&p.dimOk;
    if(p.ok){ const fr=new FileReader(); fr.onload=()=>{ p.url=fr.result; delete p.tmpUrl; A.photo=p; save(); render(); }; fr.readAsDataURL(file); }
    else { A.photo=p; save(); render(); }
  };
  img.onerror=()=>{ p.dimOk=false; p.ok=false; photoImg=null; A.photo=p; save(); render(); };
  img.src=tmp;
}
function fixPhoto(){
  const p=A.photo; if(!p||!photoImg) return;
  const side=Math.min(p.w,p.h), c=document.createElement('canvas'); c.width=c.height=600;
  c.getContext('2d').drawImage(photoImg,(p.w-side)/2,(p.h-side)/2,side,side,0,0,600,600);
  let q=0.9, url;
  do{ url=c.toDataURL('image/jpeg',q); q-=0.1; }while(url.length*0.75>200*1024 && q>0.3);
  const size=Math.round(url.length*0.75);
  A.photo={ext:'jpg',typeOk:true,sizeTxt:kb(size),sizeOk:size<=200*1024,w:600,h:600,dimOk:true,ok:size<=200*1024,fixed:true,url};
  photoImg=null; save(); render(); toast('✓ Photo cut to a square and made smaller.');
}
function readBio(file){
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  const b={name:file.name, ext, typeOk:ext==='pdf'||file.type==='application/pdf', sizeTxt:kb(file.size), sizeOk:file.size<=500*1024};
  b.ok=b.typeOk&&b.sizeOk; A.bio=b; save(); render();
}

/* ---------- submit ---------- */
function submit(){
  const first=!A.submitted;
  A.submitted=true; A.step=5; if(first) A.submittedAt=Date.now();
  if(!A.billId || Date.now()>A.deadline) newBill(A);
  save();
  location.href=`application.html?no=${A.no}${first?'&new=1':'&saved=1'}`;
}

/* ---------- router ---------- */
function step(){ const m=location.hash.match(/step-(\d)/); return m ? Math.min(4,Math.max(1,+m[1])) : 1; }
function render(){
  if(!canAccess(A)){                        // someone else's application: prove it's yours first
    flowEl().innerHTML=`<div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="my-applications.html">My applications</a><span>/</span><span class="mono">${A.no}</span></div>
      <div><h1 class="step">Renew visa ${tag(statusOf(A))}</h1><p class="sublead">Application <strong class="mono">${A.no}</strong></p></div><div id="gate"></div>`;
    verifyBox($('#gate'), A.app.phone, {why:'continue or change this application', onOk:render});
    setSide(sidePanel(null)); document.title="Confirm it's you · IremboGov"; return;
  }
  const n=step();
  flowEl().innerHTML=V[n]();
  setSide(sidePanel(stored?A:null));
  document.title=`${STEPS[n-1]} · Renew my visa · IremboGov`;
  if(stored && !A.submitted && A.step!==n){ A.step=n; Store.put(A); }
}
window.addEventListener('hashchange',()=>{ render(); window.scrollTo(0,0); $('#main').focus({preventScroll:true}); });

document.addEventListener('click',e=>{
  const nx=e.target.closest('[data-next]');
  if(nx){ const n=+nx.dataset.next; if(validate(n)){ save(); if(n===4) submit(); else location.hash='step-'+(n+1); } return; }
  const fo=e.target.closest('[data-focus]');
  if(fo){ e.preventDefault(); const id=fo.dataset.focus; if(id.startsWith('step-')){ location.hash=id; return; } (document.getElementById(id)||document.querySelector(`[data-f="${id}"] input`))?.focus(); return; }
  const a=e.target.closest('[data-act]'); if(!a) return;
  if(a.dataset.act==='fixphoto') fixPhoto();
  if(a.dataset.act==='jump'){ e.preventDefault(); const el=$(!(A.photo&&A.photo.ok)?'#photoCard':'#bioCard'); el.scrollIntoView({behavior:'smooth',block:'center'}); el.querySelector('input,button')?.focus(); }
});
document.addEventListener('change',e=>{
  if(e.target.id==='photoIn'&&e.target.files[0]) return readPhoto(e.target.files[0]);
  if(e.target.id==='bioIn'&&e.target.files[0]) return readBio(e.target.files[0]);
  if(e.target.closest('#main') && !e.target.closest('.verify')){ const f=e.target.closest('.f.err'); if(f) f.classList.remove('err'); collect(); save(); }
});
/* save while typing; clear an error while typing (not on blur: avoids the layout jump found in testing) */
let _st;
document.addEventListener('input',e=>{
  if(!e.target.closest('#main') || e.target.type==='file' || e.target.closest('.verify')) return;
  const f=e.target.closest('.f.err'); if(f) f.classList.remove('err');
  clearTimeout(_st); _st=setTimeout(()=>{ collect(); save(); },400);
});
window.addEventListener('beforeunload',()=>{ if(stored && canAccess(A)){ collect(); A.updated=Date.now(); Store.put(A); } });

render();
