/* CRP | Carrega o layout dos relatórios sempre na versão mais recente do repo.
   Basta este <script> no campo "Scripts e estilos nos relatórios": o loader
   resolve o último commit e injeta CSS/JS do jsDelivr (imutáveis por SHA). */
(function () {
  'use strict';
  var REPO = 'AutomacaoCRPTech/zeev-assets';
  var FILES = [
    { t: 'css', p: 'producao/report/report.css' },
    { t: 'js', p: 'producao/report/report.js' }
  ];
  var API = 'https://api.github.com/repos/' + REPO + '/commits/main';
  var KEY = 'zeev-assets:report-sha';
  var TTL = 5 * 60 * 1000;

  function inject(sha) {
    FILES.forEach(function (f) {
      var url = 'https://cdn.jsdelivr.net/gh/' + REPO + '@' + sha + '/' + f.p;
      var el = document.createElement(f.t === 'css' ? 'link' : 'script');
      if (f.t === 'css') {
        el.rel = 'stylesheet';
        el.href = url;
      } else {
        el.src = url;
        el.defer = true;
      }
      document.head.appendChild(el);
    });
  }

  var sha = null;
  try {
    var c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.sha && Date.now() - c.t < TTL) sha = c.sha;
  } catch (e) {}
  if (sha) { inject(sha); return; }

  fetch(API, { cache: 'no-store', headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      var s = j.sha || 'main';
      try { localStorage.setItem(KEY, JSON.stringify({ sha: s, t: Date.now() })); } catch (e) {}
      inject(s);
    })
    .catch(function () { inject('main'); });
})();
