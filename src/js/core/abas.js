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

