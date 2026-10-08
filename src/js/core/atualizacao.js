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
        s.left.appendChild(instructionsCard);
      } else if (
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
