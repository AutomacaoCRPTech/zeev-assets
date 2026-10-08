/* CRP | Resumo: icones de grupo, grupos vazios e campos de largura total. */
(function () {
  'use strict';
  if (window.__crpResumoVisual) return;
  window.__crpResumoVisual = true;
  var RE_FULL = /(nome|e-?mail|descri|justific|observa|endere|motivo|mensagem|condi|detalh|texto)/i;
  function iframeOrigemVazio(ifr) {
    if (!ifr) return false;
    try {
      var d = ifr.contentDocument;
      var t = d && d.body ? (d.body.innerText || d.body.textContent || "").trim() : "";
      return t === "";
    } catch (e) { return false; }
  }
  function aplicar() {
    var resumo = document.getElementById('crp-summary'); if (!resumo) return;
    var vis = getComputedStyle(resumo).display !== 'none';
    var grupos = resumo.querySelectorAll('.crp-readonly-group');
    Array.prototype.forEach.call(grupos, function (g) {
      var tabela = g.querySelector('table.form'); if (!tabela) return;
      var lc = tabela.querySelectorAll("tbody > tr");
      Array.prototype.forEach.call(lc, function (tr) {
        if (tr.classList.contains("group")) return;
        var ifr = tr.querySelector('iframe[xname="inpfluxoOrigem"]');
        if (!ifr) return;
        if (iframeOrigemVazio(ifr)) { if (tr.style.display !== "none") tr.style.display = "none"; }
        else if (tr.style.display === "none") tr.style.display = "";
      });
      if (vis) { var linhas = tabela.querySelectorAll("tbody > tr"); var tem=false;
        Array.prototype.forEach.call(linhas, function(tr){ if(tr.classList.contains("group"))return; if(getComputedStyle(tr).display!=="none") tem=true; });
        if (g.classList.contains("crp-empty") === tem) g.classList.toggle("crp-empty", !tem); }
      Array.prototype.forEach.call(lc, function (tr) {
        if (tr.classList.contains("group")) return;
        if (tr.querySelector(".containerFormFileLink") || tr.querySelector("textarea") || tr.querySelector('[xtype="TEXTAREA"]')) { if(!tr.classList.contains("crp-full")) tr.classList.add("crp-full"); return; }
        var c0 = tr.querySelector("td.col0"); var c1 = tr.querySelector("td.col1");
        var rot = c0 ? c0.textContent : ""; var val = c1 ? c1.textContent : "";
        var cheio = RE_FULL.test(rot) || (val && val.trim().length > 34);
        if (cheio && !tr.classList.contains("crp-full")) tr.classList.add("crp-full");
      });
    });
    if (vis) {
      var arr = Array.prototype.slice.call(resumo.querySelectorAll(':scope > .crp-readonly-group')).filter(function (g) { return getComputedStyle(g).display !== 'none'; });
      var sozinho = (arr.length % 2 === 1);
      var alvo = sozinho ? arr[arr.length - 1] : null;
      Array.prototype.forEach.call(resumo.querySelectorAll(':scope > .crp-readonly-group'), function (g) {
        var deve = (g === alvo);
        if (g.classList.contains('crp-last-span') !== deve) g.classList.toggle('crp-last-span', deve);
      });
    }
  }
  var raf = 0; function agendar(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(aplicar); }
  function iniciar(){ aplicar();
    var card = document.getElementById('crp-info-card'); if(!card) return;
    var obs = new MutationObserver(agendar);
    obs.observe(card, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden','style','class'] });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();

