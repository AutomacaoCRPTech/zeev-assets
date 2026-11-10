(function () {
  'use strict';

  if (window.CRPForm && window.CRPForm.baseVersion === '2.0.0') return;

  var state;
  var observer;
  var timer;
  var avisoFechado = false;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    node.className = className || '';
    if (text) node.textContent = text;
    return node;
  }

  function sameForm(a, b) {
    return a.closest('form') === b.closest('form');
  }

  function move(node, target) {
    if (
      node &&
      node.parentNode !== target &&
      sameForm(node, target)
    ) {
      target.appendChild(node);
    }
  }

  function setup() {
    var root = document.getElementById('containerRequest');
    var form = root && root.querySelector('#ContainerForm');
    var body = form && form.querySelector('#BoxFrmExecute');
    var main = root && root.querySelector('.main-col');

    if (!body || !main) return;
    if (state && state.body === body) return state;

    root.classList.add('crp-form', 'crp-workspace', 'crp-proto');
    main.classList.add('crp-main');

    var header = root.querySelector('.page-title');
    if (header) header.classList.add('crp-header');

    form.classList.add('crp-form-shell');
    body.classList.add('crp-work-grid');

    var original = Array.prototype.slice.call(body.childNodes);
    var left = el('div', 'crp-context-column');
    var right = el('div', 'crp-action-column');

    body.appendChild(left);
    body.appendChild(right);

    var info = el('section', 'crp-card crp-info');
    info.id = 'crp-info-card';

    info.appendChild(
      el('h2', 'crp-card-title', 'Informações da solicitação')
    );

    var tabs = el('div', 'crp-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Informações da solicitação');

    var summary = el('div', 'crp-panel crp-summary');
    summary.id = 'crp-summary';

    info.appendChild(tabs);
    info.appendChild(summary);
    left.appendChild(info);

    var actions = el('section', 'crp-card crp-actions');

    actions.appendChild(
      el('h2', 'crp-action-title', 'Suas ações nesta etapa')
    );

    var content = el('div', 'crp-action-content');
    actions.appendChild(content);
    right.appendChild(actions);

    original.forEach(function (node) {
      content.appendChild(node);
    });

    state = {
      root: root,
      body: body,
      main: main,
      left: left,
      right: right,
      info: info,
      tabs: tabs,
      summary: summary,
      actions: actions,
      content: content,
      items: [],
      active: null
    };

    addTab(summary, 'Geral');

    return state;
  }

  function addTab(panel, label, count, singular) {
    if (
      !panel ||
      state.items.some(function (i) {
        return i.panel === panel;
      })
    ) {
      return;
    }

    if (!sameForm(panel, state.info)) return;

    panel.classList.add('crp-panel');
    panel.setAttribute('role', 'tabpanel');

    var button = el('button', 'crp-tab', label);
    button.type = 'button';
    button.id = 'crp-tab-' + panel.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);

    panel.setAttribute('aria-labelledby', button.id);

    move(panel, state.info);
    state.tabs.appendChild(button);

    var item = {
      panel: panel,
      button: button,
      label: label,
      count: count,
      singular: singular
    };

    state.items.push(item);

    if (!state.active) state.active = item;

    button.addEventListener('click', function () {
      activate(item);
    });

    button.addEventListener('keydown', function (e) {
      if (
        ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0
      ) {
        return;
      }

      e.preventDefault();

      var index = state.items.indexOf(item);

      if (e.key === 'Home') {
        index = 0;
      } else if (e.key === 'End') {
        index = state.items.length - 1;
      } else {
        index = (
          index +
          (e.key === 'ArrowRight' ? 1 : -1) +
          state.items.length
        ) % state.items.length;
      }

      activate(state.items[index]);
      state.items[index].button.focus();
    });
  }

  function activate(item) {
    state.active = item;
    render();
  }
  function statusAnexos(root) {
    var escopo = root || document;

    var obrigatorioPendente = false;
    var algumEnviado = false;

    // Anexos obrigatórios do Zeev (módulo de captura).
    var blocoObrig =
      escopo.querySelector('#mandatoryAnnex') ||
      document.querySelector('#mandatoryAnnex');

    if (blocoObrig) {
      blocoObrig
        .querySelectorAll('[cod][onclick*="capture.upload"]')
        .forEach(function (doc) {
          var enviado = !!doc.querySelector('.icon-remove');
          if (enviado) algumEnviado = true;
          else obrigatorioPendente = true;
        });
    }

    // Campos de arquivo do formulário.
    Array.prototype.slice
      .call(
        escopo.querySelectorAll(
          "[data-fieldformat='FILE'],[data-fieldformat='FILE_VIEW']"
        )
      )
      .forEach(function (campo) {
        var linha = campo.closest('tr') || campo.parentElement;
        var visivel =
          linha &&
          linha.offsetParent !== null &&
          getComputedStyle(linha).display !== 'none';
        if (!visivel) return;

        var enviado = String(campo.value || '').trim() !== '';
        if (enviado) algumEnviado = true;
        // Campos de anexo do próprio formulário (no meio do formulário ou
        // nas "suas ações nesta etapa") não geram pendência na aba Anexos:
        // o anexo é preenchido no próprio campo. O balão e a bolinha
        // vermelha ficam restritos ao bloco nativo (#mandatoryAnnex).
      });

    // Qualquer anexo (contador do Zeev).
    var contador =
      escopo.querySelector('#commands .count-files') ||
      document.querySelector('#commands .count-files');
    if (
      contador &&
      Number(String(contador.textContent).replace(/[^\d]/g, '')) > 0
    ) {
      algumEnviado = true;
    }

    if (obrigatorioPendente) return 'pendente';
    if (algumEnviado) return 'ok';
    return 'nenhum';
  }

  // Mantém o plural correto: "1 mensagem", "2 anexos", "0 mensagens".
  // O rótulo da aba já é o plural; o singular vem declarado, porque em
  // português não dá para deduzir pelo final ("mensagens" -&gt; "mensagem",
  // e o plural não é o singular mais um "s").
  function palavraContagem(item, plural) {
    var nomeDaAba = String(item.label || '')
      .toLowerCase()
      .trim();

    var singular = String(item.singular || '')
      .toLowerCase()
      .trim();

    if (plural || !singular) return nomeDaAba;

    return singular;
  }

  // Repõe apenas os spans internos do botão. O elemento, o id e o
  // clique já registrados são preservados.
  function montarRotuloAba(item, quantidade, temContador) {
    var botao = item.button;
    var nome = palavraContagem(item, quantidade !== 1);

    var rotulo = el('span', 'crp-tab-label');
    rotulo.appendChild(document.createTextNode(item.label));

    if (temContador) {
      rotulo.appendChild(document.createTextNode(' '));
      rotulo.appendChild(
        el('span', 'crp-tab-count', String(quantidade))
      );
    }

    var descricao = el('span', 'crp-tab-desc');
    descricao.id = botao.id + '-desc';
    descricao.textContent = temContador ? quantidade + ' ' + nome : '';
    rotulo.appendChild(descricao);

    botao.textContent = '';
    botao.appendChild(rotulo);

    botao.setAttribute('aria-label', item.label);

    return descricao;
  }

  function render() {
    state.items.forEach(function (item) {
      var active = state.active === item;
  
      item.panel.hidden = !active;
      item.button.setAttribute('aria-selected', String(active));
      item.button.tabIndex = active ? 0 : -1;
  
      var count = item.count &&
        state.root.querySelector('#commands .' + item.count);

      var temContador = !!count;
      var textoContador = count ? count.textContent.trim() : '';
      var quantidade =
        Number(textoContador.replace(/[^\d]/g, '')) || 0;

      // Só remontamos o conteúdo quando o número muda, para não
      // reconstruir os spans a cada atualização do observador.
      var assinatura =
        item.label + '|' + (count ? quantidade : 'sem');

      if (item.rotuloAtual !== assinatura) {
        item.rotuloAtual = assinatura;
        item.descricao = montarRotuloAba(item, quantidade, temContador);
      }

      // Descrição acessível e dica ao passar o mouse carregam o texto
      // completo, porque o selo visível mostra apenas o número.
      var textoCompleto = temContador
        ? quantidade + ' ' + palavraContagem(item, quantidade !== 1)
        : '';

      if (item.panel.id === 'containerFiles') {
        // Anexos: pendente = vermelho, ok = verde, nenhum = sem bolinha.
        var status = statusAnexos(state.root);

        item.button.setAttribute('data-crp-anexos', status);
        item.button.setAttribute('data-crp-tem-conteudo', 'false');

        // A bolinha mantém a regra atual de status; a pendência ganha
        // uma descrição para não depender só da cor.
        if (status === 'pendente') {
          var aviso = 'Há documento obrigatório pendente de anexar.';

          textoCompleto = textoCompleto
            ? textoCompleto + '. ' + aviso
            : aviso;
        }
      } else {
        var temConteudo =
          item.panel.id === 'containerMessages' && quantidade > 0;

        item.button.setAttribute(
          'data-crp-tem-conteudo',
          temConteudo ? 'true' : 'false'
        );
      }

      item.descricao.textContent = textoCompleto;
      atualizarSeloPainel(item, quantidade, temContador);

      if (textoCompleto) {
        item.button.setAttribute(
          'aria-describedby',
          item.descricao.id
        );
        item.button.setAttribute('data-crp-dica', textoCompleto);
      } else {
        item.button.removeAttribute('data-crp-dica');
        item.button.removeAttribute('aria-describedby');
      }
    });

    marcarAbaAtiva();
  }

  // ===== Layout do protótipo (Figma ZEEV-CRP) =====
  // Cabeçalho padrão dos cards: círculo azul-marinho com ícone, rótulo em
  // caixa alta e título. Os blocos são criados uma única vez e reaproveitados
  // a cada atualização; nada do Zeev é removido, apenas escondido por CSS.

  function cabecalho(icone, rotulo, titulo) {
    var head = el('div', 'crp-head');
    head.setAttribute('data-crp-head', icone);

    var ic = el('span', 'crp-head-icon');
    ic.setAttribute('data-icon', icone);
    ic.setAttribute('aria-hidden', 'true');
    head.appendChild(ic);

    var textos = el('div', 'crp-head-text');
    textos.appendChild(el('span', 'crp-head-label', rotulo));
    var h = el('h2', 'crp-head-title', titulo || '');
    if (!titulo) h.hidden = true;
    textos.appendChild(h);
    head.appendChild(textos);

    var selo = el('span', 'crp-head-badge');
    selo.hidden = true;
    head.appendChild(selo);

    return head;
  }

  // Garante o cabeçalho como primeiro filho do container (ou antes de
  // "antesDe", quando informado). Retorna o cabeçalho existente ou novo.
  function garantirCabecalho(container, icone, rotulo, titulo, antesDe) {
    if (!container) return null;

    var head = container.querySelector(':scope > .crp-head');

    if (!head) {
      head = cabecalho(icone, rotulo, titulo);
    }

    var ref = antesDe && antesDe.parentNode === container ? antesDe : null;

    if (ref) {
      if (head.parentNode !== container || head.nextSibling !== ref) {
        container.insertBefore(head, ref);
      }
    } else if (container.firstChild !== head) {
      container.insertBefore(head, container.firstChild);
    }

    return head;
  }

  function definirTitulo(head, texto) {
    if (!head) return;
    var h = head.querySelector('.crp-head-title');
    if (!h) return;
    if (h.textContent !== texto) h.textContent = texto;
    var vazio = !texto;
    if (h.hidden !== vazio) h.hidden = vazio;
  }

  function definirSelo(head, texto, tom) {
    if (!head) return;
    var selo = head.querySelector('.crp-head-badge');
    if (!selo) return;
    if (selo.textContent !== (texto || '')) selo.textContent = texto || '';
    var vazio = !texto;
    if (selo.hidden !== vazio) selo.hidden = vazio;
    var t = tom || 'neutro';
    if (selo.getAttribute('data-tom') !== t) selo.setAttribute('data-tom', t);
  }

  function resumoChecklist(checklist) {
    var caixas = checklist.querySelectorAll('input[type="checkbox"]');
    var total = caixas.length;
    if (!total) return '';
    var feitos = Array.prototype.filter.call(caixas, function (c) {
      return c.checked;
    }).length;
    return feitos + ' de ' + total + (total === 1 ? ' item concluído' : ' itens concluídos');
  }

  function garantirCabecalhos(s) {
    // Resumo (aba Geral).
    garantirCabecalho(s.summary, 'resumo', 'Resumo', 'Dados da solicitação');

    // Ações: o título antigo continua no DOM, escondido por CSS.
    var tituloAcoes = s.actions.querySelector(':scope > .crp-action-title');
    garantirCabecalho(s.actions, 'acoes', 'Ações', 'Preencha para concluir a tarefa', tituloAcoes);

    // Painéis nativos do Zeev.
    garantirCabecalho(
      s.root.querySelector('#containerMessages'),
      'mensagens', 'Mensagens', 'Conversa da solicitação'
    );
    garantirCabecalho(
      s.root.querySelector('#containerFiles'),
      'anexos', 'Anexos', 'Arquivos da solicitação'
    );
    garantirCabecalho(
      s.root.querySelector('#containerHistory'),
      'historico', 'Histórico', 'Linha do tempo da solicitação'
    );

    // Orientações: só rótulo; o texto das instruções vem logo abaixo.
    var orientacoes = s.root.querySelector('#crp-instructions-card');
    if (orientacoes) {
      garantirCabecalho(orientacoes, 'orientacoes', 'Orientações', '');
    }

    // Checklist: rótulo + "X de Y itens concluídos".
    var checklist = s.root.querySelector('#ContainerConclusionCheckList');
    if (checklist) {
      var headChk = garantirCabecalho(checklist, 'checklist', 'Checklist', '');
      definirTitulo(headChk, resumoChecklist(checklist));
    }
  }

  // Selo à direita do cabeçalho dos painéis (contagem e pendência).
  function atualizarSeloPainel(item, quantidade, temContador) {
    var head = item.panel.querySelector(':scope > .crp-head');
    if (!head) return;

    if (item.panel.id === 'containerFiles') {
      var status = statusAnexos(state.root);
      if (status === 'pendente') {
        definirSelo(head, 'Anexo obrigatório pendente', 'pendente');
        return;
      }
    }

    if (temContador) {
      definirSelo(head, quantidade + ' ' + palavraContagem(item, quantidade !== 1), 'neutro');
    } else {
      definirSelo(head, '', 'neutro');
    }
  }

  // A aba Geral mostra Resumo + Ações; as demais escondem o card de ações.
  function marcarAbaAtiva() {
    var geral = !!(state.active && state.active.panel === state.summary);
    if (state.root.classList.contains('crp-aba-geral') !== geral) {
      state.root.classList.toggle('crp-aba-geral', geral);
    }
  }

  function atualizarVisibilidadeAcoes(s) {
    var card = s.actions;
    var conteudo = s.content;

    // Visibilidade que IGNORA o próprio esconderijo do modo "sem ação".
    // Não mexemos no DOM para medir (evita o card piscar); usamos a cadeia de
    // estilos e não getClientRects (que seria 0 com o card oculto).
    function estaVisivel(elemento) {
      var atual = elemento;
      while (atual && atual.nodeType === 1) {
        if (atual === card || (atual.classList && atual.classList.contains('crp-approval-hidden'))) {
          atual = atual.parentElement;
          continue;
        }
        var estilo = getComputedStyle(atual);
        if (
          atual.hidden ||
          estilo.display === 'none' ||
          estilo.visibility === 'hidden' ||
          estilo.visibility === 'collapse'
        ) {
          return false;
        }
        atual = atual.parentElement;
      }
      return true;
    }

        var seletores = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="reset"])',
      'select',
      'textarea',
      'button',
      '[role="button"]',
      '[contenteditable="true"]'
    ].join(',');

    var temAcao = Array.prototype.some.call(
      conteudo.querySelectorAll(seletores),
      function (campo) {
        if (campo.matches(':disabled') || campo.readOnly) {
          return false;
        }

        if (campo.closest('[inert], [aria-disabled="true"]')) {
          return false;
        }

        if (estaVisivel(campo)) return true;

        // Alguns uploads usam input escondido e label visível.
        if (campo.matches('input[type="file"]') && campo.labels) {
          return Array.prototype.some.call(
            campo.labels,
            estaVisivel
          );
        }

        return false;
      }
    );

    // Campo de anexo (com arquivo já anexado ou botão de upload) também é
    // ação — senão, ao anexar, o botão some e o card era escondido.
    if (!temAcao) {
      temAcao = Array.prototype.some.call(
        conteudo.querySelectorAll('[data-fieldformat="FILE"],[data-fieldformat="FILE_VIEW"]'),
        function (campo) {
          // Só conta como ação o anexo EDITÁVEL (tem botão de upload). Listas
          // de documentos somente leitura não devem manter o card visível.
          var linha = campo.closest('tr') || campo.parentElement;
          var botao = linha && linha.querySelector('button[onclick*="fileUpload"]');
          if (!botao) return false;
          return estaVisivel(linha || campo);
        }
      );
    }

    // Aplica só o estado desejado e apenas quando muda (sem alternar/piscar).
    if (temAcao) {
      if (card.hidden) card.hidden = false;
      if (card.style.display === 'none') card.style.removeProperty('display');
      if (card.classList.contains('crp-approval-hidden')) card.classList.remove('crp-approval-hidden');
    } else {
      if (!card.hidden) card.hidden = true;
      card.style.setProperty('display', 'none', 'important');
      if (!card.classList.contains('crp-approval-hidden')) card.classList.add('crp-approval-hidden');
    }
  }

  // Anexos obrigatórios: o bloco permanece na aba Anexos (origem do Zeev).
  // A pendência é sinalizada por um aviso no card de informações.
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
  function update() {
    if (!setup()) return;

    var s = state;
    var semAcaoAtual = false;
    (function () {
      var ct = s.actions && s.actions.querySelector('.crp-action-content');
      var alvo = ct || s.actions;
      // Só conta como "ação" quando há controle interativo VISÍVEL.
      // Textos/labels de blocos ocultos (ex.: "Equipamentos") não valem.
      var temVis = alvo && Array.prototype.some.call(
        alvo.querySelectorAll('input:not([type="hidden"]),select,textarea,button,a,img'),
        function (e) { return e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none'; }
      );
      var temTabela = alvo && Array.prototype.some.call(
        alvo.querySelectorAll("table[mult=\"S\"]"),
        function (t) { return t.getClientRects().length > 0 && t.querySelectorAll("tbody tr:not(.header)").length > 0; }
      );
      semAcaoAtual = !temVis && !temTabela;
    })();

    // Incorpora blocos inseridos posteriormente pelo Zeev.
    Array.prototype.slice.call(s.body.childNodes).forEach(
      function (node) {
        if (node !== s.left && node !== s.right) {
          s.content.appendChild(node);
        }
      }
    );

    s.items = s.items.filter(function (item) {
      if (s.root.contains(item.panel)) return true;
      item.button.remove();
      return false;
    });

    if (s.items.indexOf(s.active) < 0) {
      s.active = s.items[0];
    }

    // Somente grupos simples de consulta vão para a esquerda.
    s.body.querySelectorAll('table.form').forEach(function (table) {
      var wrapper = table.closest('table[id="FrmExecute"]') || table;

      var interactive = wrapper.querySelector(
        'input:not([type="hidden"]), select, textarea, button, [contenteditable="true"]'
      );

      var multiple = wrapper.querySelector('table[mult="S"]');
      var side = wrapper.getAttribute('data-crp-side');

      var readonly = side === 'context' ||
        (side !== 'actions' && !interactive && !multiple);

      wrapper.classList.toggle('crp-readonly-group', readonly);

      move(wrapper, readonly ? s.summary : s.content);

    });

    var instructions = s.root.querySelector('.instructions-text');

    if (instructions && sameForm(instructions, s.right)) {
      var instructionsCard = s.root.querySelector(
        '#crp-instructions-card'
      );

      if (!instructionsCard) {
        instructionsCard = document.createElement('section');
        instructionsCard.id = 'crp-instructions-card';
        instructionsCard.className = 'crp-card';

        var heading = document.createElement('h2');
        heading.className = 'crp-card-title';
        heading.textContent = 'Informações relevantes';

        instructionsCard.appendChild(heading);
      }

      // Posiciona o card imediatamente antes das ações.
      // Mantém o card antes das ações, sem disputarem posição com o
      // card de anexos obrigatórios.
      var destinoIns = semAcaoAtual ? s.left : s.right;
      if (destinoIns === s.left) {
        if (instructionsCard.parentNode !== s.left) {
          s.left.appendChild(instructionsCard);
        }
      } else if (
        instructionsCard.parentNode !== s.right ||
        instructionsCard.nextElementSibling !== s.actions
      ) {
        s.right.insertBefore(instructionsCard, s.actions);
      }

      if (instructions.parentNode !== instructionsCard) {
        var oldContainer = instructions.parentElement;

        instructionsCard.appendChild(instructions);

        if (
          oldContainer &&
          oldContainer.matches('.box, .crp-instructions') &&
          oldContainer.children.length === 0 &&
          !oldContainer.textContent.trim()
        ) {
          oldContainer.remove();
        }
      }
    }

    var checklist = s.root.querySelector(
      '#ContainerConclusionCheckList'
    );

    if (checklist && sameForm(checklist, s.right)) {
      checklist.classList.add('crp-card', 'crp-checklist');

      if (!checklist.querySelector('h5, h2')) {
        checklist.insertBefore(
          el('h2', 'crp-card-title', 'Checklist'),
          checklist.firstChild
        );
      }

      var destinoChk = semAcaoAtual ? s.left : s.right;
      if (destinoChk === s.left) {
        s.left.appendChild(checklist);
      } else if (checklist.parentNode !== s.right) {
        s.right.insertBefore(checklist, s.actions);
      }
    }

    [
      ['containerMessages', 'Mensagens', 'count-messages', 'mensagem'],
      ['containerFiles', 'Anexos', 'count-files', 'anexo'],
      ['containerHistory', 'Histórico', null, null]
    ].forEach(function (def) {
      var panel = s.root.querySelector('#' + def[0]);

      if (
        !panel ||
        s.items.some(function (item) {
          return item.panel === panel;
        })
      ) {
        return;
      }

      if (
        panel.hidden ||
        getComputedStyle(panel).display === 'none'
      ) {
        return;
      }

      addTab(panel, def[1], def[2], def[3]);
    });

    // Mantém os atalhos e ações auxiliares acessíveis.
    var commands = s.root.querySelector('#commands');
    var sidebar = commands && commands.closest('aside');

    if (sidebar && !sidebar.contains(s.body)) {
      sidebar.classList.add('crp-auxiliary');
      move(sidebar, s.left);
    }

    if (commands && !commands.dataset.crpBound) {
      commands.dataset.crpBound = '1';

      commands.addEventListener('click', function (e) {
        var link = e.target.closest('a');
        if (!link) return;

        var item = s.items.find(function (i) {
          return link.getAttribute('href') === '#' + i.panel.id;
        });

        if (!item) return;

        e.preventDefault();
        activate(item);

        s.info.scrollIntoView({
          block: 'start',
          behavior: 'smooth'
        });
      });
    }

    ['BtnSend', 'btnFinish'].forEach(function (id) {
      var button = s.root.querySelector('#' + id);

      if (button) {
        button.classList.add('crp-action-primary');
      }
    });

    var review = document.getElementById(
      'customBtn_Revisão solicitada'
    );

    if (review && s.root.contains(review)) {
      review.classList.add('crp-action-review');
      review.style.removeProperty('background-color');
      review.style.removeProperty('border-color');
      review.style.removeProperty('color');
    }

    atualizarAvisoAnexos(s);
    garantirCabecalhos(s);

    // Resumo sem conteúdo (ex.: tarefa de abertura do processo): esconde
    // apenas o card de resumo. A aba "Geral" continua existindo (é nela que
    // ficam as ações do usuário) e as demais abas também permanecem.
    var temResumo = s.summary.querySelectorAll('.crp-readonly-group').length > 0;
    s.root.classList.toggle('crp-resumo-vazio', !temResumo);

    render();
    classificarStatusHistorico();
    ajustarNumeroProcesso();
    ajustarMensagens();
    ajustarArquivosCampos();
    atualizarVisibilidadeAcoes(s);

    // Ordem quando sem ação: Informações relevantes -> Checklist -> Info da solicitação.
    // Só reordena quando a ordem atual está diferente, para não gerar
    // mutações em loop (que faziam a página voltar ao topo).
    if (semAcaoAtual) {
      var info = s.root.querySelector('#crp-info-card');
      var ins = s.root.querySelector('#crp-instructions-card');
      var chk = s.root.querySelector('#ContainerConclusionCheckList');
      var aux = s.left.querySelector('.crp-auxiliary');
      var ordem = [ins, chk, info, aux].filter(Boolean);
      var atual = ordem.filter(function (c) { return s.left.contains(c); });
      var atualFiltrado = Array.prototype.slice.call(s.left.children).filter(function (c) { return ordem.indexOf(c) >= 0; });
      var jaCorreto = atualFiltrado.length === ordem.length && atualFiltrado.every(function (c, i) { return c === ordem[i]; });
      if (!jaCorreto) {
        ordem.forEach(function (c) { s.left.appendChild(c); });
      }
    }
  }

  // Padroniza os anexos dos campos do formulário (Resumo e Ações) sem
  // alterar URLs, IDs, eventos nem o comportamento nativo de cada campo.
  function ajustarArquivosCampos() {
    var root = document.getElementById('containerRequest');

    if (!root) return;

    // Botão de download de cada arquivo.
    Array.prototype.forEach.call(
      root.querySelectorAll('.containerFormFileLink > a[donwload], .containerFormFileLink > a[download]'),
      function (botao) {
        if (botao.dataset.crpBaixar === '1') return;

        botao.setAttribute('aria-label', 'Baixar arquivo');
        botao.setAttribute('title', 'Baixar arquivo');
        botao.dataset.crpBaixar = '1';
      }
    );

    // Botão de remover, somente quando o campo oferecer a ação.
    Array.prototype.forEach.call(
      root.querySelectorAll('.containerFormFileLink a[onclick*="files.delete"], .containerFormFileLink a[onclick*="fileUpload.delete"], td.col1:has(.containerFormFileLink) a[onclick*="files.delete"], td.col1:has(.containerFormFileLink) a[onclick*="fileUpload.delete"]'),
      function (botao) {
        if (botao.dataset.crpRemover === '1') return;

        botao.setAttribute('aria-label', 'Remover arquivo');
        botao.setAttribute('title', 'Remover arquivo');
        botao.dataset.crpRemover = '1';
      }
    );

    // Botão de anexar arquivo do campo editável.
    Array.prototype.forEach.call(
      root.querySelectorAll('button[onclick*="fileUpload"]'),
      function (botao) {
        if (botao.dataset.crpAnexar === '1') return;

        var multi = !!botao.closest('table[mult="S"]');
        var campo = botao.closest('td');
        var arquivos = campo ? campo.querySelectorAll('.containerFormFileLink a[href*="/document/preview/"]').length : 0;
        var texto = multi && arquivos > 0 ? 'Adicionar arquivo' : 'Anexar arquivo';

        if (!botao.children.length && botao.textContent.trim() !== texto) {
          botao.textContent = texto;
        }

        botao.dataset.crpAnexar = '1';
      }
    );

    // Campo de anexo do formulário (fora das multivaloradas): marca a célula
    // com crp-file-field e o estado (vazio|anexado) para o CSS do protótipo.
    // Nada do Zeev é movido nem recriado; só classe e atributos, e apenas
    // quando mudam (a função roda a cada ciclo do MutationObserver).
    var celulasArquivo = [];
    Array.prototype.forEach.call(
      root.querySelectorAll(
        '.crp-action-content button[onclick*="fileUpload"],' +
        '.crp-action-content .containerFormFileLink a[onclick*="fileUpload.delete"],' +
        '.crp-action-content .containerFormFileLink a[onclick*="files.delete"],' +
        '.crp-action-content td:has(> .containerFormFileLink) > a[onclick*="fileUpload.delete"],' +
        '.crp-action-content td:has(> .containerFormFileLink) > a[onclick*="files.delete"]'
      ),
      function (el) {
        if (el.closest('table[mult="S"]')) return;
        var td = el.closest('td');
        if (td && celulasArquivo.indexOf(td) < 0) celulasArquivo.push(td);
      }
    );
    celulasArquivo.forEach(function (td) {
      if (!td.classList.contains('crp-file-field')) td.classList.add('crp-file-field');

      var link = td.querySelector('.containerFormFileLink a.small, .containerFormFileLink a[href*="/document/preview/"]');
      var estado = link && (link.textContent || '').trim() ? 'anexado' : 'vazio';
      if (td.getAttribute('data-crp-file-state') !== estado) td.setAttribute('data-crp-file-state', estado);

      var remover = td.querySelector('a[onclick*="fileUpload.delete"], a[onclick*="files.delete"]');
      var podeRemover = remover ? 'sim' : 'nao';
      if (td.getAttribute('data-crp-file-remove') !== podeRemover) td.setAttribute('data-crp-file-remove', podeRemover);

      // O botão original continua sendo o que dispara o upload; só ganha
      // o nome acessível do novo texto visual.
      var anexar = td.querySelector('button[onclick*="fileUpload"]');
      if (anexar && anexar.getAttribute('aria-label') !== 'Clique para anexar') {
        anexar.setAttribute('aria-label', 'Clique para anexar');
      }
    });

    // CRP | Campos de arquivo em tabelas multivaloradas: o controle nativo de
    // remocao vira um botao-icone (icone desenhado via CSS ::before),
    // preservando handler, URL e atributos.
    Array.prototype.forEach.call(
      root.querySelectorAll('table[mult="S"] .containerFormFileLink a[onclick*="fileUpload.delete"], table[mult="S"] .containerFormFileLink [data-crp-remover="1"]'),
      function (botao) {
        if (botao.childNodes.length) botao.textContent = '';
        if (botao.getAttribute('aria-label') !== 'Apagar arquivo') botao.setAttribute('aria-label', 'Apagar arquivo');
        if (botao.getAttribute('title') !== 'Apagar arquivo') botao.setAttribute('title', 'Apagar arquivo');
      }
    );
  }

  // Reorganiza o card de mensagem: data no cabeçalho e, no rodapé,
  // a atividade de origem e o processo (preservando link, se houver).
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
  function classificarStatusHistorico() {
    var escopo = document.getElementById('containerHistoryRender');

    if (!escopo) return;

    // Subprocesso: a instancia atual possui uma instancia mestre diferente.
    var subprocesso = false;
    var atual = document.getElementById('inpCodFlowExecute');
    var mestre = document.getElementById('inpCodFlowExecuteMaster');
    if (atual && mestre) {
      var a = (atual.value || '').trim();
      var m = (mestre.value || '').trim();
      subprocesso = m !== '' && m !== '0' && m !== a;
    }

    // Registro de abertura = tarefa mais antiga (menor data-id).
    var abertura = null, menor = null;
    escopo.querySelectorAll(':scope > .row').forEach(function (r) {
      var id = parseInt(r.getAttribute('data-id'), 10);
      if (isNaN(id)) return;
      if (menor === null || id < menor) { menor = id; abertura = r; }
    });

    escopo.querySelectorAll('.badge').forEach(function (selo) {
      var texto = (selo.textContent || '').toLowerCase();
      var status = 'neutro';

      if (texto.indexOf('subprocesso') >= 0) status = 'subprocesso';
      else if (texto.indexOf('conclu') >= 0) status = 'concluido';
      else if (texto.indexOf('revis') >= 0) status = 'revisao';

      var vazio = (selo.textContent || '').trim() === '';
      if (subprocesso && vazio && abertura && abertura.contains(selo)) {
        selo.textContent = 'Subprocesso';
        status = 'subprocesso';
      }

      if (selo.getAttribute('data-crp-status') !== status) {
        selo.setAttribute('data-crp-status', status);
      }
    });
  }

  function refresh() {
    if (observer) observer.disconnect();

    try {
      update();
    } finally {
      if (observer) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: [
            'hidden',
            'style',
            'class',
            'disabled',
            'readonly'
          ]
        });
      }
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(refresh, 100);
  }

  window.CRPForm = {
    baseVersion: '2.0.0',
    atualizar: refresh
  };

  function start() {
    observer = new MutationObserver(schedule);
    document.addEventListener('change', schedule);
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

/* Ajuste do botão Salvar. */
(function () {
  'use strict';

  var observer;

  function ajustarSalvar() {
    var root = document.getElementById('containerRequest');
    if (!root) return false;

    var options = root.querySelector('#inpOtherOptions');
    var footer = root.querySelector('#buttons');

    if (!options || !footer) return false;

    var save = root.querySelector('.crp-save-button');

    if (!save) {
      save = Array.prototype.find.call(
        root.querySelectorAll('#ContainerForm button[onclick]'),
        function (button) {
          var action = button
            .getAttribute('onclick')
            .replace(/[\s;]/g, '');

          return action === 'save(false)';
        }
      );
    }

    if (!save) return false;

    var group = options.parentElement;

    if (!footer.contains(group)) return false;

    if (save.closest('form') !== group.closest('form')) {
      return false;
    }

    group.classList.add('crp-footer-secondary');

    save.classList.add('crp-save-button');
    save.classList.remove('float-right', 'm-2');
    save.type = 'button';

    if (save.parentElement !== group) {
      group.appendChild(save);
    }

    sincronizarEstado(save);

    if (!save.crpEstadoObservado) {
      save.crpEstadoObservado = true;
      new MutationObserver(function () {
        sincronizarEstado(save);
      }).observe(save, {
        attributes: true,
        attributeFilter: ['disabled', 'class']
      });
    }

    return true;
  }

  /* Comunica o estado do botão (habilitado apenas quando há alterações). */
  function sincronizarEstado(save) {
    var inativo = save.disabled || save.classList.contains('disabled');
    var rotulo = inativo ? 'Nenhuma alteração para salvar' : 'Salvar dados do formulário';

    save.title = rotulo;
    save.setAttribute('aria-label', rotulo);
    save.setAttribute('aria-disabled', inativo ? 'true' : 'false');
  }

  function iniciar() {
    if (ajustarSalvar()) return;

    observer = new MutationObserver(function () {
      if (ajustarSalvar()) observer.disconnect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();

/* CRP | Tarefa SEM AÇÃO: exibe um layout de conferência (hero + cartões)
   reaproveitando o estilo crp-approval-*. Quando há ação, nada muda. */
(function () {
  'use strict';
  var CHAVE = '__crpNoActionView';
  if (window[CHAVE]) return;
  window[CHAVE] = true;

  var CLASSE = 'crp-approval-view';
  var estilo = document.createElement('style');
  estilo.id = 'crp-noaction-style';
  document.head.appendChild(estilo);

  function estaVisivel(elemento) {
    if (!elemento) return false;
    var atual = elemento;
    while (atual && atual.nodeType === 1) {
      // Ignora o próprio esconderijo do modo "sem ação".
      if (atual.classList && atual.classList.contains('crp-approval-hidden')) {
        atual = atual.parentElement;
        continue;
      }
      var estilo = getComputedStyle(atual);
      if (
        atual.hidden ||
        estilo.display === 'none' ||
        estilo.visibility === 'hidden' ||
        atual.classList.contains('d-none') ||
        atual.classList.contains('hide')
      ) {
        return false;
      }
      atual = atual.parentElement;
    }
    return true;
  }

  function remover(container) {
    if (!container) return;
    if (container.classList.contains(CLASSE)) container.classList.remove(CLASSE);
    var hero = container.querySelector('.crp-approval-hero');
    if (hero) hero.remove();
    var resumo = container.querySelector('#crp-summary');
    if (resumo) resumo.classList.remove('crp-approval-summary-visible');
    var acoes = container.querySelector('.crp-actions');
    if (acoes) acoes.classList.remove('crp-approval-hidden');
  }

  // Mesma detecção usada por visibilidade-acoes.js — os dois módulos precisam
  // concordar, senão um esconde e o outro mostra (card piscando).
  function temAcao(acoes) {
    if (!acoes) return false;
    var conteudo = acoes.querySelector('.crp-action-content') || acoes;
    var seletores = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="reset"])',
      'select',
      'textarea',
      'button',
      '[role="button"]',
      '[contenteditable="true"]'
    ].join(',');
    var temControle = Array.prototype.some.call(
      conteudo.querySelectorAll(seletores),
      function (campo) {
        if (campo.matches(':disabled') || campo.readOnly) return false;
        if (campo.closest('[inert], [aria-disabled="true"]')) return false;
        if (estaVisivel(campo)) return true;
        if (campo.matches('input[type="file"]') && campo.labels) {
          return Array.prototype.some.call(campo.labels, estaVisivel);
        }
        return false;
      }
    );
    if (temControle) return true;
    // Anexo (já enviado ou com botão de upload) também conta como ação, para o
    // card não sumir logo após anexar o arquivo.
    return Array.prototype.some.call(
      conteudo.querySelectorAll('[data-fieldformat="FILE"],[data-fieldformat="FILE_VIEW"]'),
      function (campo) {
        // Só conta como ação o anexo EDITÁVEL (tem botão de upload). Listas
        // de documentos somente leitura não devem manter o card visível.
        var linha = campo.closest('tr') || campo.parentElement;
        var botao = linha && linha.querySelector('button[onclick*="fileUpload"]');
        if (!botao) return false;
        return estaVisivel(linha || campo);
      }
    );
  }

  function criarHero(grid) {
    var hero = document.createElement('section');
    hero.className = 'crp-approval-hero';
    hero.setAttribute('aria-label', 'Resumo da tarefa');
    hero.innerHTML = [
      '<p class="crp-approval-eyebrow">ANÁLISE DA SOLICITAÇÃO</p>',
      '<h2 class="crp-approval-heading">Confira as informações</h2>',
      '<p class="crp-approval-hint">Esta etapa não exige preenchimento. Revise os dados abaixo e conclua quando estiver tudo certo.</p>',
      '<dl class="crp-approval-facts"></dl>'
    ].join('');
    var coluna = grid.querySelector('.crp-context-column');
    if (!coluna) return null;
    coluna.insertBefore(hero, coluna.firstChild);
    return hero;
  }

  function aplicar() {
    var raiz = document.getElementById('containerRequest');
    if (!raiz) return;
    var grid = raiz.querySelector('.crp-work-grid');
    var coluna = raiz.querySelector('.crp-context-column');
    var acoes = raiz.querySelector('.crp-actions');
    var resumo = raiz.querySelector('#crp-summary');
    if (!grid || !coluna || !resumo) { remover(raiz); return; }

    // Layout do protótipo: fora da aba Geral o card de ações fica escondido
    // de propósito; mantém a decisão tomada na aba Geral.
    if (raiz.classList.contains('crp-proto') && !raiz.classList.contains('crp-aba-geral')) return;

    var semAcao = !temAcao(acoes);
    if (!semAcao) { remover(raiz); return; }

    // Aplica só quando muda (sem re-adicionar a cada ciclo -> sem piscar).
    if (!raiz.classList.contains(CLASSE)) raiz.classList.add(CLASSE);
    // Card "Confira as informações" desativado a pedido: o resumo já ocupa o
    // lugar do card de ações. Remove o hero se tiver sobrado de outro ciclo.
    var heroAntigo = raiz.querySelector('.crp-approval-hero');
    if (heroAntigo) heroAntigo.remove();
    if (resumo && !resumo.classList.contains('crp-approval-summary-visible')) {
      resumo.classList.add('crp-approval-summary-visible');
    }
    if (acoes && !acoes.classList.contains('crp-approval-hidden')) {
      acoes.classList.add('crp-approval-hidden');
    }
  }

  var ultima = null;
  setInterval(function () {
    if (!document.body) return;
    var raiz = document.getElementById('containerRequest');
    if (!raiz) return;
    var assinatura = raiz.querySelector('.crp-action-content') ? raiz.querySelector('.crp-action-content').innerHTML : '';
    if (assinatura === ultima && raiz.classList.contains(CLASSE) === (assinatura, true)) { /* noop */ }
    ultima = assinatura;
    aplicar();
  }, 700);
  setTimeout(aplicar, 1200);
})();

//*
	//* ZEEV — Extrair dados da NFSe XML + validar tipos de arquivo
	//* Escopo: Esta tarefa
	//

function preencherCampo(identificador, valor) {
  const campo = document.querySelector(`[data-name='${identificador}']`);
  if (!campo || !valor) return;
  campo.value = valor;
  campo.dispatchEvent(new Event('change', { bubbles: true }));
  campo.dispatchEvent(new Event('input',  { bubbles: true }));
}

function extrairDadosNFSe(xmlText) {
  const cleanXml = xmlText.replace(/ xmlns="[^"]*"/g, '').replace(/ xmlns:[^=]+="[^"]*"/g, '');
  const xml = new DOMParser().parseFromString(cleanXml, 'text/xml');

  const emit   = xml.getElementsByTagName('emit')[0];
  const cnpj   = emit?.getElementsByTagName('CNPJ')[0]?.textContent?.trim() || '';
  const vLiq   = xml.getElementsByTagName('vLiq')[0]?.textContent?.trim() || '';
  const numero = xml.getElementsByTagName('nNFSe')[0]?.textContent?.trim() || '';

  const vLiqFormatado = vLiq
    ? parseFloat(vLiq).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '';

  preencherCampo('profissionalCNPJ',      cnpj);
  preencherCampo('pagamentoValorLiquido', vLiqFormatado);
  preencherCampo('nfNumero',             numero);
}

function buscarXMLNF() {
  const aHref = document.getElementById('td1docNFXML')?.querySelector('a')?.href;
  if (!aHref) return;

  fetch(aHref, { credentials: 'include' })
    .then(r => r.text())
    .then(html => {
      const downloadPath = html.match(/\/document\/download\/[^\s"']+/i)?.[0];
      if (!downloadPath) return;
      return fetch('https://crptech.zeev.it' + downloadPath, { credentials: 'include' });
    })
    .then(r => r?.text())
    .then(xml => { if (xml) extrairDadosNFSe(xml); })
    .catch(e => console.error('[NF] Erro:', e));
}

function monitorarArquivo(idCampo, extensao, callback) {
  const input = document.getElementById('inp' + idCampo);
  if (!input) return;

  new MutationObserver(() => {
    if (!input.value) return;
    const nome = document.getElementById('td1' + idCampo)
      ?.querySelector('a')?.textContent?.trim()?.toLowerCase() || '';

    if (nome && !nome.endsWith('.' + extensao)) {
      input.value = '';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input',  { bubbles: true }));
      alert(`Arquivo inválido. Envie apenas arquivos .${extensao}`);
      return;
    }

    if (callback) callback();
  }).observe(input, { attributes: true, attributeFilter: ['value'] });
}

function inicializar() {
  if (document.getElementById('td1docNFXML')) {
    buscarXMLNF();
    monitorarArquivo('docNFXML', 'xml', buscarXMLNF);
  }

  monitorarArquivo('docNF', 'pdf', null);
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(inicializar, 500);
});
/* CRP | Autocomplete (typeahead): alinha a lista de sugestões ao campo.
   O plugin insere <ul class="typeahead dropdown-menu"> logo após o input,
   podendo ficar recortada por cards/tabelas (overflow). Posicionamos a
   lista com position:fixed em relação ao campo, acompanhando largura,
   rolagem e redimensionamento, sem alterar consultas/valores/eventos. */
(function () {
  'use strict';
  if (window.__crpSuggestAjuste) return;
  window.__crpSuggestAjuste = true;

  var GAP = 4;
  var SELETOR_SUGESTAO =
    "input[data-special-type='suggest'],input[data-fieldformat='SUGGEST2']";
  var PLACEHOLDER = 'Digite pelo menos 3 letras para buscar';

  // Campos de sugestão: sinaliza no placeholder que é uma seleção e exige
  // ao menos 3 letras para disparar a busca.
  function prepararCampo(campo) {
    if (!campo || campo.disabled || campo.readOnly) return;
    var atual = campo.getAttribute('placeholder') || '';
    if (!/3 letras/i.test(atual)) {
      campo.setAttribute('placeholder', PLACEHOLDER);
    }
    var $ = window.jQuery;
    if ($) {
      var ta = $(campo).data('typeahead');
      if (ta && ta.options && ta.options.minLength !== 3) {
        ta.options.minLength = 3;
      }
    }
  }

  function prepararTodos() {
    Array.prototype.forEach.call(
      document.querySelectorAll(SELETOR_SUGESTAO),
      prepararCampo
    );
  }

  function listaDoCampo(campo) {
    var prox = campo.nextElementSibling;
    if (prox && /(^|\s)typeahead(\s|$)/.test(prox.className) &&
        /(^|\s)dropdown-menu(\s|$)/.test(prox.className)) {
      return prox;
    }
    return null;
  }

  function posicionar(campo) {
    var lista = listaDoCampo(campo);
    if (!lista) return;
    var visivel = getComputedStyle(lista).display !== 'none'; /* fixed => offsetParent e null */
    if (!visivel) {
      lista.style.removeProperty('top');
      lista.style.removeProperty('left');
      lista.style.removeProperty('min-width');
      lista.style.removeProperty('max-width');
      return;
    }
    var r = campo.getBoundingClientRect();
    var larguraCampo = Math.round(r.width);
    var largura = Math.min(Math.max(larguraCampo, 240), window.innerWidth - 16);
    var larguraLista = lista.getBoundingClientRect().width || 0;
    largura = Math.max(largura, Math.min(larguraLista, window.innerWidth - 16));
    var topo = r.bottom + GAP;
    var altura = lista.getBoundingClientRect().height || 0;
    if (topo + altura > window.innerHeight - 8 && r.top - GAP - altura > 8) {
      topo = r.top - GAP - altura;
    }
    var esq = r.left;
    if (esq + largura > window.innerWidth - 8) {
      esq = Math.max(8, window.innerWidth - 8 - largura);
    }
    lista.style.position = 'fixed';
    lista.style.top = Math.round(topo) + 'px';
    lista.style.left = Math.round(esq) + 'px';
    lista.style.minWidth = largura + 'px';
    lista.style.maxWidth = largura + 'px';
  }

  var campoAtivo = null;
  var raf = 0;
  function ciclo() {
    if (campoAtivo && document.body.contains(campoAtivo)) posicionar(campoAtivo);
    raf = requestAnimationFrame(ciclo);
  }

  document.addEventListener("focusin", function (e) {
    var campo = e.target;
    if (campo && campo.matches && campo.matches(
      "[data-special-type='suggest'],[data-fieldformat='SUGGEST2']")) {
      campoAtivo = campo;
      prepararCampo(campo);
    }
  }, true);
  document.addEventListener("scroll", function () {
    if (campoAtivo) posicionar(campoAtivo);
  }, true);
  window.addEventListener("resize", function () {
    if (campoAtivo) posicionar(campoAtivo);
  });

  // Aplica nos campos já existentes e nos que o Zeev inserir depois.
  var agendado = false;
  function agendarPreparo() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      prepararTodos();
    });
  }

  prepararTodos();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepararTodos);
  }
  new MutationObserver(agendarPreparo).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  ciclo();
})();

/* CRP | Nome do anexo na tabela multivalorada.
   Mostra apenas as 10 primeiras letras seguidas de "..." e mantem o nome
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
      var curto = completo.length > 10 ? completo.slice(0, 10) + '...' : completo;
      if (a.textContent !== curto) a.textContent = curto;
    });
  }
  function iniciar() { rotulos();
    var observer = new MutationObserver(function () { rotulos(); });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();

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
  // Cabeçalho recolhível do grupo: título + "N campos" + seta. Os elementos
  // são criados uma única vez; depois só o texto e os atributos mudam quando
  // necessário (evita loop com o MutationObserver).
  function grupoRecolhivel(g, tabela, vis) {
    var head = tabela.querySelector(':scope > tbody > tr.group');
    var td = head && (head.querySelector(':scope > td.group') || head.firstElementChild);
    if (!td) return;
    // Nem sempre a célula do título tem a classe "group": marca com uma
    // classe própria para o CSS do cabeçalho.
    if (!head.classList.contains('crp-grupo-linha')) head.classList.add('crp-grupo-linha');
    if (!td.classList.contains('crp-grupo-head')) td.classList.add('crp-grupo-head');

    if (td.getAttribute('data-crp-grupo') !== '1') {
      td.setAttribute('data-crp-grupo', '1');
      var qtd = document.createElement('span');
      qtd.className = 'crp-grupo-qtd';
      var seta = document.createElement('span');
      seta.className = 'crp-grupo-seta';
      seta.setAttribute('aria-hidden', 'true');
      td.appendChild(qtd);
      td.appendChild(seta);
      td.setAttribute('role', 'button');
      td.tabIndex = 0;

      var alternar = function () {
        var recolher = !g.classList.contains('crp-recolhido');
        g.classList.toggle('crp-recolhido', recolher);
        td.setAttribute('aria-expanded', String(!recolher));
      };
      td.addEventListener('click', alternar);
      td.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); }
      });
    }

    var recolhido = g.classList.contains('crp-recolhido');
    var expandido = String(!recolhido);
    if (td.getAttribute('aria-expanded') !== expandido) td.setAttribute('aria-expanded', expandido);

    // Conta só com o grupo aberto e visível (recolhido, as linhas ficam ocultas
    // pelo CSS e a contagem zeraria); fora disso reaproveita a última contagem.
    if (vis && !recolhido) {
      var n = 0;
      Array.prototype.forEach.call(tabela.querySelectorAll(':scope > tbody > tr'), function (tr) {
        if (tr.classList.contains('group')) return;
        if (getComputedStyle(tr).display !== 'none') n++;
      });
      if (g.getAttribute('data-crp-qtd') !== String(n)) g.setAttribute('data-crp-qtd', String(n));
    }
    var total = Number(g.getAttribute('data-crp-qtd') || 0);
    var texto = total === 1 ? '1 campo' : total + ' campos';
    var alvo = td.querySelector(':scope > .crp-grupo-qtd');
    if (alvo && alvo.textContent !== texto) alvo.textContent = texto;
  }
  function aplicar() {
    var resumo = document.getElementById('crp-summary'); if (!resumo) return;
    var vis = getComputedStyle(resumo).display !== 'none';
    var grupos = resumo.querySelectorAll('.crp-readonly-group');
    Array.prototype.forEach.call(grupos, function (g) {
      // O grupo pode ser a própria table.form ou uma tabela externa que a contém.
      var tabela = g.matches('table.form') ? g : g.querySelector('table.form'); if (!tabela) return;
      var lc = tabela.querySelectorAll("tbody > tr");
      Array.prototype.forEach.call(lc, function (tr) {
        if (tr.classList.contains("group")) return;
        var ifr = tr.querySelector('iframe[xname="inpfluxoOrigem"]');
        if (!ifr) return;
        if (iframeOrigemVazio(ifr)) { if (tr.style.display !== "none") tr.style.display = "none"; }
        else if (tr.style.display === "none") tr.style.display = "";
      });
      // Recolhido, as linhas ficam ocultas pelo CSS: não recalcular "vazio".
      if (vis && !g.classList.contains("crp-recolhido")) { var linhas = tabela.querySelectorAll("tbody > tr"); var tem=false;
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
      grupoRecolhivel(g, tabela, vis);
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
      // "ocultaNativo": o Zeev ocultou a tabela. Nao considerar o display:none
      // causado pela NOSSA propria classe crp-mult-empty (senao a tabela nunca
      // volta a aparecer quando recebe registros depois de ter ficado vazia).
      var ocultaNativo = !t.classList.contains("crp-mult-empty") && getComputedStyle(t).display === "none";
      var vazio = !edicao && (ocultaNativo || n === 0);
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
})();/* CRP | Selects com lista de opções no padrão do design.
   Substitui o menu nativo do <select> por uma lista flutuante parecida com
   a do typeahead. O <select> original continua no DOM (valor, validação e
   eventos mudam como antes); apenas a lista é desenhada por nós. */
(function () {
  'use strict';
  if (window.__crpSelectEstilizado) return;
  window.__crpSelectEstilizado = true;

  var aberto = null; /* { select, menu, ativo, itens } */
  var MAX_LARGURA = 520;

  function elegivel(sel) {
    return !!sel && sel.tagName === 'SELECT' && !sel.multiple && !sel.disabled &&
      sel.options.length > 0 && !!sel.closest('#containerRequest');
  }

  function fechar() {
    if (!aberto) return;
    aberto.menu.remove();
    aberto.select.classList.remove('crp-select-aberto');
    aberto.select.removeAttribute('aria-expanded');
    aberto = null;
  }

  function posicionar() {
    if (!aberto) return;
    var sel = aberto.select;
    var menu = aberto.menu;
    var r = sel.getBoundingClientRect();
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var largura = Math.min(Math.max(Math.round(r.width), 260), MAX_LARGURA, vw - 16);
    menu.style.width = largura + 'px';
    var alt = menu.getBoundingClientRect().height || 0;
    var abaixo = r.bottom + 4;
    var acima = r.top - 4 - alt;
    var topo = abaixo;
    if (abaixo + alt > vh - 8 && acima > 8) topo = acima;
    var esq = r.left;
    if (esq + largura > vw - 8) esq = Math.max(8, vw - 8 - largura);
    menu.style.top = Math.round(topo) + 'px';
    menu.style.left = Math.round(esq) + 'px';
  }

  function marcarAtivo(indice) {
    if (!aberto) return;
    var itens = aberto.itens;
    var i = Math.max(0, Math.min(indice, itens.length - 1));
    aberto.ativo = i;
    itens.forEach(function (item, n) {
      item.classList.toggle('ativo', n === i);
    });
    var alvo = itens[i];
    if (alvo) {
      var topoItem = alvo.offsetTop;
      var baseItem = topoItem + alvo.offsetHeight;
      if (topoItem < aberto.menu.scrollTop) {
        aberto.menu.scrollTop = topoItem;
      } else if (baseItem > aberto.menu.scrollTop + aberto.menu.clientHeight) {
        aberto.menu.scrollTop = baseItem - aberto.menu.clientHeight;
      }
    }
  }

  function escolher(indice) {
    if (!aberto) return;
    var sel = aberto.select;
    var opt = sel.options[indice];
    if (!opt || opt.disabled) return;
    if (sel.value !== opt.value) {
      sel.value = opt.value;
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    var alvo = sel;
    fechar();
    alvo.focus();
  }

  function abrir(sel) {
    fechar();
    var menu = document.createElement('div');
    menu.className = 'crp-select-menu';
    menu.setAttribute('role', 'listbox');

    var itens = [];
    Array.prototype.forEach.call(sel.options, function (opt, i) {
      var item = document.createElement('div');
      item.className = 'crp-select-opcao' +
        (i === sel.selectedIndex ? ' selecionada' : '') +
        (opt.disabled ? ' desabilitada' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', i === sel.selectedIndex ? 'true' : 'false');
      item.textContent = opt.textContent;
      item.addEventListener('mousedown', function (e) { e.preventDefault(); });
      item.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        escolher(i);
      });
      menu.appendChild(item);
      itens.push(item);
    });

    document.body.appendChild(menu);
    sel.classList.add('crp-select-aberto');
    sel.setAttribute('aria-expanded', 'true');
    aberto = { select: sel, menu: menu, ativo: sel.selectedIndex, itens: itens };
    posicionar();
    marcarAtivo(sel.selectedIndex);
  }

  function alternar(sel) {
    if (aberto && aberto.select === sel) {
      fechar();
    } else {
      abrir(sel);
    }
  }

  /* Impede o menu nativo e abre o nosso. */
  document.addEventListener('mousedown', function (e) {
    var sel = e.target.closest && e.target.closest('select');
    if (elegivel(sel)) {
      e.preventDefault();
      e.stopPropagation();
      sel.focus();
      alternar(sel);
      return;
    }
    if (aberto && !aberto.menu.contains(e.target)) fechar();
  }, true);

  /* Teclado: abre, navega e seleciona na lista customizada. */
  document.addEventListener('keydown', function (e) {
    var sel = e.target;
    if (!elegivel(sel)) return;

    if (aberto && aberto.select === sel) {
      if (e.key === 'Escape') { e.preventDefault(); fechar(); sel.focus(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); marcarAtivo(aberto.ativo + 1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); marcarAtivo(aberto.ativo - 1); return; }
      if (e.key === 'Tab') { fechar(); return; }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        escolher(aberto.ativo);
        return;
      }
      return;
    }

    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      abrir(sel);
    }
  }, true);

  document.addEventListener('focusout', function (e) {
    if (aberto && e.target === aberto.select) {
      /* mantém aberto enquanto o foco estiver no próprio select */
      setTimeout(function () {
        if (aberto && document.activeElement !== aberto.select) fechar();
      }, 0);
    }
  }, true);

  window.addEventListener('scroll', function () { if (aberto) posicionar(); }, true);
  window.addEventListener('resize', function () { if (aberto) posicionar(); });
})();
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
/* CRP | Janela "Enviar arquivos" (/files/upload) no padrão do layout.
   O modal roda num iframe próprio (mesma origem), que não carrega o nosso
   CSS. Aqui injetamos um <style> no contentDocument dele. */
(function () {
  'use strict';
  if (window.__crpUploadEstilo) return;
  window.__crpUploadEstilo = true;

  var CSS = [
    'html,body{font-family:Roboto,"Segoe UI",Arial,sans-serif !important;color:#22304F !important;background:#FFFFFF !important;}',
    'body{padding:6px 2px !important;}',
    'h1,h2,h3,h4,h5{color:#1F3F8E !important;font-weight:700 !important;}',
    'a{color:#1F3F8E !important;}',
    '.text-muted,small,.help-block,.form-text{color:#5B6B8C !important;}',
    'label,.control-label{color:#5B6B8C !important;font-weight:500 !important;font-size:12px !important;}',
    '.btn{border-radius:10px !important;font-weight:600 !important;box-shadow:none !important;min-height:40px;padding:9px 18px !important;font-size:14px !important;}',
    '.btn-primary,.btn-primary.start{background:#1F3F8E !important;border:1px solid #1F3F8E !important;color:#FFFFFF !important;}',
    '.btn-primary:hover,.btn-primary:focus,.btn-primary.start:hover{background:#18326F !important;border-color:#18326F !important;color:#FFFFFF !important;}',
    '.btn-secondary,.btn-default,.btn-link{background:#FFFFFF !important;border:1px solid #C7D4EA !important;color:#1F3F8E !important;}',
    '.btn-secondary:hover,.btn-default:hover,.btn-link:hover{background:#E4ECFB !important;border-color:#1F3F8E !important;color:#1F3F8E !important;}',
    'input[type="text"],input[type="email"],input[type="number"],input[type="password"],textarea,select,#inpDsDocType,#inpDsResume{box-sizing:border-box !important;width:100% !important;min-height:44px;padding:10px 14px !important;border:1px solid #E3E8F3 !important;border-radius:10px !important;background:#FFFFFF !important;color:#22304F !important;font-size:14px !important;box-shadow:none !important;}',
    'textarea,#inpDsResume{min-height:80px !important;line-height:1.5 !important;}',
    'input[type="text"]:focus,textarea:focus,select:focus,#inpDsDocType:focus{border-color:#1F3F8E !important;outline:3px solid rgba(31,63,142,.15) !important;outline-offset:0 !important;}',
    'input[type="checkbox"]{width:18px;height:18px;vertical-align:middle;}',
    '.fileupload-buttonbar,#fileupload,.fileupload-process{border:1px dashed #C9D3E8 !important;border-radius:12px !important;background:#F5F7FC !important;padding:16px !important;}',
    '.fileupload-buttonbar .btn{margin:0 6px 6px 0;}',
    '.template-upload,.template-download{border:1px solid #E3E8F3 !important;border-radius:10px !important;background:#FFFFFF !important;margin-top:8px !important;padding:8px !important;}',
    '.template-upload .name,.template-download .name,.template-upload .size,.template-download .size{color:#1F3F8E !important;font-weight:600 !important;}',
    '.progress{height:8px !important;border-radius:999px !important;background:#E4ECFB !important;}',
    '.progress-bar{background:#1F3F8E !important;}',
    '.alert{border-radius:12px !important;}'
  ].join('');

  function injetar(doc) {
    if (!doc || !doc.head || doc.getElementById('crp-upload-style')) return;
    var st = doc.createElement('style');
    st.id = 'crp-upload-style';
    st.textContent = CSS;
    doc.head.appendChild(st);
  }

  function varrer() {
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function (ifr) {
      try {
        var src = ifr.getAttribute('src') || '';
        if (src.indexOf('/files/upload') < 0) return;
        var doc = ifr.contentDocument;
        if (!doc) return;
        injetar(doc);
        if (!ifr.__crpUploadBound) {
          ifr.__crpUploadBound = true;
          ifr.addEventListener('load', function () { injetar(ifr.contentDocument); });
        }
      } catch (e) { /* origem diferente: ignora */ }
    });
  }

  var raf = 0;
  function agendar() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; varrer(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', varrer);
  } else {
    varrer();
  }
  new MutationObserver(agendar).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src']
  });
})();
