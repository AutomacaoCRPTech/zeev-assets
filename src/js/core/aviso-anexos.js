  function posicionarAviso(aviso, header) {
    if (!aviso) return;

    if (window.innerWidth <= 640) {
      var rodape = document.getElementById('controllers');
      var altura = rodape ? Math.round(rodape.getBoundingClientRect().height) : 0;
      aviso.style.top = 'auto';
      aviso.style.bottom = (altura + 16) + 'px';
    } else {
      aviso.style.bottom = 'auto';
      if (header) {
        aviso.style.top = Math.round(header.getBoundingClientRect().bottom + 12) + 'px';
      }
    }
  }

  function atualizarAvisoAnexos(s) {
    var painel = s.root.querySelector('#containerFiles');
    var aviso = document.getElementById('crp-anexos-aviso');

    // Desfaz a versão antiga, que movia o bloco para fora do grupo.
    var cardAntigo = document.getElementById('crp-required-files-card');

    if (cardAntigo) {
      var bloco = cardAntigo.querySelector('#mandatoryAnnex');

      if (bloco && painel) painel.appendChild(bloco);
      if (cardAntigo.parentNode) cardAntigo.parentNode.removeChild(cardAntigo);
    }

    if (!s.info) return;

    var pendente = statusAnexos(s.root) === 'pendente';

    if (!pendente) {
      avisoFechado = false;
      if (aviso) aviso.hidden = true;
      return;
    }

    if (avisoFechado) {
      if (aviso) aviso.hidden = true;
      return;
    }

    if (!aviso) {
      aviso = el('div', 'crp-anexos-aviso');
      aviso.id = 'crp-anexos-aviso';
      aviso.setAttribute('role', 'status');
      aviso.style.position = 'fixed';
      aviso.style.right = '24px';
      aviso.style.zIndex = '1090';
      aviso.style.display = 'flex';
      aviso.style.alignItems = 'center';
      aviso.style.gap = '10px';
      aviso.style.maxWidth = '340px';
      aviso.style.padding = '10px 14px';
      aviso.style.border = '1px solid #f0c36d';
      aviso.style.borderRadius = '10px';
      aviso.style.background = '#fff8e6';
      aviso.style.boxShadow = '0 6px 18px rgba(120,80,0,0.14)';
      aviso.style.fontSize = '13px';
      aviso.style.lineHeight = '1.4';
      aviso.style.color = '#7a5600';

      aviso.appendChild(
        el(
          'span',
          'crp-anexos-aviso-texto',
          'Há anexos obrigatórios pendentes nesta tarefa.'
        )
      );

      var botao = el('button', 'crp-anexos-aviso-acao', 'Clique aqui e veja');
      botao.type = 'button';
      botao.style.border = '0';
      botao.style.borderRadius = '8px';
      botao.style.padding = '6px 10px';
      botao.style.background = '#053f88';
      botao.style.color = '#fff';
      botao.style.fontSize = '12px';
      botao.style.fontWeight = '600';
      botao.style.whiteSpace = 'nowrap';
      botao.style.cursor = 'pointer';

      botao.addEventListener('click', function () {
        var item = s.items.filter(function (i) {
          return i.panel.id === 'containerFiles';
        })[0];

        if (item) activate(item);
        s.info.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });

      aviso.appendChild(botao);

      var fechar = el('button', 'crp-anexos-aviso-fechar', '×');
      fechar.type = 'button';
      fechar.setAttribute('aria-label', 'Fechar aviso');
      fechar.style.border = '0';
      fechar.style.background = 'transparent';
      fechar.style.color = '#7a5600';
      fechar.style.fontSize = '18px';
      fechar.style.lineHeight = '1';
      fechar.style.cursor = 'pointer';
      fechar.style.padding = '0 2px';
      fechar.addEventListener('click', function () {
        avisoFechado = true;
        aviso.hidden = true;
      });

      aviso.appendChild(fechar);
    }

    // Desktop: fixo à direita abaixo da barra. Mobile: rodapé direito.
    var header = s.root.querySelector('.page-title.crp-header') || s.root.querySelector('.page-title');
    var host = s.root.ownerDocument.body;

    if (aviso.parentNode !== host) host.appendChild(aviso);

    posicionarAviso(aviso, header);

    if (!window.__crpAvisoResize) {
      window.__crpAvisoResize = true;
      window.addEventListener('resize', function () {
        posicionarAviso(document.getElementById('crp-anexos-aviso'), s.root.querySelector('.page-title.crp-header') || s.root.querySelector('.page-title'));
      });
    }

    aviso.hidden = avisoFechado;
  }
