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

