/* CRP | Resumo: icones de grupo, grupos vazios e campos de largura total. */
(function () {
  'use strict';
  if (window.__crpResumoVisual) return;
  window.__crpResumoVisual = true;
  var RE_FULL = /(nome|e-?mail|descri|justific|observa|endere|motivo|mensagem|condi|detalh|texto)/i;
  function iframeOrigemVazio(ifr) {
    if (!ifr) return false;
    try {
      var d = ifr.contentDocument;
      var t = d && d.body ? (d.body.innerText || d.body.textContent || "").trim() : "";
      return t === "";
    } catch (e) { return false; }
  }
  // Cabeçalho recolhível do grupo: título + "N campos" + seta. Os elementos
  // são criados uma única vez; depois só o texto e os atributos mudam quando
  // necessário (evita loop com o MutationObserver).
  function grupoRecolhivel(g, tabela, vis) {
    var head = tabela.querySelector(':scope > tbody > tr.group');
    var td = head && (head.querySelector(':scope > td.group') || head.firstElementChild);
    if (!td) return;
    // Nem sempre a célula do título tem a classe "group": marca com uma
    // classe própria para o CSS do cabeçalho.
    if (!head.classList.contains('crp-grupo-linha')) head.classList.add('crp-grupo-linha');
    if (!td.classList.contains('crp-grupo-head')) td.classList.add('crp-grupo-head');

    if (td.getAttribute('data-crp-grupo') !== '1') {
      td.setAttribute('data-crp-grupo', '1');
      var qtd = document.createElement('span');
      qtd.className = 'crp-grupo-qtd';
      var seta = document.createElement('span');
      seta.className = 'crp-grupo-seta';
      seta.setAttribute('aria-hidden', 'true');
      td.appendChild(qtd);
      td.appendChild(seta);
      td.setAttribute('role', 'button');
      td.tabIndex = 0;

      var alternar = function () {
        var recolher = !g.classList.contains('crp-recolhido');
        g.classList.toggle('crp-recolhido', recolher);
        td.setAttribute('aria-expanded', String(!recolher));
      };
      td.addEventListener('click', alternar);
      td.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); }
      });
    }

    var recolhido = g.classList.contains('crp-recolhido');
    var expandido = String(!recolhido);
    if (td.getAttribute('aria-expanded') !== expandido) td.setAttribute('aria-expanded', expandido);

    // Conta só com o grupo aberto e visível (recolhido, as linhas ficam ocultas
    // pelo CSS e a contagem zeraria); fora disso reaproveita a última contagem.
    if (vis && !recolhido) {
      var n = 0;
      Array.prototype.forEach.call(tabela.querySelectorAll(':scope > tbody > tr'), function (tr) {
        if (tr.classList.contains('group')) return;
        if (getComputedStyle(tr).display !== 'none') n++;
      });
      if (g.getAttribute('data-crp-qtd') !== String(n)) g.setAttribute('data-crp-qtd', String(n));
    }
    var total = Number(g.getAttribute('data-crp-qtd') || 0);
    var texto = total === 1 ? '1 campo' : total + ' campos';
    var alvo = td.querySelector(':scope > .crp-grupo-qtd');
    if (alvo && alvo.textContent !== texto) alvo.textContent = texto;
  }
  function aplicar() {
    var resumo = document.getElementById('crp-summary'); if (!resumo) return;
    var vis = getComputedStyle(resumo).display !== 'none';
    var grupos = resumo.querySelectorAll('.crp-readonly-group');
    Array.prototype.forEach.call(grupos, function (g) {
      // O grupo pode ser a própria table.form ou uma tabela externa que a contém.
      var tabela = g.matches('table.form') ? g : g.querySelector('table.form'); if (!tabela) return;
      var lc = tabela.querySelectorAll("tbody > tr");
      Array.prototype.forEach.call(lc, function (tr) {
        if (tr.classList.contains("group")) return;
        var ifr = tr.querySelector('iframe[xname="inpfluxoOrigem"]');
        if (!ifr) return;
        if (iframeOrigemVazio(ifr)) { if (tr.style.display !== "none") tr.style.display = "none"; }
        else if (tr.style.display === "none") tr.style.display = "";
      });
      // Recolhido, as linhas ficam ocultas pelo CSS: não recalcular "vazio".
      if (vis && !g.classList.contains("crp-recolhido")) { var linhas = tabela.querySelectorAll("tbody > tr"); var tem=false;
        Array.prototype.forEach.call(linhas, function(tr){ if(tr.classList.contains("group"))return; if(getComputedStyle(tr).display!=="none") tem=true; });
        if (g.classList.contains("crp-empty") === tem) g.classList.toggle("crp-empty", !tem); }
      Array.prototype.forEach.call(lc, function (tr) {
        if (tr.classList.contains("group")) return;
        if (tr.querySelector(".containerFormFileLink") || tr.querySelector("textarea") || tr.querySelector('[xtype="TEXTAREA"]')) { if(!tr.classList.contains("crp-full")) tr.classList.add("crp-full"); return; }
        var c0 = tr.querySelector("td.col0"); var c1 = tr.querySelector("td.col1");
        var rot = c0 ? c0.textContent : ""; var val = c1 ? c1.textContent : "";
        var cheio = RE_FULL.test(rot) || (val && val.trim().length > 34);
        if (cheio && !tr.classList.contains("crp-full")) tr.classList.add("crp-full");
      });
      grupoRecolhivel(g, tabela, vis);
    });
    if (vis) {
      var arr = Array.prototype.slice.call(resumo.querySelectorAll(':scope > .crp-readonly-group')).filter(function (g) { return getComputedStyle(g).display !== 'none'; });
      var sozinho = (arr.length % 2 === 1);
      var alvo = sozinho ? arr[arr.length - 1] : null;
      Array.prototype.forEach.call(resumo.querySelectorAll(':scope > .crp-readonly-group'), function (g) {
        var deve = (g === alvo);
        if (g.classList.contains('crp-last-span') !== deve) g.classList.toggle('crp-last-span', deve);
      });
    }
  }
  var raf = 0; function agendar(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(aplicar); }
  function iniciar(){ aplicar();
    var card = document.getElementById('crp-info-card'); if(!card) return;
    var obs = new MutationObserver(agendar);
    obs.observe(card, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden','style','class'] });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();

