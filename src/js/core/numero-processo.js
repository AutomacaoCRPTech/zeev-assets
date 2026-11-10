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

    mostrarNumeroNoCabecalho();
  }

  // Exibe "Processo #NNNN" logo abaixo do título da tarefa no cabeçalho.
  // O número vem do campo oculto do Zeev (inpCodFlowExecute). Só altera o
  // DOM quando o texto muda, para não realimentar o MutationObserver.
  function mostrarNumeroNoCabecalho() {
    var header = document.querySelector('#containerRequest .crp-header');
    if (!header) return;

    var titulo = header.querySelector('h1');
    var campo = document.getElementById('inpCodFlowExecute');
    var numero = campo ? String(campo.value || '').replace(/[^0-9]/g, '') : '';
    if (numero === '0') numero = '';

    var selo = header.querySelector('.crp-header-numero');

    // O Zeev já mostra o número ("#5227") ao lado do nome do processo, mas
    // ele some no celular. Marca esse selo nativo para o CSS escondê-lo e
    // deixar só o nosso, visível em todas as larguras.
    if (numero && titulo) {
      Array.prototype.forEach.call(header.querySelectorAll('*'), function (n) {
        if (n === selo || n.children.length) return;
        if (n.classList.contains('crp-header-numero-nativo')) return;
        var t = (n.textContent || '').replace(/\s+/g, '');
        if (t === '#' + numero || t === numero) {
          n.classList.add('crp-header-numero-nativo');
        }
      });
    }

    if (!numero || !titulo) {
      if (selo && !selo.hidden) selo.hidden = true;
      return;
    }

    // Link nativo do número (abre o relatório da solicitação). Continua no
    // DOM, só escondido; o nosso selo repassa o clique para ele.
    var nativo = header.querySelector('.crp-header-numero-nativo');
    var linkNativo = nativo && (nativo.closest('a') || nativo.querySelector('a'));

    if (!selo) {
      selo = document.createElement('a');
      selo.className = 'crp-header-numero';
      selo.addEventListener('click', function (e) {
        var alvo = selo.crpLinkNativo;
        if (!alvo) return;
        // Sem href real, o comportamento está no onclick do Zeev: dispara
        // o clique no link original.
        var href = alvo.getAttribute('href') || '';
        if (!href || href === '#' || /^javascript:/i.test(href)) {
          e.preventDefault();
          alvo.click();
        }
      });
    }

    selo.crpLinkNativo = linkNativo || null;

    var href = linkNativo ? linkNativo.getAttribute('href') || '' : '';
    var hrefReal = href && href !== '#' && !/^javascript:/i.test(href);
    var target = linkNativo ? linkNativo.getAttribute('target') || '' : '';

    if (hrefReal) {
      if (selo.getAttribute('href') !== href) selo.setAttribute('href', href);
    } else if (linkNativo) {
      if (selo.getAttribute('href') !== '#') selo.setAttribute('href', '#');
    } else if (selo.hasAttribute('href')) {
      selo.removeAttribute('href');
    }

    if (target) {
      if (selo.getAttribute('target') !== target) selo.setAttribute('target', target);
    } else if (selo.hasAttribute('target')) {
      selo.removeAttribute('target');
    }

    var dica = linkNativo ? 'Abrir relatório da solicitação' : '';
    if (dica) {
      if (selo.getAttribute('title') !== dica) selo.setAttribute('title', dica);
    } else if (selo.hasAttribute('title')) {
      selo.removeAttribute('title');
    }

    if (selo.previousElementSibling !== titulo) {
      titulo.parentNode.insertBefore(selo, titulo.nextSibling);
    }

    var texto = 'Processo #' + numero;
    if (selo.textContent !== texto) selo.textContent = texto;
    if (selo.hidden) selo.hidden = false;
  }

  // Classifica o status de cada evento do Histórico para colorir o selo
  // (verde para concluído, âmbar para revisão e neutro para os demais),
  // sem alterar textos nem a ordem dos registros.
