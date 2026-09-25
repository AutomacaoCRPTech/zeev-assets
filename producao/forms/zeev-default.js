(function () {
  'use strict';

  if (window.CRPForm && window.CRPForm.baseVersion === '2.0.0') return;

  var state;
  var observer;
  var timer;

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

    root.classList.add('crp-form', 'crp-workspace');
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

    addTab(summary, 'Resumo');

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
        if (campo.getAttribute('data-required') === 'true' && !enviado) {
          obrigatorioPendente = true;
        }
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
  }

  function atualizarVisibilidadeAcoes(s) {
    var card = s.actions;
    var conteudo = s.content;

    // Reabre para verificar os campos após mudanças condicionais.
    card.hidden = false;
    card.style.removeProperty('display');

    function estaVisivel(elemento) {
      var atual = elemento;

      while (atual && atual.nodeType === 1) {
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

      return elemento.getClientRects().length > 0;
    }

        var seletores = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="reset"])',
      'select',
      'textarea',
      'button',
      '[role="button"]',
      '[contenteditable="true"]',
      '[xtype]',                     // <- representação de leitura (modo visualização)
      'table[mult="S"]'              // <- tabela multivalorada (mesmo só leitura)
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

    card.hidden = !temAcao;

    if (!temAcao) {
      card.style.setProperty('display', 'none', 'important');
    }
  }

  function atualizarAnexosObrigatorios(s) {
    var bloco = s.root.querySelector('#mandatoryAnnex');
    var card = document.getElementById('crp-required-files-card');
    var painel = s.root.querySelector('#containerFiles');

    if (!bloco || !sameForm(bloco, s.info)) return;

    // O card só aparece quando há documento obrigatório a anexar.
    if (!bloco.querySelector('[cod][onclick*="capture.upload"]')) {
      if (card && sameForm(card, s.info)) card.hidden = true;
      return;
    }

    // O Zeev desenha o bloco no carregamento da página. Espera o desenho
    // terminar para não retirar o bloco de dentro do contêiner original.
    if (!s.root.querySelector('#customizedUpload')) return;

    // Título da aba Anexos: lido antes de qualquer inserção.
    var titulo = painel && painel.querySelector('h5.title-container-files');

    if (!card) {
      card = el('section', 'crp-card crp-required-files-card');
      card.id = 'crp-required-files-card';

      card.appendChild(
        el('h2', 'crp-card-title', 'Anexos obrigatórios')
      );

      card.appendChild(
        el(
          'p',
          'crp-required-hint',
          'Anexe os documentos abaixo para concluir esta etapa.'
        )
      );
    }

    card.hidden = false;

    // Fica abaixo de Informações relevantes e acima das ações.
    if (
      card.parentNode !== s.right ||
      card.nextElementSibling !== s.actions
    ) {
      s.right.insertBefore(card, s.actions);
    }

    // O Zeev procura o contêiner original ao adicionar ou remover
    // arquivos. Deixa um marcador vazio no lugar do bloco que saiu de lá.
    // O marcador não pode ficar oculto: ao adicionar ou remover arquivo o
    // Zeev move #customizedUpload para dentro dele, e esconder o marcador
    // apagaria os botões de anexo obrigatório da tela.
    if (painel) {
      var ancora = painel.querySelector('#crp-annex-anchor');

      if (!ancora) {
        ancora = el('div', 'box-header crp-annex-anchor');
        ancora.id = 'crp-annex-anchor';
        painel.insertBefore(ancora, bloco);
      }

      ancora.removeAttribute('hidden');
    }

    if (titulo) {
      titulo.hidden = true;
      titulo.classList.add('crp-required-files-title');
    }

    bloco.classList.add('crp-required-files');

    if (bloco.parentNode !== card) card.appendChild(bloco);

    // Ao adicionar ou remover um arquivo o Zeev devolve a tabela de
    // upload para o marcador e tira ela do card. Traz de volta para o
    // bloco, que continua dentro do card.
    if (bloco) {
      var upload = document.getElementById('customizedUpload');

      if (upload && !bloco.contains(upload)) bloco.appendChild(upload);
    }

    card.setAttribute('data-crp-anexos', statusAnexos(s.root));
  }

  function update() {
    if (!setup()) return;

    var s = state;

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
      if (
        instructionsCard.parentNode !== s.right ||
        !(
          s.actions.compareDocumentPosition(instructionsCard) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )
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

      if (checklist.parentNode !== s.right) {
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

    atualizarAnexosObrigatorios(s);
    render();
    classificarStatusHistorico();
    ajustarNumeroProcesso();
    ajustarMensagens();
    ajustarArquivosCampos();
    atualizarVisibilidadeAcoes(s);
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
  }

  // Classifica o status de cada evento do Histórico para colorir o selo
  // (verde para concluído, âmbar para revisão e neutro para os demais),
  // sem alterar textos nem a ordem dos registros.
  function classificarStatusHistorico() {
    var escopo = document.getElementById('containerHistoryRender');

    if (!escopo) return;

    escopo.querySelectorAll('.badge').forEach(function (selo) {
      var texto = (selo.textContent || '').toLowerCase();
      var status = 'neutro';

      if (texto.indexOf('conclu') >= 0) status = 'concluido';
      else if (texto.indexOf('revis') >= 0) status = 'revisao';

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

    return true;
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

/* Identificação dos arquivos de propostas. */
(function () {
  'use strict';

  var timer;

  function atualizarPropostas() {
    var root = document.getElementById('containerRequest');
    if (!root) return;

    root.querySelectorAll('table[mult="S"]').forEach(function (table) {
      var numero = 0;

      Array.prototype.forEach.call(table.rows, function (row) {
        if (row.closest('table') !== table) return;
        if (row.classList.contains('header')) return;

        var cell = Array.prototype.find.call(
          row.cells,
          function (td) {
            return td.getAttribute('column-name') === 'colproposta';
          }
        );

        if (!cell) return;

        numero++;

        var nome = 'Proposta ' + numero;

        cell.querySelectorAll(
          '.containerFormFileLink a[href*="/document/preview/"]'
        ).forEach(function (link) {
          if (link.textContent.trim() !== nome) {
            link.textContent = nome;
          }

          if (!link.classList.contains('crp-proposal-link')) {
            link.classList.add('crp-proposal-link');
          }

          var title = 'Abrir ' + nome.toLowerCase();

          if (link.getAttribute('title') !== title) {
            link.setAttribute('title', title);
          }

          var group = link.parentElement;

          if (!group.classList.contains('crp-proposal-file')) {
            group.classList.add('crp-proposal-file');
          }

          // Usa a exclusão original do arquivo, não a da linha.
          var remove = group.querySelector(
            'a[onclick*="fileUpload.delete"]'
          );

          if (remove) {
            if (!remove.classList.contains('crp-proposal-delete')) {
              remove.classList.add('crp-proposal-delete');
            }

            var label = 'Excluir arquivo da ' + nome.toLowerCase();

            if (remove.getAttribute('aria-label') !== label) {
              remove.setAttribute('aria-label', label);
              remove.setAttribute('title', label);
            }
          }
        });
      });
    });
  }

  function iniciar() {
    atualizarPropostas();

    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(atualizarPropostas, 80);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();