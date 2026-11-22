/* =====================================================================
   application.js — one application: pay the fee (step 5), follow the
   status, get a new payment code if it expired, print the receipt.
   URL: application.html?no=B2-xxxx-2026
   Payment confirmation is SIMULATED (no real money): the page confirms
   the payment a few seconds after the person chooses a method.
   Testing hook: add &expire=1 to the URL to make the payment code expire.
   ===================================================================== */

const NO = param('no');
let A = NO && Store.get(NO);
let justSubmitted = param('new')==='1', justSaved = param('saved')==='1';

if(A && !A.submitted) location.replace('apply.html?no='+A.no);
if(A && param('expire')==='1' && !A.paidAt){ A.deadline=Date.now()-60000; Store.put(A); }
history.replaceState(null,'','application.html?no='+encodeURIComponent(NO||''));

function timeline(s){
  const paid=s==='Under review', exp=s==='Payment expired';
  return `<ol class="tl">
   <li class="done"><span class="ic">✓</span><div class="t">Submitted</div><div class="d">${fmtDate(A.submittedAt)}. Your answers and documents reached DGIE's queue.</div></li>
   <li class="${paid?'done':exp?'warn':'now'}"><span class="ic">${paid?'✓':exp?'!':'2'}</span><div class="t">${paid?'Paid':exp?'Payment expired: your application is safe':'Waiting for payment'}</div>
     <div class="d">${paid?`${fmtDate(A.paidAt)} with ${esc(A.method)}. Receipt sent by SMS.`:exp?'The payment code expired. Nothing is lost. Get a new code and pay.':`Pay before ${fmtDate(A.deadline)}. DGIE starts the review only after payment.`}</div></li>
   <li class="${paid?'now':''}"><span class="ic">3</span><div class="t">Under review by DGIE</div><div class="d">Usually 4 working days. DGIE may SMS you if something is missing.</div></li>
   <li><span class="ic">4</span><div class="t">Ready for collection</div><div class="d">You will get an SMS. Your new visa appears in "My documents" to download.</div></li></ol>`;
}

function render(){
  if(!A){
    $('#main').innerHTML=`<div class="crumb"><a href="index.html">Home</a> › My applications</div>
      <h1>Application not found</h1>
      <p class="lead">We could not find application <b class="mono">${esc(NO||'')}</b> on this device.</p>
      <div class="actions" style="justify-content:flex-start"><a class="btn" href="find.html">Find my application</a><a class="btn sec" href="my-applications.html">My applications</a></div>`;
    $('#side').innerHTML=sidePanel(null); return;
  }
  const s=statusOf(A), fee=feeOf(A);
  let h=`<div class="crumb"><a href="index.html">Home</a> › <a href="my-applications.html">My applications</a> › ${A.no}</div>`;

  if(s==='Payment pending'){
    h+=`<p class="stepcount">Step 5 of 5 · <b>Pay</b></p>
    <ol class="stepper" aria-label="Progress">${STEPS.map((x,i)=>`<li class="${i<4?'done':'cur'}" ${i===4?'aria-current="step"':''}><div class="bar"></div><span>${x}</span></li>`).join('')}</ol>`;
    if(justSubmitted) h+=`<div class="alert ok" role="status" style="margin-top:12px">✓ <b>Application submitted.</b> We sent an SMS to ${maskPhone(A.app.phone)} with your application number.</div>`;
    if(justSaved)     h+=`<div class="alert ok" role="status" style="margin-top:12px">✓ <b>Your changes were saved.</b></div>`;
    h+=`<h1>Pay the fee</h1>
    <div class="ref"><div class="sub">Your application number: <b>the only number you need</b></div><div class="num">${A.no}</div>
      <div class="sub">Your payment code (Bill ID <span class="mono">${A.billId}</span>) is linked to this number. You don't need to write it down.</div></div>
    <div class="due"><div><div class="rule">Amount to pay</div><div class="amt">${rwf(fee)}</div></div>
      <div><div class="rule">Pay before</div><b>${fmtDate(A.deadline)}</b></div>
      <div class="clock" aria-label="Time left">⏳ ${timeLeft(A.deadline)}</div></div>
    <h2>How do you want to pay?</h2>
    <div class="paygrid">
      <button class="paybtn" data-pay="MTN MoMo">MTN MoMo<small>Approve on your phone</small></button>
      <button class="paybtn" data-pay="Airtel Money">Airtel Money<small>Approve on your phone</small></button>
      <button class="paybtn" data-pay="Bank card">Bank card<small>Visa / Mastercard</small></button>
      <button class="paybtn" data-pay="USSD">USSD code<small>Any phone, no internet</small></button>
    </div>
    <label class="opt" style="margin-bottom:10px"><input type="checkbox" id="remind" ${A.sms!==false?'checked':''}><span><b>Remind me by SMS 2 days before the deadline</b><small>So my application is not delayed if I pay later</small></span></label>
    <div class="actions"><a class="btn sec" href="apply.html?no=${A.no}#step-4">Change my answers</a><a class="btn link" href="my-applications.html" id="later">Pay later: I'll use the reminder</a></div>
    <div class="card" style="margin-top:20px"><h2>Where is my application?</h2>${timeline(s)}</div>`;
  }

  else if(s==='Payment expired'){
    h+=`<div class="alert warn" role="alert"><b>⚠ Your payment code expired on ${fmtDate(A.deadline)}.</b><br>Your application is <b>safe</b>. You do <b>not</b> need to apply again. Get a new payment code and pay.</div>
    <h1>Renew visa ${tag(s)}</h1>
    <p class="lead">Application number <b class="mono">${A.no}</b> · handled by DGIE</p>
    <button class="btn" id="newBill">Get a new payment code</button>
    <div class="card" style="margin-top:16px"><h2>Where is my application?</h2>${timeline(s)}</div>`;
  }

  else { // Under review
    if(justPaid) h+=`<div class="alert ok" role="status">✓ <b>Payment received.</b> Receipt sent by SMS to ${maskPhone(A.app.phone)}. DGIE will now review your request.</div>`;
    h+=`<h1>Renew visa ${tag(s)}</h1>
    <p class="lead">Application number <b class="mono">${A.no}</b> · handled by DGIE</p>
    <div class="card"><h2>Where is my application?</h2>${timeline(s)}</div>
    <div class="card receipt"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h2 style="margin:0">Payment receipt</h2><button class="btn sec small noprint" onclick="window.print()">🖨 Print / save as PDF</button></div>
      <dl style="margin-top:10px"><dt>Receipt no.</dt><dd class="mono">${A.receipt}</dd><dt>Service</dt><dd>Renew visa (${VISA[A.app.visa]?.[0]||''})</dd><dt>Applicant</dt><dd>${esc(A.app.surname)} ${esc(A.app.given)}</dd>
      <dt>Application no.</dt><dd class="mono">${A.no}</dd><dt>Bill ID</dt><dd class="mono">${A.billId}</dd><dt>Amount</dt><dd>${rwf(fee)}</dd><dt>Paid with</dt><dd>${esc(A.method)}</dd><dt>Date</dt><dd>${fmtDate(A.paidAt)}</dd></dl></div>`;
  }

  h+=`<details><summary>What does each status mean?</summary><b>Draft</b>: not submitted yet. <b>Payment pending</b>: submitted, not yet paid. <b>Payment expired</b>: the payment code is no longer valid; get a new one, your answers are kept. <b>Under review</b>: a DGIE officer is checking your request. <b>Approved / Ready for collection</b>: your visa is ready. <b>Rejected</b>: DGIE explains why and what you can do.</details>`;
  $('#main').innerHTML=h;
  $('#side').innerHTML=sidePanel(A);
  document.title=`${A.no} · ${s} · IremboGov`;
}
let justPaid=false;

/* ---------- payment (simulated confirmation) ---------- */
function confirmPaid(method, scrim){
  A.paidAt=Date.now(); A.method=method; A.receipt='RCP-'+Date.now().toString().slice(-8);
  Store.put(A); scrim?.remove(); justPaid=true; justSubmitted=justSaved=false; render(); window.scrollTo(0,0);
}
function waitFor(scrim, method, ms){
  const t=setTimeout(()=>{ if(document.body.contains(scrim)) confirmPaid(method, scrim); }, ms);
  scrim.addEventListener('click',e=>{ if(e.target===scrim||e.target.closest('[data-close]')) clearTimeout(t); });
}
function pay(m){
  const fee=rwf(feeOf(A));
  if(m==='USSD'){
    const s=modal(`<h2>Pay with USSD</h2><p>On any phone, dial:</p><p style="font:800 1.6rem Consolas,monospace;margin:6px 0">*xxx*${A.billId.replace(/\D/g,'')}#</p>
      <p>Choose <b>Pay</b>, check the amount (<b>${fee}</b>) and enter your PIN.</p>
      <p class="rule"><span class="spin"></span>This page updates by itself when your payment arrives.</p>
      <div class="actions"><button class="btn sec" data-close>Close</button></div>`);
    waitFor(s, 'USSD', 9000); return;
  }
  if(m==='Bank card'){
    const s=modal(`<h2>Pay by bank card</h2><p>Amount: <b>${fee}</b></p>
      <p>You will continue on your bank's secure payment page to enter your card details. Irembo and DGIE never see your card number.</p>
      <div class="actions"><button class="btn sec" data-close>Cancel</button><button class="btn" id="cardGo">Continue to secure payment ›</button></div>`);
    s.querySelector('#cardGo').onclick=()=>{
      s.querySelector('.modal').innerHTML=`<h2>Pay by bank card</h2><p><span class="spin"></span>Waiting for confirmation from your bank…</p>`;
      setTimeout(()=>confirmPaid('Bank card', s), 3000);
    };
    return;
  }
  const s=modal(`<h2>${m}</h2>
    <p>We sent a payment request for <b>${fee}</b> to <b>${maskPhone(A.app.phone)}</b>.</p>
    <p>Open the message on your phone and enter your PIN to approve. <b>Never share your PIN</b>: Irembo will never ask for it.</p>
    <p class="rule"><span class="spin"></span>Waiting for your approval… this page updates by itself.</p>
    <div class="actions"><button class="btn sec" data-close>Cancel</button></div>`);
  waitFor(s, m, 7000);
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const pb=e.target.closest('[data-pay]'); if(pb) return pay(pb.dataset.pay);
  if(e.target.id==='newBill'){ newBill(A); Store.put(A); justSubmitted=justSaved=false; render(); toast('✓ New payment code created. Your answers were kept.'); window.scrollTo(0,0); }
  if(e.target.id==='later'){ toast(A.sms!==false?'⏰ OK. We will remind you by SMS 2 days before the deadline.':'Remember to pay before the deadline.'); }
});
document.addEventListener('change',e=>{ if(e.target.id==='remind'){ A.sms=e.target.checked; Store.put(A); } });

render();
/* keep the countdown and status up to date */
setInterval(()=>{ if(A && !A.paidAt && !$('.scrim')){ A=Store.get(A.no)||A; render(); } }, 60000);
