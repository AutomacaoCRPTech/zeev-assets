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

  // Anexos obrigatórios: o bloco permanece na aba Anexos (origem do Zeev).
  // A pendência é sinalizada por um aviso no card de informações.
