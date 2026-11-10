/* CRP | Modal de processamento ("Finalizando a tarefa..."): troca o gif
   nativo do Zeev por um personalizado e aplica o visual do protótipo. */
(function () {
  'use strict';
  if (window.__crpProcessando) return;
  window.__crpProcessando = true;

  var GIF = 'https://www.image2url.com/r2/default/gifs/1793995265290-97187ea0-cc48-4e33-9031-2252182ce873.gif';
  var SEL = 'img[src*="processing-task"]';

  function aplicar() {
    var imgs = document.querySelectorAll(SEL);
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.getAttribute('data-crp-processando') === '1') return;
      img.setAttribute('data-crp-processando', '1');
      img.setAttribute('alt', 'Processando a tarefa');
      img.setAttribute('src', GIF);

      var content = img.closest('.modal-content');
      if (content) content.classList.add('crp-processando');
      var modal = img.closest('.modal');
      if (modal) modal.classList.add('crp-processando');
    });
  }

  var agendado = false;
  function agendar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      aplicar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicar);
  } else {
    aplicar();
  }

  new MutationObserver(agendar).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
