/* CRP | Tabelas multivaloradas: contador e modo consulta/edicao. */
(function () {
  'use strict';
  if (window.__crpMultTabelas) return;
  window.__crpMultTabelas = true;
  function contarRegistros(tabela) {
    var linhas = tabela.querySelectorAll("tbody > tr"); var n = 0;
    Array.prototype.forEach.call(linhas, function (tr) {
      if (tr.classList.contains("header") || tr.classList.contains("template") || tr.hidden) return;
      if (getComputedStyle(tr).display === "none") return;
      var temTexto = (tr.textContent || "").trim().length > 0;
      var temControle = !!tr.querySelector("input:not([type='hidden']), select, textarea, [contenteditable='true'], button");
      if (!temTexto && !temControle) return;
      n++;
    });
    return n;
  }
  function temColunaEditavel(tabela) {
    var celulas = tabela.querySelectorAll("tbody > tr:not(.header) > td[column-name]");
    return Array.prototype.some.call(celulas, function (td) {
      if (td.querySelector("input:not([type='hidden']):not([type='file'])") || td.querySelector("select, textarea") || td.querySelector("[contenteditable='true']")) return true;
      if (td.querySelector("button[onclick*='fileUpload'], button[onclick*='files.']")) return true;
      var sug = td.querySelector("[data-special-type='suggest']");
      if (sug && !sug.readOnly && !sug.disabled) return true;
      return false;
    });
  }
  function aplicar() {
    var tabelas = document.querySelectorAll("#containerRequest table[mult='S']");
    Array.prototype.forEach.call(tabelas, function (t) {
      var edicao = temColunaEditavel(t);
      t.classList.toggle("crp-mult-readonly", !edicao);
      var n = contarRegistros(t);
      var vazio = !edicao && (getComputedStyle(t).display === "none" || n === 0);
      t.classList.toggle("crp-mult-empty", vazio);
      var wrap = t.closest(".table-responsive");
      if (wrap) wrap.classList.toggle("crp-mult-empty", vazio);
      var cap = t.querySelector(":scope > caption"); if (!cap) return;
      var span = cap.querySelector(":scope > .crp-mult-count");
      if (!span) { span = document.createElement("span"); span.className = "crp-mult-count"; cap.appendChild(span); }
      var txt = n === 1 ? "1 registro" : n + " registros";
      if (span.textContent !== txt) span.textContent = txt;
    });
  }
  var raf = 0; function agendar(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(aplicar); }
  function iniciar(){ aplicar(); document.addEventListener("multipletable-updatedRows", agendar, true);
    if (!document.body) return;
    var obs = new MutationObserver(agendar); obs.observe(document.body, { childList:true, subtree:true });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();