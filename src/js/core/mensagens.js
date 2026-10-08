  function ajustarMensagens() {
    var linhas = document.querySelectorAll('#containerMessages #tblMessageBody > tr');

    Array.prototype.forEach.call(linhas, function (linha) {
      if (linha.dataset.crpMensagem === '1') return;

      var cabecalho = linha.querySelector('td.message > div:first-child');
      var rodape = linha.querySelector('td.message > .text-right');

      if (!cabecalho || !rodape) return;

      var meta = rodape.querySelector('.small');
      var selo = rodape.querySelector('.badge');
      var texto = meta ? (meta.textContent || '').trim() : '';
      var pos = texto.indexOf(',');
      var data = pos >= 0 ? texto.slice(0, pos).trim() : texto;
      var atividade = pos >= 0 ? texto.slice(pos + 1).trim() : '';

      var frag = document.createDocumentFragment();

      if (atividade) {
        var at = document.createElement('span');
        at.className = 'crp-msg-atividade';
        at.textContent = atividade;
        frag.appendChild(at);
      }

      if (selo) {
        var link = selo.tagName === 'A' ? selo : selo.querySelector('a');
        var numero = ((link || selo).textContent || '').replace(/[^0-9]/g, '');

        if (numero) {
          if (atividade) {
            var ponto = document.createElement('span');
            ponto.className = 'crp-msg-sep';
            ponto.textContent = '\u00b7';
            frag.appendChild(ponto);
          }

          var proc = document.createElement(link ? 'a' : 'span');
          proc.className = 'crp-msg-processo';
          proc.textContent = 'Processo #' + numero;

          if (link) {
            proc.setAttribute('href', link.getAttribute('href'));
            if (link.getAttribute('target')) proc.setAttribute('target', link.getAttribute('target'));
          }

          frag.appendChild(proc);
        }
      }

      rodape.textContent = '';
      rodape.appendChild(frag);

      if (data) {
        var dataEl = document.createElement('span');
        dataEl.className = 'crp-msg-data';
        dataEl.textContent = data;
        cabecalho.appendChild(dataEl);
      }

      linha.dataset.crpMensagem = '1';
    });
  }

  // Mostra o número do processo como "Processo #NNNN" no card de anexos,
  // preservando o link quando o número já é clicável.
