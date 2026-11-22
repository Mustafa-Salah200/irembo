/* =====================================================================
   application.js — one application: pay the fee (step 5), follow the
   status, get a new payment code if it expired, print the receipt.
   URL: application.html?no=B2-xxxx-2026
   Payment confirmation is SIMULATED (no real money): the page confirms
   the payment a few seconds after the person starts it.
   Testing hook: add &expire=1 to the URL to make the payment code expire.
   ===================================================================== */

const NO = param('no');
let A = NO && Store.get(NO);
let justSubmitted = param('new')==='1', justSaved = param('saved')==='1', justPaid = false;

if(A && !A.submitted) location.replace('apply.html?no='+A.no);
if(A && param('expire')==='1' && !A.paidAt){ A.deadline=Date.now()-60000; Store.put(A); }
history.replaceState(null,'','application.html?no='+encodeURIComponent(NO||''));

const METHODS=[['mtn','MTN MoMo','Approve on your phone','phone-call'],['airtel','Airtel Money','Approve on your phone','phone-call'],['card','Bank card','Visa / Mastercard','card'],['ussd','USSD code','Any phone, no internet','coins']];
const methodName = id => (METHODS.find(m=>m[0]===id)||METHODS[0])[1];

function timeline(s){
  const paid=s==='Under review', exp=s==='Payment expired';
  const rows=[
    ['done','✓','Submitted',`${fmtDate(A.submittedAt)}. Your answers and documents reached DGIE.`],
    [paid?'done':exp?'warn':'now', paid?'✓':exp?'!':'2', paid?'Paid':exp?'Payment expired: your application is safe':'Waiting for payment',
       paid?`${fmtDate(A.paidAt)} with ${esc(A.method)}. Receipt sent by SMS.`:exp?'The payment code expired. Nothing is lost. Get a new code and pay.':`Pay before ${fmtDate(A.deadline)}. Review starts after payment.`],
    [paid?'now':'todo','3','Under review by DGIE','Usually 4 working days. DGIE may SMS you if something is missing.'],
    ['todo','4','Ready for collection','You get an SMS. Your new visa appears in “My documents”.']
  ];
  return `<div class="tl">${rows.map(([st,mark,t,d])=>`<div class="row ${st}"><div class="rail"><span class="dot">${mark}</span><span class="line"></span></div><div class="txt"><div class="tt">${t}</div><div class="td">${d}</div></div></div>`).join('')}</div>`;
}
const crumbs = () => `<div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="my-applications.html">My applications</a><span>/</span><span class="mono">${A.no}</span></div>`;
const statusHelp = `<details class="acc card tight" style="padding:16px 22px"><summary>What does each status mean?</summary><p><b>Draft</b>: not submitted yet. <b>Payment pending</b>: submitted, not yet paid. <b>Payment expired</b>: the payment code is no longer valid; get a new one, your answers are kept. <b>Under review</b>: a DGIE officer is checking your request. <b>Approved / Ready for collection</b>: your visa is ready. <b>Rejected</b>: DGIE explains why and what you can do.</p></details>`;

function render(){
  if(!A){
    flowEl().innerHTML=`<div class="crumbs"><a href="index.html">Home</a><span>/</span><span>My applications</span></div>
      <div><h1>Application not found</h1><p class="lead">We could not find application <strong class="mono">${esc(NO||'')}</strong> on this device.</p></div>
      <div class="actions" style="justify-content:flex-start"><a class="btn" href="find.html">Find my application</a><a class="btn sec" href="my-applications.html">My applications</a></div>`;
    setSide(sidePanel(null)); return;
  }
  const s=statusOf(A), fee=feeOf(A);
  let h='';

  if(s==='Payment pending'){
    A.method=A.method&&METHODS.some(m=>m[0]===A.method)?A.method:'mtn';
    h+=`<div>
      <div class="stephead"><span class="muted">Step 5 of 5 · <strong style="color:var(--ink)">Pay</strong></span><span class="saved">✓ Submitted</span></div>
      <ol class="stepbar" aria-label="Progress">${STEPS.map((x,i)=>`<li class="${i<4?'done':'cur'}"><span class="s ${i<4?'done':'cur'}"${i===4?' aria-current="step"':''}><span class="bar"></span><span class="lbl">${i<4?'✓ ':''}${x}</span></span></li>`).join('')}</ol></div>`;
    if(justSubmitted) h+=`<div class="okbox" role="status"><strong>✓ Application submitted.</strong> We sent an SMS to ${maskPhone(A.app.phone)} with your application number.</div>`;
    if(justSaved)     h+=`<div class="okbox" role="status"><strong>✓ Your changes were saved.</strong></div>`;
    h+=`<h1 class="step" style="margin:0">Pay the fee</h1>
    <div class="amount">
      <div class="top">
        <div><div class="k">Amount to pay</div><div class="big">${rwf(fee)}</div></div>
        <div><div class="k">Pay before</div><div style="font-weight:700">${fmtDate(A.deadline)}</div></div>
        <span class="pill warn" aria-label="Time left">${timeLeft(A.deadline)}</span>
      </div>
      <div class="bot">Payment code (Bill ID) <strong>${A.billId}</strong> is linked to your application number <strong>${A.no}</strong>. No need to write it down.</div>
    </div>
    <fieldset class="f" style="gap:12px"><legend><h2 style="margin:0;font-size:1.25rem">How do you want to pay?</h2></legend>
      <div class="methods">${METHODS.map(([id,n,hint,ic])=>`<label class="opt"><input type="radio" name="method" value="${id}" ${A.method===id?'checked':''}><span class="radio"></span><span class="ot"><span class="on" style="font-size:1rem">${n}</span><span class="od" style="color:var(--ink3)">${hint}</span></span><img class="oi" src="assets/icons/${ic}.svg" alt=""></label>`).join('')}</div>
    </fieldset>
    <label class="check plain"><input type="checkbox" id="remind" ${A.sms!==false?'checked':''}><span class="box"></span><span><span class="st">Remind me by SMS 2 days before the deadline</span><span class="sh">So my application isn't delayed if I pay later</span></span></label>
    <div class="actions"><a class="btn sec" href="apply.html?no=${A.no}#step-4">← Change my answers</a>
      <div class="right"><a class="btn link" href="my-applications.html" id="later">Pay later, I'll use the reminder</a><button class="btn" id="payBtn">Pay ${rwf(fee)}</button></div></div>
    <div class="card"><h2 style="font-size:1.25rem">Where is my application?</h2>${timeline(s)}</div>`;
  }

  else if(s==='Payment expired'){
    h+=crumbs()+`<div class="warnbox" role="alert" style="font-weight:400;color:var(--ink)"><strong style="color:var(--warn)">⚠ Your payment code expired on ${fmtDate(A.deadline)}.</strong><br>Your application is <strong>safe</strong>. You do <strong>not</strong> need to apply again. Get a new payment code and pay.</div>
    <div><div class="titlerow"><h1>Renew visa</h1>${tag(s)}</div><p style="margin:0;color:var(--ink2)">Application <strong class="mono" style="color:var(--ink)">${A.no}</strong> · handled by DGIE</p></div>
    <div><button class="btn" id="newBill">Get a new payment code</button></div>
    <div class="card"><h2 style="font-size:1.25rem">Where is my application?</h2>${timeline(s)}</div>`;
  }

  else { // Under review
    h+=crumbs();
    if(justPaid) h+=`<div class="okbox" role="status"><strong>✓ Payment received.</strong> Receipt sent by SMS to ${maskPhone(A.app.phone)}. DGIE will now review your request.</div>`;
    h+=`<div><div class="titlerow"><h1>Renew visa</h1>${tag(s)}</div><p style="margin:0;color:var(--ink2)">Application <strong class="mono" style="color:var(--ink)">${A.no}</strong> · handled by DGIE</p></div>
    <div class="card"><h2 style="font-size:1.25rem">Where is my application?</h2>${timeline(s)}</div>
    <div class="card receipt"><div class="headrow" style="margin-bottom:14px"><h2 style="font-size:1.25rem">Payment receipt</h2><button class="btn sec small noprint" onclick="window.print()">Print / save as PDF</button></div>
      ${[['Receipt no.',A.receipt],['Service',`Renew visa (${VISA[A.app.visa]?.[0]||''})`],['Applicant',`${esc(A.app.given)} ${esc(A.app.surname)}`],['Application no.',A.no],['Bill ID',A.billId],['Amount',rwf(fee)],['Paid with',esc(A.method)],['Date',fmtDate(A.paidAt)]]
        .map(([k,v])=>`<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div>`;
  }

  h+=statusHelp;
  flowEl().innerHTML=h;
  setSide(sidePanel(A));
  document.title=`${A.no} · ${s} · IremboGov`;
}

/* ---------- payment (simulated confirmation) ---------- */
function confirmPaid(method, scrim){
  A.paidAt=Date.now(); A.method=method; A.receipt='RCP-'+Date.now().toString().slice(-8);
  Store.put(A); scrim?.remove(); justPaid=true; justSubmitted=justSaved=false; render(); window.scrollTo(0,0);
}
function waitFor(scrim, method, ms){
  const t=setTimeout(()=>{ if(document.body.contains(scrim)) confirmPaid(method, scrim); }, ms);
  scrim.addEventListener('click',e=>{ if(e.target===scrim||e.target.closest('[data-close]')) clearTimeout(t); });
}
function pay(id){
  const fee=rwf(feeOf(A)), m=methodName(id);
  if(id==='ussd'){
    const s=modal(`<h2>Pay with USSD</h2><p>On any phone, dial:</p><p style="font:800 1.6rem 'IBM Plex Mono',monospace;margin:6px 0;color:var(--ink)">*xxx*${A.billId.replace(/\D/g,'')}#</p>
      <p>Choose <b>Pay</b>, check the amount (<b>${fee}</b>) and enter your PIN.</p>
      <p style="font-size:.875rem"><span class="spin"></span>This page updates by itself when your payment arrives.</p>
      <div class="actions"><button class="btn sec" data-close>Close</button></div>`);
    waitFor(s, 'USSD', 9000); return;
  }
  if(id==='card'){
    const s=modal(`<h2>Pay by bank card</h2><p>Amount: <b>${fee}</b></p>
      <p>You will continue on your bank's secure payment page to enter your card details. Irembo and DGIE never see your card number.</p>
      <div class="actions"><button class="btn sec" data-close>Cancel</button><button class="btn" id="cardGo">Continue to secure payment →</button></div>`);
    s.querySelector('#cardGo').onclick=()=>{
      s.querySelector('.modal').innerHTML=`<h2>Pay by bank card</h2><p><span class="spin"></span>Waiting for confirmation from your bank…</p>`;
      setTimeout(()=>confirmPaid('Bank card', s), 3000);
    };
    return;
  }
  const s=modal(`<h2>${m}</h2>
    <p>We sent a payment request for <b>${fee}</b> to <b>${maskPhone(A.app.phone)}</b>.</p>
    <p>Open the message on your phone and enter your PIN to approve. <b>Never share your PIN</b>: Irembo will never ask for it.</p>
    <p style="font-size:.875rem"><span class="spin"></span>Waiting for your approval… this page updates by itself.</p>
    <div class="actions"><button class="btn sec" data-close>Cancel</button></div>`);
  waitFor(s, m, 7000);
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  if(e.target.closest('#payBtn')) return pay(A.method||'mtn');
  if(e.target.closest('#newBill')){ newBill(A); Store.put(A); justSubmitted=justSaved=false; render(); toast('✓ New payment code created. Your answers were kept.'); window.scrollTo(0,0); }
  if(e.target.closest('#later')){ toast(A.sms!==false?'⏰ OK. We will remind you by SMS 2 days before the deadline.':'Remember to pay before the deadline.'); }
});
document.addEventListener('change',e=>{
  if(e.target.id==='remind'){ A.sms=e.target.checked; Store.put(A); }
  if(e.target.name==='method'){ A.method=e.target.value; Store.put(A); }
});

render();
/* keep the countdown and status up to date */
setInterval(()=>{ if(A && !A.paidAt && !$('.scrim')){ A=Store.get(A.no)||A; render(); } }, 60000);
