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
