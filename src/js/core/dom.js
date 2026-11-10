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

  // Regra compartilhada entre os módulos que decidem esconder o card de ações:
  // tabela multivalorada visível, com registros, conta como conteúdo do card.
  window.crpTemTabelaConteudo = function (conteudo, estaVisivelFn) {
    if (!conteudo || typeof estaVisivelFn !== 'function') return false;
    return Array.prototype.some.call(
      conteudo.querySelectorAll('table[mult="S"]'),
      function (t) {
        if (!estaVisivelFn(t)) return false;
        if (t.classList.contains('crp-mult-empty')) return false;
        return Array.prototype.some.call(t.querySelectorAll('tbody > tr'), function (tr) {
          if (tr.classList.contains('header') || tr.classList.contains('template') || tr.hidden) return false;
          if (getComputedStyle(tr).display === 'none') return false;
          return (tr.textContent || '').trim() !== '';
        });
      }
    );
  };

