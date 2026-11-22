/* =====================================================================
   apply.js — the 4 form steps of "Renew my visa" (step 5, Pay, is on
   application.html). Answers are saved automatically as you type.
   URL: apply.html?no=B2-xxxx-2026#step-2
   ===================================================================== */

/* ---------- load or create the application ---------- */
let A = param('no') && Store.get(param('no'));
if(A && A.paidAt){ location.replace('application.html?no='+A.no); }      // paid: can no longer be edited
if(!A){ A = {no:newAppNo(), service:'Renew visa', app:{}, photo:null, bio:null, created:Date.now(), submitted:false, sms:true}; }
let stored = !!Store.get(A.no);          // saved only once the person starts typing
let photoImg = null;                     // the real image, kept in memory for "Make it fit for me"

function save(){
  A.updated=Date.now(); Store.put(A);
  if(!stored){ stored=true; history.replaceState(null,'',`apply.html?no=${A.no}${location.hash}`); }
  const s=$('#savedMsg'); if(s){ s.innerHTML=`✓ Saved automatically · Application number <b>${A.no}</b>, keep only this number`; }
}

/* ---------- pieces ---------- */
function stepper(n){
  return `<p class="stepcount">Step ${n} of 5 · <b>${STEPS[n-1]}</b></p>
  <ol class="stepper" aria-label="Progress">${STEPS.map((s,i)=>`<li class="${i+1<n?'done':i+1===n?'cur':''}" ${i+1===n?'aria-current="step"':''}><div class="bar"></div><span>${s}</span></li>`).join('')}</ol>
  <p class="saved" id="savedMsg" role="status">${stored?`✓ Saved automatically · Application number <b>${A.no}</b>, keep only this number`:`Your application number: <b>${A.no}</b>. Your answers are saved as you type.`}</p>`;
}
function field(id,label,{hint='',type='text',req=true,msg='',opts=null,why=''}={}){
  const v=esc(A.app[id]??'');
  const input = opts
    ? `<select id="${id}" name="${id}" aria-describedby="${id}-h ${id}-m"><option value="">Choose…</option>${opts.map(o=>`<option value="${esc(o[0])}" ${A.app[id]===o[0]?'selected':''}>${esc(o[1])}</option>`).join('')}</select>`
    : `<input id="${id}" name="${id}" type="${type}" value="${v}" aria-describedby="${id}-h ${id}-m" autocomplete="off">`;
  return `<div class="f" data-f="${id}"><label for="${id}">${label}${req?'':' <span class="rule" style="display:inline">(optional)</span>'}</label>
    ${hint?`<div class="hint" id="${id}-h">${hint}</div>`:''}${input}<div class="msg" id="${id}-m">${msg}</div>
    ${why?`<details><summary>Why do we ask this?</summary>${why}</details>`:''}</div>`;
}

/* ---------- steps ---------- */
const V={};
V[1] = () => `
  <div class="crumb"><a href="index.html">Home</a> › <a href="renew-visa.html">Renew my visa</a> › Apply</div>
  ${stepper(1)}
  <h1>Your visa</h1>
  <div id="es"></div>
  <fieldset class="f" data-f="visa"><legend>Which visa are you renewing?</legend>
    <div class="opts two">${Object.keys(VISA).map(k=>`<label class="opt"><input type="radio" name="visa" value="${k}" ${A.app.visa===k?'checked':''}><span><b>${VISA[k][0]}</b><small>${VISA[k][1]}</small><small>Fee: ${rwf(FEES[k])}</small></span></label>`).join('')}</div>
    <div class="msg">Choose the type of visa you have now.</div>
  </fieldset>
  <div class="grid2">
    ${field('nationality','Nationality',{opts:[['Sudan','Sudanese'],['DRC','Congolese (DRC)'],['Burundi','Burundian'],['Kenya','Kenyan'],['Uganda','Ugandan'],['Tanzania','Tanzanian'],['Nigeria','Nigerian'],['India','Indian'],['China','Chinese'],['Other','Other…']],msg:'Choose your nationality.'})}
    ${field('doctype','Travel document',{hint:'Most people use their passport.',opts:Object.entries(DOCTYPE),msg:'Choose your travel document.'})}
  </div>
  <div class="actions"><a class="btn sec" href="renew-visa.html">‹ Back</a><button class="btn" data-next="1">Continue ›</button></div>`;

V[2] = () => `
  ${stepper(2)}
  <h1>About you</h1>
  <p class="lead">Write your names exactly as they appear in your passport.</p>
  <div id="es"></div>
  <div class="grid2">
    ${field('surname','Family name (surname)',{hint:'Example: HASSAN',msg:'Enter your family name as written in your passport.'})}
    ${field('given','Given names (first and middle names)',{hint:'Example: Amina',msg:'Enter your given names as written in your passport.'})}
    ${field('dob','Date of birth',{type:'date',msg:'Enter your date of birth.'})}
    <fieldset class="f" data-f="gender"><legend>Sex (as in passport)</legend>
      <div class="opts two"><label class="opt"><input type="radio" name="gender" value="f" ${A.app.gender==='f'?'checked':''}><span>Female</span></label><label class="opt"><input type="radio" name="gender" value="m" ${A.app.gender==='m'?'checked':''}><span>Male</span></label></div>
      <div class="msg">Choose the sex shown in your passport.</div></fieldset>
  </div>
  <div class="card tint" style="padding:12px 16px">
    <h3>Family details</h3>
    <div class="grid2">
      ${field('father',"Father's full name",{msg:"Enter your father's full name. Write \"Unknown\" if you don't know it."})}
      ${field('mother',"Mother's full name",{msg:"Enter your mother's full name. Write \"Unknown\" if you don't know it."})}
    </div>
    <details><summary>Why do we ask for your parents' names?</summary>DGIE uses them to confirm your identity against immigration records, the same as at a border post. They are <b>only</b> seen by DGIE officers. If you don't know a name, write "Unknown". Your application will not be refused for this.</details>
    ${field('civil','Marital status',{opts:[['single','Single'],['married','Married'],['divorced','Divorced'],['widowed','Widowed']],msg:'Choose your marital status.',why:'Some visa types (for example Dependant) depend on your family situation.'})}
  </div>
  <div class="grid2">
    ${field('job','What do you do?',{hint:'Your job or main activity, e.g. Student, Teacher, Trader',msg:'Tell us your job or main activity.'})}
    ${field('district','Where do you live in Rwanda?',{opts:[['Gasabo','Gasabo (Kigali)'],['Kicukiro','Kicukiro (Kigali)'],['Nyarugenge','Nyarugenge (Kigali)'],['Musanze','Musanze'],['Huye','Huye'],['Rubavu','Rubavu'],['Rusizi','Rusizi'],['Other','Other district']],msg:'Choose your district.'})}
    <div class="f" data-f="phone"><label for="phone">Phone number for SMS updates</label><div class="hint" id="phone-h">Rwandan number, 9 digits after +250</div>
      <div style="display:flex;gap:6px"><span class="prefix">+250</span><input id="phone" type="tel" inputmode="numeric" value="${esc(A.app.phone??'')}" aria-describedby="phone-h phone-m" autocomplete="tel-national"></div>
      <div class="msg" id="phone-m">Enter 9 digits, e.g. 788 123 456 (without the first 0).</div></div>
    ${field('email','Email',{type:'email',req:false,hint:'Only if you want a copy by email'})}
  </div>
  <div class="actions"><a class="btn sec" href="#step-1">‹ Back</a><button class="btn" data-next="2">Continue ›</button></div>`;

function photoCard(){
  const p=A.photo, st=!p?'':(p.ok?'good':'bad');
  const r=(c,t)=>`<li class="${!p?'p':c?'y':'n'}">${t}</li>`;
  const canFix = p && !p.ok && p.typeOk && photoImg;
  const thumb = p && (p.url || (photoImg && p.tmpUrl));
  return `<div class="up ${st}" id="photoCard"><h3>1. Passport photo</h3>
  <div class="up-row"><div class="thumb" style="${thumb?`background-image:url(&quot;${thumb}&quot;)`:''}">${thumb?'':p?'📷':'No photo yet'}</div>
  <div style="flex:1;min-width:200px">
    <ul class="rules" aria-live="polite">
      ${r(p&&p.typeOk, p&&!p.typeOk?`File type is <b>${esc(p.ext)}</b>. It must be <b>JPG</b>`:'JPG file')}
      ${r(p&&p.sizeOk, p&&!p.sizeOk?`File is <b>${p.sizeTxt}</b>. It must be <b>200 KB or smaller</b>`:`200 KB or smaller${p?` (${p.sizeTxt})`:''}`)}
      ${r(p&&p.dimOk,  p&&!p.dimOk?`Photo is <b>${p.w||'?'} × ${p.h||'?'}</b> px. It must be <b>square</b>, at least 400 × 400`:`Square, at least 400 × 400 px${p&&p.w?` (${p.w} × ${p.h})`:''}`)}
    </ul>
    ${p&&!p.ok?`<div class="fix" role="alert"><b>This photo can't be used yet.</b> ${canFix?`We can fix it for you: we cut it to a square around the centre and make the file smaller. <b>Your face is not changed.</b>`:p.typeOk?`Choose the photo again and we can fix it for you.`:`Please choose a JPG photo, or take a new one with your phone camera.`}</div>`:''}
    ${p&&p.ok?`<div class="okbox">✓ Photo accepted${p.fixed?' (made smaller for you)':''}</div>`:''}
    <div class="upbtns">
      ${canFix?`<button class="btn" data-act="fixphoto">Make it fit for me</button>`:''}
      <span class="btn ${canFix||(p&&p.ok)?'sec':''} filebtn">${p?'Choose another photo':'Choose photo'}<input type="file" id="photoIn" accept=".jpg,.jpeg,image/jpeg" aria-label="Choose passport photo"></span>
    </div>
  </div></div></div>`;
}
function bioCard(){
  const b=A.bio, st=!b?'':(b.ok?'good':'bad');
  const r=(c,t)=>`<li class="${!b?'p':c?'y':'n'}">${t}</li>`;
  return `<div class="up ${st}" id="bioCard"><h3>2. Passport biodata page</h3>
  <div class="up-row"><div class="thumb tall">${b?'📄 '+esc(b.name):'No file yet'}</div><div style="flex:1;min-width:200px">
    <ul class="rules">${r(b&&b.typeOk, b&&!b.typeOk?`File type is <b>${esc(b.ext)}</b>. It must be a <b>PDF</b>. Tip: scan it with your phone's "Scan document" function`:'PDF file')}
    ${r(b&&b.sizeOk, b&&!b.sizeOk?`File is <b>${b.sizeTxt}</b>. It must be <b>500 KB or smaller</b>`:`500 KB or smaller${b?` (${b.sizeTxt})`:''}`)}</ul>
    ${b&&b.ok?`<div class="okbox">✓ Document accepted</div>`:''}
    <div class="upbtns"><span class="btn ${b&&b.ok?'sec':''} filebtn">${b?'Replace file':'Choose file'}<input type="file" id="bioIn" accept=".pdf,application/pdf" aria-label="Choose passport biodata page"></span></div>
  </div></div></div>`;
}
V[3] = () => {
  const missing=[!(A.photo&&A.photo.ok)&&'Passport photo', !(A.bio&&A.bio.ok)&&'Passport biodata page'].filter(Boolean);
  return `${stepper(3)}<h1>Documents</h1>
  <p class="lead">We check each file as soon as you choose it, so you know straight away if it can be used.</p>
  ${photoCard()}${bioCard()}
  ${missing.length ? `<div class="alert warn" id="missingBox" tabindex="-1">⚠ Still missing: <b>${missing.join(', ')}</b> · <a href="#" data-act="jump">jump to it</a></div>`
                   : `<div class="alert ok">✓ All documents are ready.</div>`}
  <div class="actions"><a class="btn sec" href="#step-2">‹ Back</a><button class="btn" data-next="3">Continue ›</button></div>`;
};
V[4] = () => {
  const a=A.app, vt=VISA[a.visa]||['—'];
  const sec=(t,n,rows)=>`<div class="sumsec"><div class="h"><h3>${t}</h3><a href="#step-${n}" aria-label="Edit ${t}">Edit</a></div><dl>${rows.map(r=>`<dt>${r[0]}</dt><dd>${esc(r[1])||'<i>—</i>'}</dd>`).join('')}</dl></div>`;
  return `${stepper(4)}<h1>Check your answers</h1>
  <p class="lead">Please check everything. You can change any part with "Edit".</p>
  <div id="es"></div>
  ${sec('Your visa',1,[['Request','Renew visa'],['Visa type',vt[0]],['Fee',a.visa?rwf(FEES[a.visa]):''],['Nationality',a.nationality],['Travel document',DOCTYPE[a.doctype]]])}
  ${sec('About you',2,[['Name',`${a.surname||''} ${a.given||''}`],['Date of birth',a.dob?fmtDate(a.dob+'T12:00',false):''],['Parents',`${a.father||''} · ${a.mother||''}`],['Marital status',a.civil],['Activity',a.job],['District',a.district],['Phone (SMS)',maskPhone(a.phone)],['Email',a.email]])}
  ${sec('Documents',3,[['Passport photo',A.photo&&A.photo.ok?'✓ Accepted':'Missing'],['Biodata page',A.bio&&A.bio.ok?'✓ Accepted':'Missing']])}
  <div class="consent f" data-f="consent"><label><input type="checkbox" id="consent" ${A.app.consent?'checked':''}><span>The information I gave is <b>true</b>. I agree that <b>DGIE</b> may use it <b>only</b> to process this visa request.</span></label><div class="msg">Please tick the box to confirm before submitting.</div></div>
  <p class="rule" style="margin-top:12px">You can still change your answers until DGIE starts the review.</p>
  <div class="actions"><a class="btn sec" href="#step-3">‹ Back</a><button class="btn" data-next="4">${A.submitted?'Save changes ›':'Submit application ›'}</button></div>`;
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
    if(el.type==='file') return;
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
    if(miss.length){ const mb=$('#missingBox'); if(mb){ mb.className='alert bad'; mb.focus(); } toast('Still missing: '+miss.join(' · ')); return false; }
  }
  if(n===4){
    const bad=!A.app.consent; setErr('consent',bad); if(bad) errs.push(['consent','Tick the box to confirm your information']);
    for(let k=1;k<=3;k++){ if(k<3 && NEED[k].some(([id])=>!A.app[id])){ errs.push(['step-'+k,`Complete step ${k}: ${STEPS[k-1]}`]); } }
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
  A.submitted=true; if(first) A.submittedAt=Date.now();
  if(!A.billId || Date.now()>A.deadline) newBill(A);
  save();
  location.href=`application.html?no=${A.no}${first?'&new=1':'&saved=1'}`;
}

/* ---------- router ---------- */
function step(){ const m=location.hash.match(/step-(\d)/); return m ? Math.min(4,Math.max(1,+m[1])) : 1; }
function render(){
  $('#main').innerHTML=V[step()]();
  $('#side').innerHTML=sidePanel(stored?A:null);
  document.title=`${STEPS[step()-1]} · Renew my visa · IremboGov`;
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
  if(e.target.closest('#main')){ const f=e.target.closest('.f.err'); if(f) f.classList.remove('err'); collect(); save(); }
});
/* save while typing; clear an error while typing (not on blur: avoids the layout jump found in testing) */
let _st;
document.addEventListener('input',e=>{
  if(!e.target.closest('#main') || e.target.type==='file') return;
  const f=e.target.closest('.f.err'); if(f) f.classList.remove('err');
  clearTimeout(_st); _st=setTimeout(()=>{ collect(); save(); },400);
});
window.addEventListener('beforeunload',()=>{ if(stored){ collect(); A.updated=Date.now(); Store.put(A); } });

render();
