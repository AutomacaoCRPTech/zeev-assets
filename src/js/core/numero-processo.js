  function ajustarNumeroProcesso() {
    var selos = document.querySelectorAll(
      '#containerFiles #tblFile td.message > .text-right .badge'
    );

    Array.prototype.forEach.call(selos, function (selo) {
      if (selo.dataset.crpProcesso === '1') return;

      var alvo = selo.tagName === 'A' ? selo : (selo.querySelector('a') || selo);
      var numero = (alvo.textContent || '').replace(/[^0-9]/g, '');

      if (!numero) return;

      alvo.textContent = 'Processo #' + numero;
      selo.dataset.crpProcesso = '1';
    });
  }

  // Classifica o status de cada evento do Histórico para colorir o selo
  // (verde para concluído, âmbar para revisão e neutro para os demais),
  // sem alterar textos nem a ordem dos registros.
