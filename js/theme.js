/* theme.js — loaded in <head> so the saved theme / text size apply before the page is drawn (no white flash). */
(function(){
  var t = localStorage.getItem('irembo-pref-theme');
  if(t!=='dark' && t!=='light') t = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  if(localStorage.getItem('irembo-pref-large')==='1') document.documentElement.classList.add('large');
})();
