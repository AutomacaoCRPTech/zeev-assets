  function posicionarAviso(aviso, header) {
    if (!aviso) return;

    if (window.innerWidth <= 640) {
      var rodape = document.getElementById('controllers');
      var altura = rodape ? Math.round(rodape.getBoundingClientRect().height) : 0;
      aviso.style.top = 'auto';
      aviso.style.bottom = (altura + 16) + 'px';
    } else {
      // Fixo no topo da janela: acompanha a rolagem sem depender da
      // posição do cabeçalho (que sai da tela ao rolar). 64px deixa
      // livre o botão X (fechar tarefa) do Zeev no canto superior direito.
      aviso.style.bottom = 'auto';
      aviso.style.top = '64px';
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
      // Visual no CSS (24-prototipo.css, seção "Aviso de anexos").
      // Aqui ficam só o posicionamento e o ícone.
      aviso.style.position = 'fixed';
      aviso.style.right = '24px';
      aviso.style.zIndex = '1090';

      var icone = el('span', 'crp-anexos-aviso-icone');
      icone.setAttribute('aria-hidden', 'true');
      aviso.appendChild(icone);

      var texto = el('div', 'crp-anexos-aviso-texto');
      texto.appendChild(
        el('strong', 'crp-anexos-aviso-titulo', 'Anexo obrigatório pendente')
      );
      texto.appendChild(
        el('span', 'crp-anexos-aviso-desc', 'Envie os documentos na aba Anexos.')
      );
      aviso.appendChild(texto);

      var botao = el('button', 'crp-anexos-aviso-acao', 'Ver anexos');
      botao.type = 'button';

      botao.addEventListener('click', function () {
        var item = s.items.filter(function (i) {
          return i.panel.id === 'containerFiles';
        })[0];

        if (item) activate(item);
        s.info.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });

      aviso.appendChild(botao);

      var fechar = el('button', 'crp-anexos-aviso-fechar');
      fechar.type = 'button';
      fechar.setAttribute('aria-label', 'Fechar aviso');
      fechar.setAttribute('title', 'Fechar aviso');
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
