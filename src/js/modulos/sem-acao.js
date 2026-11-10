
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
