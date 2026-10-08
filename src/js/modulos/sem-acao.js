
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
    if (elemento.closest('[hidden], .d-none, .hide')) return false;
    return getComputedStyle(elemento).display !== 'none' && elemento.getClientRects().length > 0;
  }

  function remover(container) {
    if (!container) return;
    container.classList.remove(CLASSE);
    var hero = container.querySelector('.crp-approval-hero');
    if (hero) hero.remove();
    var resumo = container.querySelector('#crp-summary');
    if (resumo) resumo.classList.remove('crp-approval-summary-visible');
  }

  function temAcao(acoes) {
    if (!acoes) return false;
    var conteudo = acoes.querySelector('.crp-action-content') || acoes;
    var temControle = Array.prototype.some.call(
      conteudo.querySelectorAll('input:not([type=hidden]),select,textarea,button,a,img'),
      estaVisivel
    );
    if (temControle) return true;
    // Tabela multivalorada com linhas tambem conta como acao/conteudo.
    return Array.prototype.some.call(
      conteudo.querySelectorAll('table[mult="S"]'),
      function (t) { return estaVisivel(t) && t.querySelectorAll('tbody tr:not(.header)').length > 0; }
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

    var semAcao = !temAcao(acoes);
    if (!semAcao) { remover(raiz); return; }

    raiz.classList.add(CLASSE);
    resumo.classList.add('crp-approval-summary-visible');
    if (acoes) acoes.classList.add('crp-approval-hidden');
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
