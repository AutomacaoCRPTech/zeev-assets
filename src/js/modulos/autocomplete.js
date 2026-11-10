/* CRP | Autocomplete (typeahead): alinha a lista de sugestões ao campo.
   O plugin insere <ul class="typeahead dropdown-menu"> logo após o input,
   podendo ficar recortada por cards/tabelas (overflow). Posicionamos a
   lista com position:fixed em relação ao campo, acompanhando largura,
   rolagem e redimensionamento, sem alterar consultas/valores/eventos. */
(function () {
  'use strict';
  if (window.__crpSuggestAjuste) return;
  window.__crpSuggestAjuste = true;

  var GAP = 4;
  var SELETOR_SUGESTAO =
    "input[data-special-type='suggest'],input[data-fieldformat='SUGGEST2']";
  var PLACEHOLDER = 'Digite pelo menos 3 letras para buscar';

  // Campos de sugestão: sinaliza no placeholder que é uma seleção e exige
  // ao menos 3 letras para disparar a busca.
  function prepararCampo(campo) {
    if (!campo || campo.disabled || campo.readOnly) return;
    var atual = campo.getAttribute('placeholder') || '';
    if (!/3 letras/i.test(atual)) {
      campo.setAttribute('placeholder', PLACEHOLDER);
    }
    var $ = window.jQuery;
    if ($) {
      var ta = $(campo).data('typeahead');
      if (ta && ta.options && ta.options.minLength !== 3) {
        ta.options.minLength = 3;
      }
    }
  }

  function prepararTodos() {
    Array.prototype.forEach.call(
      document.querySelectorAll(SELETOR_SUGESTAO),
      prepararCampo
    );
  }

  function listaDoCampo(campo) {
    var prox = campo.nextElementSibling;
    if (prox && /(^|\s)typeahead(\s|$)/.test(prox.className) &&
        /(^|\s)dropdown-menu(\s|$)/.test(prox.className)) {
      return prox;
    }
    return null;
  }

  function posicionar(campo) {
    var lista = listaDoCampo(campo);
    if (!lista) return;
    var visivel = getComputedStyle(lista).display !== 'none'; /* fixed => offsetParent e null */
    if (!visivel) {
      lista.style.removeProperty('top');
      lista.style.removeProperty('left');
      lista.style.removeProperty('min-width');
      lista.style.removeProperty('max-width');
      return;
    }
    var r = campo.getBoundingClientRect();
    var larguraCampo = Math.round(r.width);
    var largura = Math.min(Math.max(larguraCampo, 240), window.innerWidth - 16);
    var larguraLista = lista.getBoundingClientRect().width || 0;
    largura = Math.max(largura, Math.min(larguraLista, window.innerWidth - 16));
    var topo = r.bottom + GAP;
    var altura = lista.getBoundingClientRect().height || 0;
    if (topo + altura > window.innerHeight - 8 && r.top - GAP - altura > 8) {
      topo = r.top - GAP - altura;
    }
    var esq = r.left;
    if (esq + largura > window.innerWidth - 8) {
      esq = Math.max(8, window.innerWidth - 8 - largura);
    }
    lista.style.position = 'fixed';
    lista.style.top = Math.round(topo) + 'px';
    lista.style.left = Math.round(esq) + 'px';
    lista.style.minWidth = largura + 'px';
    lista.style.maxWidth = largura + 'px';
  }

  var campoAtivo = null;
  var raf = 0;
  function ciclo() {
    if (campoAtivo && document.body.contains(campoAtivo)) posicionar(campoAtivo);
    raf = requestAnimationFrame(ciclo);
  }

  document.addEventListener("focusin", function (e) {
    var campo = e.target;
    if (campo && campo.matches && campo.matches(
      "[data-special-type='suggest'],[data-fieldformat='SUGGEST2']")) {
      campoAtivo = campo;
      prepararCampo(campo);
    }
  }, true);
  document.addEventListener("scroll", function () {
    if (campoAtivo) posicionar(campoAtivo);
  }, true);
  window.addEventListener("resize", function () {
    if (campoAtivo) posicionar(campoAtivo);
  });

  // Aplica nos campos já existentes e nos que o Zeev inserir depois.
  var agendado = false;
  function agendarPreparo() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      prepararTodos();
    });
  }

  prepararTodos();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepararTodos);
  }
  new MutationObserver(agendarPreparo).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  ciclo();
})();

