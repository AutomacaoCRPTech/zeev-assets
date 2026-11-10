/* CRP | Selects com lista de opções no padrão do design.
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
