/* CRP | Nome do anexo na tabela multivalorada.
   Mostra apenas as 5 primeiras letras seguidas de "..." e mantem o nome
   COMPLETO no atributo data-crp-nome-completo/title (tooltip).
   Nao mexe em links de "Proposta" nem em outras telas. */
(function () {
  'use strict';
  if (window.__crpNomeCurtoAnexo) return;
  window.__crpNomeCurtoAnexo = true;
  function rotulos() {
    var links = document.querySelectorAll('#containerRequest table[mult="S"] .containerFormFileLink > a.small');
    Array.prototype.forEach.call(links, function (a) {
      if (a.classList.contains('crp-proposal-link')) return;
      var completo = a.getAttribute('data-crp-nome-completo') || (a.textContent || '').trim();
      if (!completo) return;
      if (!a.getAttribute('data-crp-nome-completo')) a.setAttribute('data-crp-nome-completo', completo);
      if (a.getAttribute('title') !== completo) a.setAttribute('title', completo);
      var curto = completo.length > 5 ? completo.slice(0, 5) + '...' : completo;
      if (a.textContent !== curto) a.textContent = curto;
    });
  }
  function iniciar() { rotulos();
    var observer = new MutationObserver(function () { rotulos(); });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();

