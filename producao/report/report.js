/* CRP | Relatório de Detalhamento (audit-legacy) — redesign no padrão dos
   formulários CRP. Preserva o DOM, IDs, valores e integrações do Zeev;
   apenas reorganiza/apresenta (cards, abas, accordions, cabeçalho, timeline). */
(function () {
  'use strict';
  if (window.__crpReportRedesign) return;
  window.__crpReportRedesign = true;

  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';
  var ICONS = {
    geral: SVG + '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 13h6M9 17h6"/></svg>',
    mensagens: SVG + '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.6A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/></svg>',
    anexos: SVG + '<path d="M21.4 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
    historico: SVG + '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    info: SVG + '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>',
    user: SVG + '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    calendar: SVG + '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    hero: SVG + '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a3 3 0 0 0 3 3h6"/></svg>',
    filter: SVG + '<path d="M4 5h16l-6 7v5l-4 2v-7z"/></svg>'
  };

  var toArr = function (list) { return Array.prototype.slice.call(list || []); };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function icon(key, cls) {
    var s = el('span', cls);
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = ICONS[key] || '';
    return s;
  }

  /* Texto "DOM-aware": <br> e blocos viram quebra; nós filhos são unidos com
     espaço (evita "21/10/202600:00:01" e "email(63) 9999..."). */
  function txt(node) {
    if (!node) return '';
    var out = '';
    var block = /^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DIV|DL|DT|DD|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL)$/;
    (function walk(n) {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return;
      if (tag === 'BR') { out += '\n'; return; }
      var isBlock = block.test(tag);
      if (isBlock) out += '\n';
      toArr(n.childNodes).forEach(function (c, i) {
        if (i > 0) {
          var prev = n.childNodes[i - 1];
          if (!/\s$/.test(out) && !(c.nodeType === 3 && /^\s/.test(c.nodeValue || ''))) out += ' ';
          if (prev && prev.nodeType === 1 && c.nodeType === 1 && !/\s$/.test(out)) out += ' ';
        }
        walk(c);
      });
      if (isBlock) out += '\n';
    })(node);
    return out.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
  }

  function countRows(tableId) {
    var t = document.getElementById(tableId);
    if (!t) return 0;
    var n = 0;
    toArr(t.querySelectorAll('tbody > tr')).forEach(function (tr) {
      if (tr.querySelector('.alert')) return;
      if (tr.children.length === 1 && tr.firstElementChild.hasAttribute('colspan') && !tr.querySelector('a,img,strong')) return;
      n++;
    });
    return n;
  }

  function initials(name) {
    var parts = String(name || '').replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    // Regra única: primeira letra do primeiro + do último nome.
    var last = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    return (parts[0][0] + (last[0] || '')).toUpperCase();
  }

  function cardHeader(eyebrow, title, badge, iconKey) {
    var head = el('div', 'crp-card-head');
    head.appendChild(icon(iconKey || 'geral', 'crp-card-ic'));
    var texts = el('div', 'crp-card-head-text');
    texts.appendChild(el('span', 'crp-card-eyebrow', eyebrow));
    texts.appendChild(el('h3', 'crp-card-heading', title));
    head.appendChild(texts);
    if (badge) head.appendChild(el('span', 'crp-card-badge', badge));
    return head;
  }

  /* ---------- Cabeçalho ---------- */
  function relTituloProcesso(s) {
    var t = String(s || '').trim();
    var letters = t.replace(/[^A-Za-zÀ-Üà-ü]/g, '');
    if (!letters || letters !== letters.toUpperCase()) return t;
    var preps = { de: 1, da: 1, do: 1, das: 1, dos: 1, e: 1, em: 1, para: 1, com: 1, por: 1, a: 1, o: 1, os: 1, as: 1 };
    var siglas = { clt: 1, pj: 1, ti: 1, rh: 1, cpf: 1, cnpj: 1, id: 1, rg: 1, cnh: 1, cep: 1, uf: 1 };
    return t.toLowerCase().split(/\s+/).map(function (w, i) {
      if (!w) return w;
      if (siglas[w]) return w.toUpperCase();
      if (i > 0 && preps[w]) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }

  function relResumoAbertas(heading, abertas, atrasadas) {
    if (!heading) return;
    var box = heading.querySelector('.crp-rel-open-summary');
    if (!box) { box = el('span', 'crp-rel-open-summary'); heading.appendChild(box); }
    box.innerHTML = '';
    function add(n, cls, txt) {
      if (!n) return;
      var a = el('a', 'crp-rel-sum ' + cls, n + ' ' + txt);
      a.href = '#crp-rel-steps';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var alvo = document.getElementById('crp-rel-steps') || document.getElementById('PanelStep');
        if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      box.appendChild(a);
    }
    add(abertas, 'crp-rel-sum-open', 'em aberto');
    add(atrasadas, 'crp-rel-sum-late', atrasadas === 1 ? 'atrasada' : 'atrasadas');
    box.hidden = !abertas && !atrasadas;
  }

  function relHeaderMobile(title, h1, badge) {
    var text = title.querySelector('.crp-hero-text');
    var label = text && text.querySelector('.label');
    if (!label) return;
    var raw = (label.textContent || '').replace(/\s+/g, ' ').trim();
    if (!raw) return;
    var version = '';
    var m = raw.match(/\s+v\.?\s*(\d+(?:\.\d+)*)\s*$/i);
    if (m) { version = 'v.' + m[1]; raw = raw.slice(0, m.index).trim(); }
    var nome = relTituloProcesso(raw);
    label.textContent = nome;
    label.title = nome;
    title.classList.add('crp-mob-title');
    var num = badge ? badge.textContent.trim() : '';
    var meta = el('div', 'crp-mob-meta');
    meta.textContent = (num || '') + (num && version ? ' · ' : '') + (version || '');
    text.insertBefore(meta, label);
    var heading = text.querySelector('.crp-hero-heading');
    if (version && heading && !heading.querySelector('.crp-req-version')) {
      var v = el('span', 'crp-req-version', '· ' + version);
      var sum = heading.querySelector('.crp-rel-open-summary');
      if (sum) heading.insertBefore(v, sum); else heading.appendChild(v);
    }
    var row = title.querySelector('.crp-hero-row') || title;
    var side = title.querySelector('.crp-hero-side');
    var nav = side && side.querySelector('ul.nav');
    if (nav && !title.querySelector('.crp-mob-actions')) {
      var box = el('div', 'crp-mob-actions');
      var btn = el('button', 'crp-mob-more', '⋯');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Mais ações');
      btn.setAttribute('aria-haspopup', 'menu');
      btn.setAttribute('aria-expanded', 'false');
      var menu = el('div', 'crp-mob-menu');
      menu.setAttribute('role', 'menu');
      menu.hidden = true;
      menu.id = 'crp-mob-menu';
      btn.setAttribute('aria-controls', 'crp-mob-menu');
      toArr(nav.querySelectorAll('li > a')).forEach(function (a) {
        var rot = (a.textContent || '').replace(/\s+/g, ' ').trim();
        if (!/copiar\s+link|imprimir/i.test(rot)) return;
        var mi = a.cloneNode(true);
        mi.className = 'crp-mob-mi';
        mi.setAttribute('role', 'menuitem');
        mi.addEventListener('click', function () { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
        menu.appendChild(mi);
      });
      function open(v) {
        menu.hidden = !v;
        btn.setAttribute('aria-expanded', v ? 'true' : 'false');
        if (v) { var first = menu.querySelector('.crp-mob-mi'); if (first) first.focus(); }
      }
      btn.addEventListener('click', function (e) { e.stopPropagation(); open(menu.hidden); });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { open(false); btn.focus(); }
      });
      document.addEventListener('click', function (e) { if (!box.contains(e.target)) open(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); }
      });
      menu.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { open(false); btn.focus(); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var items = toArr(menu.querySelectorAll('.crp-mob-mi'));
          if (!items.length) return;
          var i = items.indexOf(document.activeElement);
          i = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
          items[i].focus();
        }
      });
      box.appendChild(btn);
      box.appendChild(menu);
      row.appendChild(box);
    }
  }

  function relIsMobile() {
    try { return window.matchMedia('(max-width: 768px)').matches; } catch (e) { return false; }
  }

  function initHeader() {
    var title = document.querySelector('.title');
    if (!title || title.getAttribute('data-crp-hero') === '1') return;
    title.setAttribute('data-crp-hero', '1');

    var h1 = title.querySelector('h1.huge') || document.querySelector('h1.huge');
    var badge = null;
    if (h1) {
      var m = (h1.textContent || '').match(/#\s*(\d+)/);
      if (m) {
        badge = el('span', 'crp-req-badge', '#' + m[1]);
        h1.setAttribute('data-original', h1.textContent);
        h1.textContent = (h1.textContent || '').replace(/#\s*\d+\s*/, '').trim();
      }
    }

    var heroIcon = icon('hero', 'crp-hero-icon');

    // Coluna esquerda = bloco (span*) que contém o título
    var left = null;
    if (h1 && title.contains(h1)) {
      left = h1.closest('[class*="span"]');
      if (!left || !title.contains(left)) left = h1.parentNode !== title ? h1.parentNode : null;
    }

    if (left) {
      var text = el('div', 'crp-hero-text');
      while (left.firstChild) text.appendChild(left.firstChild);
      left.classList.add('crp-hero-left');
      left.appendChild(heroIcon);
      left.appendChild(text);
      if (badge) {
        var heading = el('div', 'crp-hero-heading');
        h1.parentNode.insertBefore(heading, h1);
        heading.appendChild(h1);
        heading.appendChild(badge);
      }
      if (left.parentNode) {
        left.parentNode.classList.add('crp-hero-row');
        toArr(left.parentNode.children).forEach(function (c) {
          if (c !== left) c.classList.add('crp-hero-side');
        });
      }
    } else {
      title.insertBefore(heroIcon, title.firstChild);
      if (badge && h1) h1.parentNode.insertBefore(badge, h1.nextSibling);
    }
    relHeaderMobile(title, h1, badge);
  }

  /* ---------- Card: solicitante + data de abertura ---------- */
  function openingDate() {
    var t = document.getElementById('TableStep');
    if (!t) return null;
    var cols = stepColumns(t);
    var first = toArr(t.querySelectorAll('tbody > tr')).filter(function (tr) {
      return !isStepHead(tr) && txt(tr);
    })[0];
    var raw = first && first.children[cols.start] ? txt(first.children[cols.start]) : '';
    if (!raw) return null;
    var d = raw.match(/\d{2}\/\d{2}\/\d{4}/);
    var h = raw.match(/\d{2}:\d{2}(:\d{2})?/);
    return { date: d ? d[0] : raw.split(/\s+/)[0], time: h ? h[0] : '' };
  }

  function kvBox(iconNode, label, value, sub) {
    var box = el('div', 'crp-kv crp-kv-ic');
    box.appendChild(iconNode);
    var body = el('div', 'crp-kv-body');
    body.appendChild(el('span', 'crp-kv-label', label));
    body.appendChild(el('span', 'crp-kv-value' + (value ? '' : ' is-empty'), value || '—'));
    if (sub) body.appendChild(el('span', 'crp-kv-sub', sub));
    box.appendChild(body);
    return box;
  }

  function initRequesterCard() {
    if (document.querySelector('.crp-requester-card')) return;
    var req = document.getElementById('RequesterInfo');
    var opened = openingDate();
    if (!req && !opened) return;

    var card = el('div', 'crp-card crp-requester-card');
    card.appendChild(cardHeader('SOLICITAÇÃO', 'Solicitante e abertura', null, 'user'));
    var grid = el('div', 'crp-req-grid');

    if (req) {
      var strong = req.querySelector('strong');
      var name = txt(strong).replace(/\s*\([^)]*\)\s*$/, '');
      var mail = '';
      toArr(req.querySelectorAll('.small')).some(function (s) {
        var v = txt(s);
        if (v.indexOf('@') > -1) { mail = v; return true; }
        return false;
      });
      if (!mail) {
        var pm = txt(strong).match(/\(([^)]+@[^)]+)\)/) || txt(req).match(/[\w.+-]+@[\w.-]+\.\w+/);
        if (pm) mail = (pm[1] || pm[0]).toLowerCase();
      }
      if (name) {
        var av = el('span', 'crp-kv-avatar', initials(name));
        av.setAttribute('aria-hidden', 'true');
        grid.appendChild(kvBox(av, 'Solicitante', name, mail));
        req.classList.add('crp-src-hidden');
      } else {
        // estrutura inesperada: mostra o bloco original dentro do card
        var holder = el('div', 'crp-kv crp-req-raw');
        holder.appendChild(req);
        grid.appendChild(holder);
      }
    }

    var cal = icon('calendar', 'crp-kv-avatar crp-kv-avatar-soft');
    grid.appendChild(kvBox(cal, 'Aberto em', opened ? opened.date : '', opened && opened.time ? 'às ' + opened.time : ''));

    card.appendChild(grid);

    var step = document.getElementById('PanelStep');
    var anchor = document.querySelector('.crp-summary-card:not(.crp-src-hidden)');
    if (!anchor && step) {
      anchor = step.closest('.box.spaced');
      if (!anchor || anchor.contains(document.getElementById('PanelForm'))) anchor = step;
    }
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor);
  }

  /* ---------- Resumo: "Rótulo: valor | Rótulo: valor" vira grade ---------- */
  var SKIP_SUMMARY = '.title, #PanelStep, #PanelForm, #PanelMessage, #PanelFile, #boxSignature, #boxElectronicSignature, #crp-report-region, #RequesterInfo, .crp-card-head, .crp-summary-card';

  function hideIfEmpty(node, stopAt) {
    var guard = 0;
    while (node && node !== document.body && guard++ < 4) {
      if (node.querySelector(stopAt)) return;
      var visible = toArr(node.childNodes).some(function (c) {
        if (c.nodeType === 3) return !!c.textContent.trim();
        if (c.nodeType !== 1) return false;
        if (c.classList.contains('crp-src-hidden')) return false;
        if (/^(BR|HR|SCRIPT|STYLE)$/.test(c.tagName)) return false;
        return !!txt(c) || !!c.querySelector('img,table,input,select,iframe');
      });
      if (visible) return;
      node.classList.add('crp-src-hidden');
      node = node.parentElement;
    }
  }

  /* Instantâneo genérico da solicitação: funciona em qualquer fluxo, pois lê
     somente a tabela de passo a passo (situação, etapa e responsável atuais). */
  function stepSnapshot() {
    var t = document.getElementById('TableStep');
    if (!t) return null;
    var cols = stepColumns(t);
    var rows = toArr(t.querySelectorAll('tbody > tr')).filter(function (tr) {
      return !isStepHead(tr) && tr.children.length > 1 && txt(tr);
    });
    if (!rows.length) return null;

    var cell = function (tr, i) { return tr.children[i] ? txt(tr.children[i]) : ''; };
    // Regra do fluxo: só "em andamento" está aberto; qualquer outro status
    // significa tarefa concluída (inclusive cancelada).
    var isRunning = function (tr) {
      return /andamento|executando|em execu/.test(statusLabel(tr.children[cols.status]).toLowerCase());
    };

    // Pode haver mais de uma tarefa ativa ao mesmo tempo (paralelas, com
    // responsáveis distintos): o resumo lista todas.
    var active = rows.filter(isRunning);
    if (!active.length) {
      // Sem tarefa ativa: usa a linha com a movimentação mais recente.
      var best = null, bestStamp = -1;
      rows.forEach(function (tr) {
        var st = parseStamp(cell(tr, cols.end)) || parseStamp(cell(tr, cols.start));
        if (st && st > bestStamp) { bestStamp = st; best = tr; }
      });
      active = [best || rows[rows.length - 1]];
    }
    // Mesma ordem da tabela: em andamento por data de início.
    active.sort(function (a, b) {
      var sa = parseStamp(cell(a, cols.start));
      var sb = parseStamp(cell(b, cols.start));
      return (sa === null ? Infinity : sa) - (sb === null ? Infinity : sb);
    });

    var cleanResp = function (tr) {
      return cell(tr, cols.resp)
        .replace(/^\s*[A-Z]{2}\s+/, '')
        .replace(/\s*[\w.+-]+@[\w.-]+\S*$/, '')
        .trim();
    };

    var unique = function (list) {
      var seen = {};
      return list.filter(function (v) {
        if (!v || seen[v]) return false;
        seen[v] = true;
        return true;
      });
    };

    var tasks = unique(active.map(function (tr) { return cell(tr, cols.task); }));
    var resps = unique(active.map(cleanResp));
    var seenItem = {};
    var items = active.map(function (tr) {
      return { task: cell(tr, cols.task), resp: cleanResp(tr) };
    }).filter(function (it) {
      var k = it.task + '|' + it.resp;
      if (!it.task || seenItem[k]) return false;
      seenItem[k] = true;
      return true;
    });

    return {
      status: unique(active.map(function (tr) { return statusLabel(tr.children[cols.status]); })).join(' · '),
      task: tasks.join(' · '),
      resp: resps.join(' · '),
      tasks: tasks,
      resps: resps,
      items: items,
      updated: lastMovement(rows, cols),
      count: active.length
    };
  }

  function parseStamp(raw) {
    var m = String(raw || '').match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return null;
    return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)).getTime();
  }

  function lastMovement(rows, cols) {
    var best = null;
    rows.forEach(function (tr) {
      var sc = tr.children[cols.status];
      // Em tarefa aberta, a "conclusão" é a data prevista: não conta como
      // movimentação. Só a data de início é real.
      var running = /andamento|executando|em execu/.test(statusLabel(sc).toLowerCase());
      var idxs = running ? [cols.start] : [cols.end, cols.start];
      idxs.forEach(function (i) {
        var raw = tr.children[i] ? txt(tr.children[i]) : '';
        var stamp = parseStamp(raw);
        if (stamp === null) return;
        var m = raw.match(/(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}))?/);
        if (!best || stamp > best.stamp) {
          best = { stamp: stamp, text: m ? m[1] + (m[2] ? ' ' + m[2] : '') : raw };
        }
      });
    });
    return best ? best.text : '';
  }

  function initSummary() {
    if (document.querySelector('.crp-summary-card')) return;
    var step = document.getElementById('PanelStep');
    var panelReq = document.getElementById('PanelRequester');

    var h4s = toArr(document.querySelectorAll('h4')).filter(function (h) {
      return !h.closest(SKIP_SUMMARY) && /:/.test(h.textContent || '');
    });

    var pairs = [];
    var snap = stepSnapshot();
    if (snap) {
      var many = snap.count > 1;
      var lots = snap.count > 2;
      if (snap.status) pairs.push({ label: 'Situação atual', value: snap.status, status: statusClass(snap.status) });
      if (lots) {
        // Muitas tarefas: resume em contagem e deixa a lista recolhida abaixo.
        pairs.push({ label: 'Etapas atuais', value: snap.count + ' tarefas em andamento' });
      } else {
        if (snap.task) pairs.push({ label: many ? 'Etapas atuais' : 'Etapa atual', value: snap.task });
      }
      if (snap.updated) pairs.push({ label: 'Última movimentação', value: snap.updated });
    }

    // Fallback: sem tabela de passos, aproveita o resumo nativo do relatório.
    if (!pairs.length) {
      h4s.forEach(function (h) {
        txt(h).split(/\n|\|/).forEach(function (part) {
          var mm = part.trim().match(/^([^:]{1,60}):\s*(.*)$/);
          if (mm) pairs.push({ label: mm[1].trim(), value: mm[2].trim() });
        });
      });
    }

    var card = panelReq || el('div');
    card.classList.add('crp-card', 'crp-summary-card');
    card.appendChild(cardHeader('RESUMO', 'Informações principais', null, 'info'));

    if (pairs.length) {
      var grid = el('div', 'crp-kv-grid');
      pairs.forEach(function (p) {
        var item = el('div', 'crp-kv');
        item.appendChild(el('span', 'crp-kv-label', p.label));
        var v = el('span', 'crp-kv-value' + (p.value ? '' : ' is-empty'), p.value || '—');
        if (p.status) v.className += ' crp-status-tag ' + p.status;
        item.appendChild(v);
        grid.appendChild(item);
      });
      card.appendChild(grid);

      if (lots && snap.items.length) {
        var det = el('details', 'crp-active');
        var sum = el('summary', 'crp-active-sum');
        sum.appendChild(el('span', 'crp-active-title', 'Tarefas em andamento '));
        sum.appendChild(el('span', 'crp-active-count', '(' + snap.count + ')'));
        det.appendChild(sum);
        var ul = el('ul', 'crp-active-list');
        snap.items.forEach(function (it) {
          var li = el('li', 'crp-active-item');
          var body = el('div', 'crp-active-text');
          body.appendChild(el('span', 'crp-active-task', it.task || '—'));
          if (it.resp) body.appendChild(el('span', 'crp-active-resp', it.resp));
          li.appendChild(body);
          ul.appendChild(li);
        });
        det.appendChild(ul);
        card.appendChild(det);
      }
    } else if (h4s.length) {
      var raw = el('div', 'crp-summary-raw');
      h4s.forEach(function (h) { raw.appendChild(h); });
      card.appendChild(raw);
    }

    // Esconde o resumo nativo (campos específicos do fluxo): eles continuam
    // disponíveis, completos, na aba Geral › Dados da solicitação.
    if (pairs.length && h4s.length) {
      var parent = h4s[0].parentElement;
      h4s.forEach(function (h) { h.classList.add('crp-src-hidden'); });
      hideIfEmpty(parent, '#PanelStep, .title, #PanelForm, #PanelRequester');
    }

    if (!panelReq) {
      if (!pairs.length && !h4s.length) return; // nada para mostrar
      var anchor = step ? step.closest('.box.spaced') : null;
      if (!anchor || anchor.contains(document.getElementById('PanelForm'))) anchor = step;
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor);
    }
    // card vazio (sem dados) não aparece
    if (!pairs.length && !h4s.length && !txt(card).replace(/RESUMO|Informações principais/g, '').trim()) {
      card.classList.add('crp-src-hidden');
    }
  }

  /* ---------- Aviso de solicitação concluída ---------- */
  function initDoneCard() {
    var result = document.getElementById('Result');
    var alert = result && result.closest('.alert');
    if (!alert) return;
    if (alert.getAttribute('data-crp-done') === '1') return;

    // Mesma fonte do card Resumo: última movimentação e etapa atual.
    var snap = stepSnapshot();
    var dateText = '';
    var stage = '';
    if (snap) {
      var m = String(snap.updated || '').match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
      if (m) {
        dateText = m[1] + '/' + m[2] + '/' + m[3];
        if (m[4]) dateText += ' às ' + m[4] + ':' + m[5];
      }
      stage = snap.task || '';
    }

    alert.setAttribute('data-crp-done', '1');
    alert.classList.add('crp-done-card');
    alert.innerHTML = '';

    var icon = el('span', 'crp-done-icon');
    icon.setAttribute('aria-hidden', 'true');
    alert.appendChild(icon);

    var body = el('div', 'crp-done-body');
    body.appendChild(el('span', 'crp-done-eyebrow', 'SITUAÇÃO'));
    body.appendChild(el('h3', 'crp-done-title', 'Solicitação concluída'));

    var meta = el('div', 'crp-done-meta');
    if (dateText) {
      var d = el('span', 'crp-done-meta-item');
      d.appendChild(el('span', 'crp-done-meta-ic crp-done-ic-clock'));
      d.appendChild(document.createTextNode('Finalizada em ' + dateText));
      meta.appendChild(d);
    }
    if (stage) {
      var s = el('span', 'crp-done-meta-item');
      s.appendChild(el('span', 'crp-done-meta-ic crp-done-ic-step'));
      s.appendChild(document.createTextNode('Última etapa: ' + stage));
      meta.appendChild(s);
    }
    if (meta.children.length) body.appendChild(meta);
    alert.appendChild(body);

    var pill = el('span', 'crp-done-pill crp-kv-value crp-status-tag crp-step-done');
    pill.appendChild(el('span', 'crp-done-pill-ic'));
    pill.appendChild(document.createTextNode('Concluído'));
    alert.appendChild(pill);
  }

  function watchDoneCard() {
    var panel = document.getElementById('PanelFinish');
    if (!panel || panel.getAttribute('data-crp-done-watch') === '1') return;
    panel.setAttribute('data-crp-done-watch', '1');
    new MutationObserver(function () { initDoneCard(); }).observe(panel, {
      childList: true,
      subtree: true
    });
  }


  /* ---------- Passo a passo ---------- */
  function statusClass(t) {
    t = String(t || '').toLowerCase();
    if (/cancel|erro|reprov|falh/.test(t)) return 'crp-step-error';
    if (/conclu|fechad|finaliz/.test(t)) return 'crp-step-done';
    if (/andamento|execu|atual|em curso|abert/.test(t)) return 'crp-step-running';
    return 'crp-step-pending';
  }

  /* O status e a justificativa ficam na mesma célula ("Revisão solicitada
     Teste"). Estes helpers separam só o status, deixando a justificativa
     fora do pill e fora dos filtros. */
  function statusNode(cell) {
    if (!cell) return null;
    var pill = cell.querySelector('.crp-status-pill');
    if (pill) return pill;
    var strong = cell.querySelector('strong, b');
    if (strong) return strong;
    var first = cell.firstElementChild;
    if (first && /conclu|andamento|cancel|reprov|aprov|revis|stand|pendente|abert|aguard|finaliz|erro|falh/i.test(txt(first))) return first;
    return null;
  }

  function statusLabel(cell) {
    if (!cell) return '';
    var node = statusNode(cell);
    if (node) return txt(node).replace(/\s+/g, ' ').trim();
    var lines = txt(cell).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    return (lines[0] || '').replace(/\s+/g, ' ');
  }

  function isStepHead(tr) {
    return !!tr.querySelector('[class^="table-step-col"], th');
  }

  function stepColumns(t) {
    var cols = { task: 0, start: 1, end: 2, status: 4, resp: 5 };
    var head = toArr(t.querySelectorAll('tr')).filter(isStepHead)[0];
    if (!head) return cols;
    toArr(head.children).forEach(function (c, i) {
      var s = txt(c).toLowerCase();
      if (/tarefa|atividade/.test(s)) cols.task = i;
      else if (/in[ií]cio/.test(s)) cols.start = i;
      else if (/conclus/.test(s)) cols.end = i;
      else if (/status|situa/.test(s)) cols.status = i;
      else if (/respons/.test(s)) cols.resp = i;
    });
    return cols;
  }

  function setupSteps() {
    var t = document.getElementById('TableStep');
    if (!t) return;
    if (!t.parentElement.classList.contains('crp-table-wrap')) {
      var wrap = el('div', 'crp-table-wrap');
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    }
    var cols = stepColumns(t);
    toArr(t.querySelectorAll('tbody > tr, thead > tr')).forEach(function (tr) {
      if (tr.classList.contains('crp-step-flagged')) return;
      tr.classList.add('crp-step-flagged');
      if (isStepHead(tr)) { tr.classList.add('crp-step-head'); return; }
      if (!txt(tr)) { tr.classList.add('crp-row-empty'); return; }
      var statusCell = tr.children[cols.status];
      if (!statusCell) return;
      var label = statusLabel(statusCell);
      var cls = statusClass(label);
      tr.classList.add(cls);
      if (label && !statusCell.querySelector('.crp-status-pill')) {
        // Texto completo = status + justificativa; separa os dois.
        var full = txt(statusCell).replace(/\s+/g, ' ').trim();
        var rest = full.indexOf(label) === 0 ? full.slice(label.length) : full.replace(label, ' ');
        rest = rest.replace(/^[\s:;,\-–—]+/, '').trim();

        statusCell.innerHTML = '';
        var pill = el('span', 'crp-status-pill ' + cls);
        pill.textContent = label;
        statusCell.appendChild(pill);

        if (rest && rest.toLowerCase() !== label.toLowerCase()) {
          var note = el('div', 'crp-step-note');
          note.setAttribute('title', rest);
          var nic = el('span', 'crp-step-note-ic');
          nic.setAttribute('aria-hidden', 'true');
          note.appendChild(nic);
          note.appendChild(el('span', 'crp-step-note-text', rest));
          statusCell.appendChild(note);
        }
      }
    });

    /* Ordenação: por padrão conclusão (mais antiga → mais nova) e depois as
       em andamento (por início). Alternativa: tudo por data de início. */
    var tbody = t.tBodies[0];
    if (!tbody) return;

    var allRows = toArr(tbody.children);
    // Cabeçalhos (a tabela do Zeev os coloca no tbody) ficam sempre no topo.
    var isHeaderRow = function (tr) {
      if (isStepHead(tr)) return true;
      var tsk = txt(tr.children[cols.task]).toLowerCase();
      var st = txt(tr.children[cols.status]).toLowerCase();
      return /^(tarefa|atividade)\b/.test(tsk) && (st === 'status' || /situa/.test(st));
    };
    var headRows = allRows.filter(isHeaderRow);
    var dataRows = allRows.filter(function (tr) {
      return headRows.indexOf(tr) === -1 && tr.children.length > 2 && !!txt(tr);
    });
    var tailRows = allRows.filter(function (tr) {
      return headRows.indexOf(tr) === -1 && dataRows.indexOf(tr) === -1;
    });

    var groupOf = function (tr) {
      var s = statusLabel(tr.children[cols.status]).toLowerCase();
      // 0 = concluídas (qualquer status que não seja "em andamento")
      // 1 = em andamento
      return /andamento|executando|em execu/.test(s) ? 1 : 0;
    };

    var applySort = function (mode) {
      var list = dataRows.slice();
      list.sort(function (a, b) {
        if (mode === 'start') {
          var sa = parseStamp(txt(a.children[cols.start]));
          var sb = parseStamp(txt(b.children[cols.start]));
          return (sa === null ? Infinity : sa) - (sb === null ? Infinity : sb);
        }
        var ga = groupOf(a), gb = groupOf(b);
        if (ga !== gb) return ga - gb;
        var key = ga === 0 ? cols.end : cols.start;
        var ka = parseStamp(txt(a.children[key]));
        var kb = parseStamp(txt(b.children[key]));
        // Sem data de conclusão (ex.: tarefa inicial): usa a data de início.
        if (ka === null) ka = parseStamp(txt(a.children[cols.start]));
        if (kb === null) kb = parseStamp(txt(b.children[cols.start]));
        return (ka === null ? Infinity : ka) - (kb === null ? Infinity : kb);
      });
      headRows.forEach(function (tr) { tbody.appendChild(tr); });
      list.forEach(function (tr) { tbody.appendChild(tr); });
      tailRows.forEach(function (tr) { tbody.appendChild(tr); });
    };

    var wrap = t.parentElement;
    var holder = wrap.parentNode || wrap;
    if (!holder.querySelector('.crp-step-toolbar')) {
      var bar = el('div', 'crp-step-toolbar');

      /* Filtros por status */
      var filterState = {};
      var emptyRow = null;
      var statusOf = function (tr) {
        return statusLabel(tr.children[cols.status]);
      };
      var statusList = [];
      var statusCount = {};
      dataRows.forEach(function (tr) {
        var s = statusOf(tr);
        if (!s) return;
        if (!statusCount[s]) { statusCount[s] = 0; statusList.push(s); }
        statusCount[s]++;
      });

      var ensureEmpty = function (show) {
        if (!emptyRow) {
          emptyRow = el('tr', 'crp-step-empty');
          var td = el('td');
          td.colSpan = headRows[0] ? headRows[0].children.length : 7;
          td.textContent = 'Nenhuma tarefa com os filtros selecionados.';
          emptyRow.appendChild(td);
        }
        if (show && !emptyRow.parentNode) tbody.appendChild(emptyRow);
        if (!show && emptyRow.parentNode) emptyRow.parentNode.removeChild(emptyRow);
      };

      var filterWrap = el('div', 'crp-step-filter');
      var fbtn = el('button', 'crp-filter-btn');
      fbtn.type = 'button';
      fbtn.setAttribute('aria-haspopup', 'true');
      fbtn.setAttribute('aria-expanded', 'false');
      var menu = el('div', 'crp-filter-menu');
      menu.hidden = true;

      var allLabel = el('label', 'crp-filter-opt');
      var allCb = document.createElement('input');
      allCb.type = 'checkbox';
      allCb.value = '__all';
      allCb.checked = true;
      allLabel.appendChild(allCb);
      allLabel.appendChild(el('span', 'crp-filter-name', 'Todos'));
      menu.appendChild(allLabel);

      statusList.forEach(function (s) {
        var lab = el('label', 'crp-filter-opt');
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = s;
        lab.appendChild(cb);
        lab.appendChild(el('span', 'crp-filter-name', s));
        lab.appendChild(el('span', 'crp-filter-n', String(statusCount[s])));
        menu.appendChild(lab);
      });

      var syncFilter = function () {
        var active = Object.keys(filterState).filter(function (k) { return filterState[k]; });
        fbtn.innerHTML = '';
        fbtn.appendChild(icon('filter', 'crp-filter-ic'));
        fbtn.appendChild(el('span', 'crp-filter-text', 'Filtros'));
        if (active.length) fbtn.appendChild(el('span', 'crp-filter-count', String(active.length)));
        fbtn.title = active.length ? 'Filtros ativos: ' + active.join(', ') : 'Filtrar por status';
        fbtn.setAttribute('aria-label', fbtn.title);
        allCb.checked = active.length === 0;
        toArr(menu.querySelectorAll('input')).forEach(function (cb) {
          if (cb.value !== '__all') cb.checked = !!filterState[cb.value];
        });
      };

      var applyFilter = function () {
        var active = Object.keys(filterState).filter(function (k) { return filterState[k]; });
        var any = active.length > 0;
        var visible = 0;
        dataRows.forEach(function (tr) {
          var show = !any || active.indexOf(statusOf(tr)) > -1;
          tr.hidden = !show;
          if (show) visible++;
        });
        ensureEmpty(any && visible === 0);
        syncFilter();
      };

      var refresh = function () { applySort(mode); applyFilter(); };

      menu.addEventListener('change', function (e) {
        var cb = e.target;
        if (!cb || cb.type !== 'checkbox') return;
        filterState = cb.value === '__all' ? {} : filterState;
        if (cb.value !== '__all') filterState[cb.value] = cb.checked;
        refresh();
      });

      fbtn.addEventListener('click', function (e) {
        e.stopPropagation();
        menu.hidden = !menu.hidden;
        fbtn.setAttribute('aria-expanded', String(!menu.hidden));
      });
      filterWrap.appendChild(fbtn);
      filterWrap.appendChild(menu);

      /* Recolher/expandir o passo a passo (aberto por padrão). */
      var toggle = el('button', 'crp-step-toggle');
      toggle.type = 'button';
      toggle.setAttribute('aria-controls', 'TableStep');
      toggle.setAttribute('aria-expanded', 'true');
      var toggleIc = el('span', 'crp-step-toggle-ic');
      toggleIc.setAttribute('aria-hidden', 'true');
      var toggleTxt = el('span', 'crp-step-toggle-text', 'Recolher');
      toggle.appendChild(toggleIc);
      toggle.appendChild(toggleTxt);
      var collapsed = false;
      var syncToggle = function () {
        toggle.title = collapsed ? 'Expandir passo a passo' : 'Recolher passo a passo';
        toggle.setAttribute('aria-label', toggle.title);
        toggleTxt.textContent = collapsed ? 'Expandir' : 'Recolher';
      };
      toggle.addEventListener('click', function () {
        collapsed = !collapsed;
        holder.classList.toggle('crp-steps-collapsed', collapsed);
        toggle.setAttribute('aria-expanded', String(!collapsed));
        syncToggle();
      });
      syncToggle();

      var btn = el('button', 'crp-sort-btn');
      btn.type = 'button';
      var mode = 'end';
      var sync = function () {
        btn.innerHTML = '';
        btn.appendChild(icon('calendar', 'crp-sort-ic'));
        btn.appendChild(el('span', 'crp-sort-text', 'Ordenar: ' + (mode === 'end' ? 'conclusão' : 'início')));
        btn.title = mode === 'end'
          ? 'Ordenando por conclusão e depois em andamento. Clique para ordenar por data de início.'
          : 'Ordenando por data de início. Clique para ordenar por conclusão e depois em andamento.';
        btn.setAttribute('aria-label', btn.title);
      };
      btn.addEventListener('click', function () {
        mode = mode === 'end' ? 'start' : 'end';
        refresh();
        sync();
      });
      sync();

      var barLeft = el('div', 'crp-step-left');
      barLeft.appendChild(toggle);
      barLeft.appendChild(filterWrap);
      bar.appendChild(barLeft);
      bar.appendChild(btn);
      holder.insertBefore(bar, wrap);

      document.addEventListener('click', function (e) {
        if (!menu.hidden && !filterWrap.contains(e.target)) {
          menu.hidden = true;
          fbtn.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !menu.hidden) {
          menu.hidden = true;
          fbtn.setAttribute('aria-expanded', 'false');
        }
      });

      refresh();
    } else {
      applySort('end');
    }
  }

  /* ---------- Formulário: accordions, campos vazios, títulos ---------- */
  function isHiddenRow(tr) {
    return tr.hidden || (tr.style && tr.style.display === 'none');
  }

  function setupForm(form) {
    // Título "Formulário" repetido (o card já tem cabeçalho)
    toArr(form.querySelectorAll('h1,h2,h3,h4,h5,legend,.box-header')).forEach(function (h) {
      if (/^formul[aá]rio$/i.test(txt(h)) && !h.querySelector('table')) h.classList.add('crp-src-hidden');
    });

    toArr(form.querySelectorAll('table.form')).forEach(function (tbl) {
      var tbody = tbl.tBodies[0];
      if (!tbody) return;
      var rows = toArr(tbody.children);

      rows.forEach(function (tr) {
        if (tr.classList.contains('group')) return;
        var tds = toArr(tr.children);
        // Linhas de texto/ajuda (célula única/colspan), multivaloradas e
        // textareas ocupam a linha inteira. Campos de arquivo ficam no grid
        // normal (mesmo alinhamento dos demais).
        if (tds.length === 1 || tr.querySelector('td[colspan]') ||
            tr.querySelector('table[mult="S"], textarea')) {
          tr.classList.add('crp-full');
        }
        if (tds.length === 1) tr.classList.add('crp-note');
        // (Marcador de campo vazio removido: era aplicado antes do Zeev
        // preencher os valores e acabava aparecendo em todos os campos.)
      });

      var groupRow = rows.filter(function (tr) { return tr.classList.contains('group'); })[0];
      if (!groupRow) { tbl.classList.add('crp-no-group'); return; }
      var td = groupRow.querySelector('td.group') || groupRow.firstElementChild;
      if (!td || td.getAttribute('data-crp-acc') === '1') return;
      td.setAttribute('data-crp-acc', '1');

      var count = rows.filter(function (tr) {
        return !tr.classList.contains('group') && !tr.classList.contains('crp-note') && !isHiddenRow(tr);
      }).length;

      var label = el('span', 'crp-sec-label');
      while (td.firstChild) label.appendChild(td.firstChild);
      td.appendChild(label);
      td.appendChild(el('span', 'crp-sec-count', count + (count === 1 ? ' campo' : ' campos')));
      var arrow = el('span', 'crp-sec-arrow');
      arrow.setAttribute('aria-hidden', 'true');
      td.appendChild(arrow);
      td.setAttribute('role', 'button');
      td.tabIndex = 0;
      td.setAttribute('aria-expanded', 'true');

      function toggle() {
        var col = tbl.classList.toggle('crp-collapsed');
        td.setAttribute('aria-expanded', String(!col));
      }
      td.addEventListener('click', toggle);
      td.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  /* Campo de máscara vazio (ex.: CEP "_____-___"): esconde os "_" e mostra "—" */
  function markMaskEmpty() {
    var form = document.getElementById('PanelForm');
    if (!form) return;
    toArr(form.querySelectorAll('td.col1 div[xtype]')).forEach(function (node) {
      if (node.getAttribute('data-crp-mask') === '1') return;
      if (node.querySelector('a,img,table')) return;
      var t = (node.textContent || '').trim();
      if (!t) return;
      if (t.indexOf('_') >= 0 && /^[\s_\-\.\/()]+$/.test(t)) {
        node.setAttribute('data-crp-mask', '1');
      }
    });
  }

  /* Campo vazio: marca a célula (crp-val-empty) para mostrar "—" em cinza.
     É reavaliado a cada passada (o Zeev preenche os valores depois do carregamento):
     quem ganha valor perde a marca. */
  function markEmptyValues() {
    var form = document.getElementById('PanelForm');
    if (!form) return;
    toArr(form.querySelectorAll('table.form > tbody > tr > td.col1')).forEach(function (td) {
      var vazio = !td.querySelector('img,a,input,select,textarea,table,iframe,[data-crp-mask]') &&
        !String(td.textContent || '').replace(/[\s ]/g, '');
      td.classList.toggle('crp-val-empty', vazio);
    });
  }

  function watchEmptyValues() {
    var form = document.getElementById('PanelForm');
    if (!form || form.getAttribute('data-crp-empty-watch') === '1') return;
    form.setAttribute('data-crp-empty-watch', '1');
    var timer = null;
    new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(markEmptyValues, 150);
    }).observe(form, { childList: true, subtree: true, characterData: true });
    markEmptyValues();
  }

  /* ---------- Mensagens: cartão limpo (avatar + nome/e-mail + data) ---------- */
  function setupMessages() {
    var t = document.getElementById('tblMessage');
    if (!t) return;
    toArr(t.querySelectorAll('tbody > tr')).forEach(function (tr) {
      if (tr.querySelector('.alert')) return;
      if (tr.getAttribute('data-crp-msg') === '1') return;

      var actor = tr.querySelector('td.actor');
      var dateTd = tr.querySelector('td.date');
      var msgTd = tr.querySelector('td.message');
      var taskTd = tr.querySelector('td.task');
      if (!actor || !msgTd) return;

      var nameEl = actor.querySelector('.user-content strong') || actor.querySelector('strong');
      var mailEl = actor.querySelector('.user-content .small');
      var name = txt(nameEl || actor).replace(/\s*\([^)]*@[^)]*\)\s*/g, '').trim();
      var mail = mailEl ? txt(mailEl) : '';
      if (!mail || mail.indexOf('@') < 0) {
        var mm = txt(actor).match(/[\w.+-]+@[\w.-]+\.\w+/);
        mail = mm ? mm[0] : '';
      }

      var dateRaw = dateTd ? txt(dateTd) : '';
      var dm = dateRaw.match(/(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?/);
      var dateText = dm ? (dm[1] + (dm[2] ? ' ' + dm[2] : '')) : dateRaw;
      var bubble = msgTd.querySelector('.comment-text') || msgTd;
      var task = taskTd ? txt(taskTd) : '';

      var cell = el('td', 'crp-msg-cell');
      cell.colSpan = 7;
      var art = el('article', 'crp-msg');

      var head = el('header', 'crp-msg-head');
      head.appendChild(el('span', 'crp-msg-avatar', initials(name)));
      var idWrap = el('div', 'crp-msg-id');
      idWrap.appendChild(el('span', 'crp-msg-name', name || '—'));
      if (mail) idWrap.appendChild(el('span', 'crp-msg-mail', mail));
      head.appendChild(idWrap);
      if (dateText) head.appendChild(el('span', 'crp-msg-date', dateText));
      art.appendChild(head);

      var bub = el('div', 'crp-msg-bubble');
      bub.appendChild(bubble);
      art.appendChild(bub);

      if (task) {
        var foot = el('footer', 'crp-msg-foot');
        foot.appendChild(el('span', 'crp-msg-task', task));
        art.appendChild(foot);
      }

      cell.appendChild(art);
      while (tr.firstChild) tr.removeChild(tr.firstChild);
      tr.appendChild(cell);
      tr.setAttribute('data-crp-msg', '1');
    });
  }

  /* ---------- Anexos: cartão do arquivo ---------- */
  function fileExt(name) {
    var m = String(name || '').match(/\.([a-z0-9]{1,6})$/i);
    return m ? m[1].toLowerCase() : '';
  }

  function fileTypeClass(ext, kind) {
    var k = (ext + ' ' + kind).toLowerCase();
    if (/pdf/.test(k)) return 'crp-f-pdf';
    if (/xls|xlsx|csv|planilha|spreadsheet/.test(k)) return 'crp-f-sheet';
    if (/doc|docx|word|texto/.test(k)) return 'crp-f-doc';
    if (/zip|rar|7z|compact/.test(k)) return 'crp-f-zip';
    return 'crp-f-gen';
  }

  function setupFiles() {
    var t = document.getElementById('tblFile');
    if (!t) return;
    toArr(t.querySelectorAll('tbody > tr')).forEach(function (tr) {
      if (tr.getAttribute('data-crp-file') === '1') return;
      if (tr.querySelector('.alert')) return;

      var nameTd = tr.querySelector('td.filename');
      var link = nameTd && nameTd.querySelector('a');
      if (!link) return;

      var img = tr.querySelector('td.fileicon img');
      var dl = tr.querySelector('td.filedonwload a, td.download a');
      var dateTd = tr.querySelector('td.date');
      var actorTd = tr.querySelector('td.actor');
      var taskTd = tr.querySelector('td.task');
      var typeTd = tr.querySelector('td.docType');

      var name = txt(link);
      var ext = fileExt(name);
      var kind = typeTd ? txt(typeTd) : '';
      if (!kind && ext) kind = ext.toUpperCase();
      var isImg = /^(png|jpe?g|gif|webp|bmp|svg)$/.test(ext);
      var typeCls = fileTypeClass(ext, kind);

      var strong = actorTd && actorTd.querySelector('strong');
      var author = strong ? txt(strong) : (actorTd ? txt(actorTd).split('\n')[0] : '');
      author = author.replace(/\s*\([^)]*@[^)]*\)\s*/g, '').trim();

      var dateRaw = dateTd ? txt(dateTd) : '';
      var dm = dateRaw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      var tmEl = dateTd && dateTd.querySelector('.muted');
      var tm = tmEl ? txt(tmEl).match(/(\d{2}:\d{2})/) : dateRaw.match(/(\d{2}:\d{2})/);
      var clock = tm ? tm[1] : '';
      var dateText = dm ? dm[0] + (clock ? ' ' + clock : '') : dateRaw;
      var dateISO = dm ? dm[3] + '-' + dm[2] + '-' + dm[1] + 'T' + (clock || '00:00') : '';
      var task = '';
      if (taskTd) {
        // A célula traz a tarefa e, em um <small>, a origem/processo. Sem o
        // separador os textos saíam grudados ("TarefaProcesso").
        var tMain = txt(taskTd.querySelector('div'));
        var tSub = txt(taskTd.querySelector('.small'));
        task = tSub ? (tMain + ' › ' + tSub) : (tMain || txt(taskTd).split('\n')[0].trim());
      }

      var href = link.getAttribute('href') || '#';
      var cell = el('td', 'crp-file-cell');
      cell.colSpan = tr.children.length || 10;
      var art = el('article', 'crp-file');

      var head = el('div', 'crp-file-main');
      var thumb = el('a', 'crp-file-thumb ' + typeCls);
      thumb.href = href;
      thumb.target = '_blank';
      thumb.rel = 'noopener';
      thumb.setAttribute('data-colorbox', 'true');
      thumb.title = 'Visualizar arquivo';
      thumb.setAttribute('aria-label', 'Visualizar arquivo');
      if (isImg && img) {
        img.className = 'crp-file-img';
        img.setAttribute('loading', 'lazy');
        img.addEventListener('error', function () {
          img.remove();
          thumb.appendChild(el('span', 'crp-file-type'));
        });
        thumb.appendChild(img);
      } else {
        thumb.appendChild(el('span', 'crp-file-type'));
      }
      head.appendChild(thumb);

      var info = el('div', 'crp-file-info');
      link.className = 'crp-file-name';
      link.setAttribute('title', name);
      info.appendChild(link);

      var sub = el('div', 'crp-file-sub');
      if (kind) sub.appendChild(el('span', 'crp-file-kind', kind));
      var sizeEl = tr.querySelector('.size, td.size, [data-size]');
      var sizeTxt = sizeEl ? txt(sizeEl) : '';
      if (sizeTxt) {
        if (kind) sub.appendChild(el('span', 'crp-file-dot', '·'));
        sub.appendChild(el('span', 'crp-file-size', sizeTxt));
      }
      if (sub.children.length) info.appendChild(sub);
      head.appendChild(info);

      var actions = el('div', 'crp-file-actions');
      var view = el('a', 'crp-file-btn crp-file-view');
      view.href = href;
      view.target = '_blank';
      view.rel = 'noopener';
      view.setAttribute('data-colorbox', 'true');
      view.title = 'Visualizar arquivo';
      view.setAttribute('aria-label', 'Visualizar arquivo');
      view.appendChild(el('span', 'crp-file-ic crp-ic-eye'));
      actions.appendChild(view);

      if (dl) {
        dl.className = 'crp-file-btn crp-file-dl';
        dl.title = 'Baixar arquivo';
        dl.setAttribute('aria-label', 'Baixar arquivo');
        while (dl.firstChild) dl.removeChild(dl.firstChild);
        dl.appendChild(el('span', 'crp-file-ic crp-ic-dl'));
        actions.appendChild(dl);
      }
      head.appendChild(actions);
      art.appendChild(head);

      var meta = el('div', 'crp-file-meta');
      if (dateText) {
        var time = el('time', 'crp-file-time');
        if (dateISO) time.setAttribute('datetime', dateISO);
        time.appendChild(el('span', 'crp-file-ic crp-ic-clock'));
        time.appendChild(document.createTextNode(dateText));
        meta.appendChild(time);
      }
      if (author) {
        var au = el('span', 'crp-file-author');
        au.appendChild(el('span', 'crp-file-ic crp-ic-user'));
        au.appendChild(el('span', 'crp-file-author-txt', author));
        meta.appendChild(au);
      }
      if (task) {
        var tk = el('span', 'crp-file-task');
        tk.title = task;
        tk.appendChild(el('span', 'crp-file-ic crp-ic-tag'));
        tk.appendChild(el('span', 'crp-file-task-txt', task));
        meta.appendChild(tk);
      }
      if (meta.children.length) art.appendChild(meta);

      art.addEventListener('click', function (e) {
        if (e.target.closest('a,button')) return;
        link.click();
      });

      cell.appendChild(art);
      while (tr.firstChild) tr.removeChild(tr.firstChild);
      tr.appendChild(cell);
      tr.setAttribute('data-crp-file', '1');
    });
  }

  // Reordenar/altera anexos recria as linhas no Zeev: reaplica os cards.
  function watchFiles() {
    var panel = document.getElementById('PanelFile');
    if (!panel || panel.getAttribute('data-crp-files-watch') === '1') return;
    panel.setAttribute('data-crp-files-watch', '1');
    // Sem requestAnimationFrame: em aba em segundo plano ele é pausado e os
    // cards não voltavam. setupFiles é idempotente, então roda direto.
    new MutationObserver(function () { setupFiles(); }).observe(panel, {
      childList: true,
      subtree: true
    });
  }

  /* ---------- Histórico (timeline a partir do passo a passo) ---------- */
  function buildHistorico() {
    var t = document.getElementById('TableStep');
    var wrap = el('div', 'crp-timeline');
    var any = false;
    if (t) {
      var cols = stepColumns(t);
      toArr(t.querySelectorAll('tbody > tr')).forEach(function (tr) {
        if (isStepHead(tr) || tr.classList.contains('crp-row-empty')) return;
        var cells = tr.children;
        if (!cells.length) return;
        var nameCell = cells[cols.task];
        var nameEl = nameCell && (nameCell.querySelector('strong') || nameCell);
        var name = txt(nameEl);
        if (!name) return;
        any = true;
        var clean = function (i) { return txt(cells[i]).replace(/\s*\n+\s*/g, ' · '); };
        var start = clean(cols.start), end = clean(cols.end), status = clean(cols.status), resp = clean(cols.resp);

        var item = el('div', 'crp-tl-item ' + statusClass(status));
        item.appendChild(el('span', 'crp-tl-dot'));
        var card = el('div', 'crp-tl-card');
        var top = el('div', 'crp-tl-top');
        top.appendChild(el('div', 'crp-tl-task', name));
        if (status) top.appendChild(el('span', 'crp-status-pill ' + statusClass(status), status));
        card.appendChild(top);
        var meta = [];
        if (start) meta.push('Início: ' + start);
        if (end) meta.push('Conclusão: ' + end);
        if (meta.length) card.appendChild(el('div', 'crp-tl-meta', meta.join('   •   ')));
        if (resp) card.appendChild(el('div', 'crp-tl-resp', resp));
        item.appendChild(card);
        wrap.appendChild(item);
      });
    }
    if (!any) wrap.appendChild(el('div', 'alert', 'Sem eventos no histórico.'));
    return wrap;
  }

  /* ---------- Barra inferior de ações ---------- */
  function buildBottomBar() {
    var nav = document.querySelector('.title ul.nav');
    if (!nav || document.getElementById('crp-bottom-bar')) return;

    var dd = nav.querySelector('li.dropdown');
    var menu = dd && dd.querySelector('.dropdown-menu');
    if (!menu) return;

    var keyOf = { LkEdit: 'edit', LkHoldShowOn: 'hold', LkCancel: 'cancel' };
    var rankOf = { cancel: 0, hold: 1, edit: 2, reopen: 3, other: 4 };
    var entries = [];
    Array.prototype.forEach.call(menu.children, function (li, idx) {
      // Qualquer tipo de controle (a, button, input, role=button), não só <a>.
      var act = li.querySelector('a, button, input[type="button"], input[type="submit"], [role="button"]');
      if (!act) return;
      var label = act.tagName === 'INPUT' ? (act.value || '') : txt(act);
      var id = act.id || '';
      var norm = String(label)
        .normalize ? String(label).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
          : String(label).toLowerCase().trim();
      // Excluir nunca aparece; as demais (ex.: Reabrir do super admin) entram.
      if (id === 'LkDelete' || /^excluir(\s|$)/.test(norm)) {
        if (li.parentNode) li.parentNode.removeChild(li);
        return;
      }
      var key = keyOf[id];
      if (!key) {
        if (/reabr/.test(norm)) key = 'reopen';
        else if (/editar/.test(norm)) key = 'edit';
        else if (/congelar|stand\s*by|pausar/.test(norm)) key = 'hold';
        else if (/cancelar/.test(norm)) key = 'cancel';
        else key = 'other';
      }
      entries.push({ act: act, li: li, key: key, order: idx, label: label });
    });

    entries.sort(function (x, y) {
      var rx = rankOf[x.key], ry = rankOf[y.key];
      if (rx !== ry) return rx - ry;
      return x.order - y.order;
    });

    var list = el('ul', 'crp-bottom-bar-actions');
    entries.forEach(function (e) {
      var barLi = el('li', 'crp-ab-' + e.key);
      var ctl;
      if (e.act.tagName === 'INPUT') {
        ctl = el('button', 'crp-ab-el', e.act.value || '');
        ctl.type = 'button';
      } else {
        ctl = el('a', 'crp-ab-el', String(e.label || '').trim());
        ctl.href = 'javascript:void(0)';
      }
      ctl.setAttribute('role', 'button');
      if (e.act.disabled) ctl.setAttribute('aria-disabled', 'true');
      ctl.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        // Mantém o controle original dentro do form/nav: dispara o handler nativo.
        try { e.act.click(); } catch (err) {}
      });
      barLi.appendChild(ctl);
      list.appendChild(barLi);
    });
    if (!list.children.length) return;

    var bar = el('div', 'crp-bottom-bar');
    bar.id = 'crp-bottom-bar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Ações da solicitação');
    var inner = el('div', 'crp-bottom-bar-inner');
    inner.appendChild(list);
    bar.appendChild(inner);
    document.body.appendChild(bar);
    document.body.classList.add('crp-has-bottom-bar');

    if (dd) {
      dd.style.position = 'absolute';
      dd.style.left = '-9999px';
      dd.style.top = '0';
      dd.style.width = '1px';
      dd.style.height = '1px';
      dd.style.overflow = 'hidden';
      dd.style.opacity = '0';
    }
  }

  /* ---------- Abas ---------- */
  function build() {
    var step = document.getElementById('PanelStep');
    var form = document.getElementById('PanelForm');
    if (!step || !form) return false;
    if (document.getElementById('crp-report-region')) return true;

    if (document.body) document.body.classList.add('crp-report');
    if (step.parentElement) step.parentElement.classList.add('crp-report-main');

    initHeader();
    initSummary();
    initDoneCard();
    watchDoneCard();
    initRequesterCard();
    buildBottomBar();
    setupSteps();

    var msg = document.getElementById('PanelMessage');
    var file = document.getElementById('PanelFile');
    var msgCount = countRows('tblMessage');
    var fileCount = countRows('tblFile');

    var region = el('div', 'crp-report-region');
    region.id = 'crp-report-region';
    var nav = el('div', 'crp-report-tabs');
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', 'Seções do relatório');
    var panelsWrap = el('div', 'crp-tabpanels');

    var defs = [
      { key: 'geral', label: 'Geral', count: null },
      { key: 'mensagens', label: 'Mensagens', count: msgCount },
      { key: 'anexos', label: 'Anexos', count: fileCount },
      { key: 'historico', label: 'Histórico', count: null }
    ];
    var tabs = {}, panels = {};

    defs.forEach(function (d, i) {
      var btn = el('button', 'crp-report-tab');
      btn.type = 'button';
      btn.id = 'crp-tab-' + d.key;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.setAttribute('data-tab', d.key);
      btn.appendChild(icon(d.key, 'crp-tab-ic'));
      btn.appendChild(el('span', 'crp-tab-text', d.label));
      if (d.count !== null) btn.appendChild(el('span', 'crp-tab-count', String(d.count)));
      btn.addEventListener('click', function () { select(d.key); });

      var p = el('section', 'crp-tabpanel');
      p.id = 'crp-panel-' + d.key;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', btn.id);
      p.setAttribute('data-tab', d.key);
      if (i !== 0) p.setAttribute('data-hidden', '1');

      nav.appendChild(btn);
      panelsWrap.appendChild(p);
      tabs[d.key] = btn;
      panels[d.key] = p;
    });

    function select(key) {
      defs.forEach(function (d) {
        var active = d.key === key;
        tabs[d.key].setAttribute('aria-selected', active ? 'true' : 'false');
        if (active) panels[d.key].removeAttribute('data-hidden');
        else panels[d.key].setAttribute('data-hidden', '1');
      });
    }

    region.appendChild(nav);
    region.appendChild(panelsWrap);
    var stepBox = step.closest('.box.spaced');
    if (!stepBox || stepBox.contains(form)) stepBox = step;
    stepBox.parentNode.insertBefore(region, stepBox.nextSibling);

    function card(panel, head) {
      var c = el('div', 'crp-card crp-tab-card');
      c.appendChild(head);
      panel.appendChild(c);
      return c;
    }

    // Geral: formulário dentro de um card
    var geral = card(panels.geral, cardHeader('RESUMO', 'Dados da solicitação', null, 'geral'));
    geral.appendChild(form);
    ['boxSignature', 'boxElectronicSignature'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b && b.parentNode) { b.classList.add('crp-card'); panels.geral.appendChild(b); }
    });

    var mc = card(panels.mensagens, cardHeader('MENSAGENS', 'Conversa da solicitação',
      msgCount + (msgCount === 1 ? ' mensagem' : ' mensagens'), 'mensagens'));
    if (msg) mc.appendChild(msg);
    else mc.appendChild(el('div', 'alert', 'Nenhuma mensagem.'));

    var fc = card(panels.anexos, cardHeader('ANEXOS', 'Arquivos da solicitação',
      fileCount + (fileCount === 1 ? ' arquivo' : ' arquivos'), 'anexos'));
    if (file) fc.appendChild(file);
    else fc.appendChild(el('div', 'alert', 'Nenhum arquivo.'));

    var hc = card(panels.historico, cardHeader('HISTÓRICO', 'Linha do tempo da solicitação', null, 'historico'));
    hc.appendChild(buildHistorico());

    if (msgCount === 0) panels.mensagens.classList.add('crp-tabpanel-empty');
    if (fileCount === 0) panels.anexos.classList.add('crp-tabpanel-empty');

    setupForm(form);
    setupMessages();
    setupFiles();
    watchFiles();
    markMaskEmpty();
    setTimeout(markMaskEmpty, 1200);
    setTimeout(markMaskEmpty, 2600);
    watchEmptyValues();
    setTimeout(markEmptyValues, 1200);
    setTimeout(markEmptyValues, 2600);
    relInit();
    // Reavalia depois que o Zeev preenche os valores assincronamente.
    setTimeout(relInit, 800);
    setTimeout(relInit, 1800);
    setTimeout(relInit, 3200);
    return true;
  }

  /* ============================================================
     CRP | Camada de leitura "repaginada" (prefixo .crp-rel-)
     ------------------------------------------------------------
     - Roda SOMENTE na tela de detalhamento (body.pop + #PanelStep +
       #PanelForm, sem #containerRequest/inputs editáveis).
     - Nunca altera inputs/hidden de postback.
     - Só esconde o que ELA esconde (.crp-rel-oculto); o que o Zeev
       ocultou (display:none/hidden) permanece intocado.
     - Kill switch: localStorage 'crp-rel-off' = '1' ou window.CRP_REL_OFF.
     ============================================================ */
  var REL = {
    hidden: 'crp-rel-oculto',
    srcHidden: 'crp-rel-src-hidden',
    mostrarKey: 'crp-rel-mostrar-vazios',
    offKey: 'crp-rel-off',
    highlightsEnabled: true,
    rules: [
      { key: 'total', re: /^valor(\s+total)?$|total/i },
      { key: 'pagamento', re: /forma de pagamento/i },
      { key: 'pessoa', re: /fornecedor|prestador|cliente|colaborador/i },
      { key: 'prazo', re: /prazo|vencimento|data prevista/i }
    ],
    maxHighlights: 4,
    stepFilter: 'todas'
  };

  function relOff() {
    try { if (localStorage.getItem(REL.offKey) === '1') return true; } catch (e) {}
    return !!window.CRP_REL_OFF;
  }

  /* Contexto: o relatório é o "pop" somente leitura. Se houver
     #containerRequest (tela de tarefa/preenchimento) não roda. */
  function relReadMode() {
    if (!document.body || !document.body.classList.contains('pop')) return false;
    if (document.getElementById('containerRequest')) return false;
    if (relEditMode()) return false;
    return !!(document.getElementById('PanelStep') && document.getElementById('PanelForm'));
  }

  /* Modo edição do Detalhamento: o próprio relatório vira formulário
     ("Fechar edição", links "Reabrir" por tarefa, painel de atores). Nesse
     contexto NÃO aplicamos a camada: as ações originais precisam aparecer. */
  function relEditMode() {
    var nav = document.querySelector('.title ul.nav');
    if (nav && /fechar\s+edi[cç][aã]o/i.test(txt(nav))) return true;
    if (document.getElementById('LkStepOpen')) return true;
    var actors = document.getElementById('PanelFormActors');
    if (actors && getComputedStyle(actors).display !== 'none') return true;
    return false;
  }

  function relRestore() {
    // Desfaz tudo que a camada fez, devolvendo a tela de edição do Zeev.
    relSearchClear(true);
    toArr(document.querySelectorAll('.crp-rel-bar, .crp-rel-banner, .crp-rel-emptynote, .crp-rel-busca-resumo, .crp-rel-search-empty, .crp-rel-highlights, .crp-rel-open, #crp-rel-steps, .crp-rel-footrow, .crp-rel-mult-note'))
      .forEach(function (n) { n.remove(); });
    toArr(document.querySelectorAll('.crp-rel-src-hidden')).forEach(function (n) {
      n.classList.remove(REL.srcHidden);
    });
    toArr(document.querySelectorAll('.' + REL.hidden)).forEach(function (n) {
      n.classList.remove(REL.hidden);
    });
    toArr(document.querySelectorAll('.crp-summary-card.crp-src-hidden')).forEach(function (n) {
      n.classList.remove('crp-src-hidden');
    });
  }

  function relSlug(s) {
    return String(s || '')
      .normalize ? String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  /* Vazio (puro): '', '&nbsp;', máscara '_____-___', 'Selecione...', '--'.
     Preenchido: '0', 'R$ 0,00', 'Não'. */
  function relIsVazio(v) {
    if (v == null) return true;
    var s = String(v).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    if (!s) return true;
    if (s.indexOf('_') >= 0 && /^[\s_\-.\/()]+$/.test(s)) return true;
    if (/^(selecione|selecione\.\.\.|escolha|--|-|—|n\/a|na)$/i.test(s)) return true;
    return false;
  }

  function relVal(td) { return td ? txt(td).replace(/\s+/g, ' ').trim() : ''; }
  function relMidia(td) {
    return !!(td && td.querySelector('a[href], img, table, .containerFormFileLink'));
  }
  function relPreenchido(td) {
    if (!td) return false;
    if (relMidia(td)) return true;
    return !relIsVazio(relVal(td));
  }
  function relZeevOculto(el) {
    if (!el) return true;
    var n = el;
    for (var i = 0; i < 4 && n && n.nodeType === 1; i++) {
      var cs = getComputedStyle(n);
      if (n.hidden || n.style.display === 'none' || cs.display === 'none') return true;
      n = n.parentElement;
    }
    return false;
  }

  function relMostrarVazios() {
    try { return localStorage.getItem(REL.mostrarKey) === '1'; } catch (e) { return false; }
  }
  function relSetMostrarVazios(v) {
    try { localStorage.setItem(REL.mostrarKey, v ? '1' : '0'); } catch (e) {}
  }

  function relLimparAsteriscos(lab) {
    if (!lab || lab.getAttribute('data-crp-rel-ast') === '1') return;
    lab.setAttribute('data-crp-rel-ast', '1');
    toArr(lab.childNodes).forEach(function (n) {
      if (n.nodeType === 3) n.textContent = n.textContent.replace(/\*/g, '');
      else if (n.nodeType === 1 && !/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName)) {
        toArr(n.childNodes).forEach(function (m) {
          if (m.nodeType === 3) m.textContent = m.textContent.replace(/\*/g, '');
        });
      }
    });
  }

  function relTratarValor(val, lab) {
    relLimparAsteriscos(lab);
    if (val.getAttribute('data-crp-rel-treat') === '1') return;
    val.setAttribute('data-crp-rel-treat', '1');

    var texto = relVal(val);
    if (val.querySelector('.containerFormFileLink') || val.querySelector('[data-fieldformat="FILE"]')) {
      val.classList.add('crp-rel-file');
    }

    if (!val.querySelector('table, img')) {
      var m = texto.match(/^(https?:\/\/|www\.)\S+$/i);
      if (m && !val.querySelector('a[href], .crp-rel-url-wrap')) {
        var href = /^www\./i.test(texto) ? 'https://' + texto : texto;
        var wrap = el('span', 'crp-rel-url-wrap');
        var a = el('a', 'crp-rel-url');
        a.href = href; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = 'Abrir ↗';
        var host = '';
        try { host = new URL(href).hostname.replace(/^www\./, ''); } catch (e) {}
        wrap.appendChild(a);
        if (host) wrap.appendChild(el('span', 'crp-rel-url-dom', host));
        val.textContent = '';
        val.appendChild(wrap);
      }
    }

    if (texto.length > 180 && !val.querySelector('table, img, .crp-rel-mais')) {
      var box = el('span', 'crp-rel-longtext');
      while (val.firstChild) box.appendChild(val.firstChild);
      val.appendChild(box);
      val.classList.add('crp-rel-long');
      var b = el('button', 'crp-rel-mais');
      b.type = 'button';
      b.textContent = 'ver mais';
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function () {
        var ex = val.classList.toggle('crp-rel-expanded');
        b.textContent = ex ? 'ver menos' : 'ver mais';
        b.setAttribute('aria-expanded', String(ex));
      });
      val.appendChild(b);
    }
  }

  function relSecoes() {
    var form = document.getElementById('PanelForm');
    if (!form) return [];
    var list = [];
    toArr(form.querySelectorAll('table.form')).forEach(function (tbl, idx) {
      var gtd = tbl.querySelector('tbody > tr.group > td.group') || tbl.querySelector('tbody > tr.group > td');
      var title = txt(tbl.querySelector('.crp-sec-label')) || txt(gtd) || ('Seção ' + (idx + 1));
      var slug = relSlug(title) || ('secao-' + (idx + 1));
      var anchorId = 'crp-rel-sec-' + slug;
      var anchor = document.getElementById(anchorId);
      if (!anchor) {
        anchor = el('span', 'crp-rel-anchor');
        anchor.id = anchorId;
        if (tbl.parentNode) tbl.parentNode.insertBefore(anchor, tbl);
      }

      var campos = 0, preenchidos = 0;
      toArr(tbl.querySelectorAll('tbody > tr')).forEach(function (tr) {
        if (tr.classList.contains('group')) return;
        var tds = toArr(tr.children);
        if (tds.length < 2 || !tds[1] || !tds[0]) return;
        campos++;
        var ok = relPreenchido(tds[1]);
        if (ok) preenchidos++;
        relTratarValor(tds[1], tds[0]);
        tr.setAttribute('data-crp-rel-campo', '1');
        if (!ok) {
          if (!relZeevOculto(tr)) {
            tr.setAttribute('data-crp-rel-empty', '1');
            tr.setAttribute('data-crp-rel-dash-src', txt(tds[1]));
          }
        } else {
          tr.removeAttribute('data-crp-rel-empty');
          tr.classList.remove(REL.hidden);
        }
      });

      var vazios = campos - preenchidos;
      var secVazia = campos > 0 && preenchidos === 0;
      if (secVazia && !relZeevOculto(tbl)) {
        tbl.setAttribute('data-crp-rel-empty', '1');
      } else {
        tbl.removeAttribute('data-crp-rel-empty');
        tbl.classList.remove(REL.hidden);
      }

      var badge = tbl.querySelector('.crp-sec-count');
      if (badge) badge.textContent = preenchidos + ' de ' + campos + ' preenchidos';

      // Rodapé: uma única linha DENTRO da seção (tbody), nunca com 0.
      var foot = tbl.querySelector('tr.crp-rel-footrow');
      if (!foot) {
        foot = el('tr', 'crp-rel-footrow');
        var ft = el('td');
        ft.colSpan = 2;
        foot.appendChild(ft);
        var tb = tbl.tBodies[0];
        if (tb) tb.appendChild(foot);
      }
      foot.setAttribute('data-crp-rel-foot', '1');
      foot.setAttribute('data-crp-rel-count', String(vazios));
      if (foot.firstElementChild) {
        foot.firstElementChild.textContent = vazios + (vazios === 1 ? ' campo vazio oculto' : ' campos vazios ocultos');
      }

      // Multivaloradas: ficam na seção; sem registros, ocultas (ou "Nenhum item"
      // quando o toggle de vazios está ligado).
      toArr(tbl.querySelectorAll('table[mult="S"]')).forEach(function (m) {
        var tem = toArr(m.querySelectorAll('tbody > tr')).some(function (tr) {
          if (tr.classList.contains('header') || tr.classList.contains('template') || tr.hidden) return false;
          if (getComputedStyle(tr).display === 'none') return false;
          return !!txt(tr);
        });
        var note = m.parentNode && m.parentNode.querySelector('.crp-rel-mult-note');
        if (tem) {
          m.removeAttribute('data-crp-rel-empty');
          m.classList.remove(REL.hidden);
          if (note) note.remove();
        } else {
          m.setAttribute('data-crp-rel-empty', '1');
          if (!note && m.parentNode) {
            note = el('div', 'crp-rel-mult-note', 'Nenhum item');
            note.setAttribute('data-crp-rel-empty', '1');
            m.parentNode.insertBefore(note, m.nextSibling);
          }
        }
      });

      list.push({ tbl: tbl, title: title, slug: slug, anchorId: anchorId, campos: campos, preenchidos: preenchidos, vazia: secVazia, vazios: vazios });
    });
    return list;
  }

  function relAplicarVazios(secs) {
    var show = relMostrarVazios();
    toArr(document.querySelectorAll('[data-crp-rel-empty="1"]:not([data-crp-rel-foot])')).forEach(function (n) {
      if (n.hasAttribute('data-crp-rel-zeev-hidden')) return;
      n.classList.toggle(REL.hidden, !show);
    });
    // Rodapé "N vazios ocultos": só quando o toggle está DESLIGADO e há vazios.
    toArr(document.querySelectorAll('[data-crp-rel-foot]')).forEach(function (f) {
      var n = parseInt(f.getAttribute('data-crp-rel-count') || '0', 10);
      f.hidden = show || !n;
    });
    // O "—" cinza dos vazios vem do marcador existente (crp-val-empty),
    // reavaliado após o Zeev preencher os valores.
    if (typeof markEmptyValues === 'function') markEmptyValues();
    relChips(secs);
    relBanner(secs);
  }

  /* ---------- Busca nos dados do formulário (aba Geral) ---------- */
  var relSearchState = {
    active: false, norm: '', raw: '', idx: -1, results: [], prev: null,
    index: null, dirty: true, timer: 0, applying: false, ui: null, secCount: 0, printTerm: ''
  };

  function relNorm(s) {
    var v = String(s || '');
    if (v.normalize) v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return v.toLowerCase().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function relDigits(s) { return String(s || '').replace(/\D+/g, ''); }

  function relSearchHidden(tr) {
    if (!tr) return true;
    if (tr.hidden || (tr.style && tr.style.display === 'none')) return true;
    var n = tr;
    for (var i = 0; i < 4 && n && n.nodeType === 1; i++) {
      if (n.hasAttribute('hidden') || (n.style && n.style.display === 'none')) return true;
      n = n.parentElement;
    }
    return false;
  }

  function relSearchIndexBuild() {
    var form = document.getElementById('PanelForm');
    var secs = [];
    if (form) {
      toArr(form.querySelectorAll('table.form')).forEach(function (tbl) {
        var title = txt(tbl.querySelector('.crp-sec-label'));
        var fields = [];
        var secRows = tbl.tBodies[0] ? toArr(tbl.tBodies[0].children) : toArr(tbl.querySelectorAll('tbody > tr'));
        secRows.forEach(function (tr) {
          if (tr.classList.contains('group') || tr.classList.contains('crp-rel-footrow')) return;
          if (relSearchHidden(tr)) return;
          var tds = toArr(tr.children);
          if (tds.length < 2) return;
          var label = txt(tds[0]);
          if (!label) return;
          var hiddenVals = toArr(tds[1].querySelectorAll('input')).map(function (i) { return i.value; }).filter(Boolean);
          var value = txt(tds[1]) + ' ' + hiddenVals.join(' ');
          var files = toArr(tds[1].querySelectorAll('a')).map(function (a) { return txt(a); }).filter(Boolean);
          var tables = toArr(tds[1].querySelectorAll('table[mult="S"]')).map(function (mt) {
            var trows = mt.tBodies[0] ? toArr(mt.tBodies[0].children) : toArr(mt.querySelectorAll('tbody > tr'));
            var rows = trows.filter(function (r2) {
              if (r2.classList.contains('header') || r2.classList.contains('template')) return false;
              return !relSearchHidden(r2);
            }).map(function (r2) { return { tr: r2, text: txt(r2) }; });
            return { tbl: mt, rows: rows };
          });
          fields.push({
            tr: tr, tdLabel: tds[0], tdVal: tds[1],
            label: label, value: value, files: files, tables: tables,
            nl: relNorm(label), nv: relNorm(value + ' ' + files.join(' ')),
            nd: relDigits(value + ' ' + files.join(' '))
          });
        });
        var usadas = [];
        fields.forEach(function (f) { f.tables.forEach(function (t) { usadas.push(t.tbl); }); });
        toArr(tbl.querySelectorAll('table[mult="S"]')).forEach(function (mt) {
          if (usadas.indexOf(mt) >= 0) return;
          if (!mt.getClientRects().length) return;
          var trows = mt.tBodies[0] ? toArr(mt.tBodies[0].children) : toArr(mt.querySelectorAll('tbody > tr'));
          var rows = trows.filter(function (r2) {
            if (r2.classList.contains('header') || r2.classList.contains('template')) return false;
            return !relSearchHidden(r2);
          }).map(function (r2) { return { tr: r2, text: txt(r2) }; });
          if (!rows.length) return;
          var cap = txt(mt.querySelector('caption')) || 'Tabela';
          var holder = mt.closest('tr') || mt.closest('td') || mt;
          var valEl = mt.closest('td') || mt;
          fields.push({
            tr: holder, tdLabel: null, tdVal: valEl,
            label: cap, value: txt(mt), files: [], tables: [{ tbl: mt, rows: rows }],
            nl: relNorm(cap), nv: relNorm(txt(mt)), nd: relDigits(txt(mt))
          });
        });
        secs.push({ tbl: tbl, title: title, titleNorm: relNorm(title), badge: tbl.querySelector('.crp-sec-count'), fields: fields });
      });
    }
    relSearchState.index = secs;
    relSearchState.dirty = false;
    return secs;
  }

  function relSearchClearMarks() {
    toArr(document.querySelectorAll('.crp-rel-busca-oculto, .crp-busca-campo, .crp-busca-atual, .crp-busca-secao, .crp-busca-linha, .crp-search-empty, .crp-busca-fallback, .crp-search-hide, .crp-search-hit, .crp-search-current')).forEach(function (n) {
      n.classList.remove('crp-rel-busca-oculto');
      n.classList.remove('crp-busca-campo');
      n.classList.remove('crp-busca-atual');
      n.classList.remove('crp-busca-secao');
      n.classList.remove('crp-busca-linha');
      n.classList.remove('crp-search-empty');
      n.classList.remove('crp-busca-fallback');
      n.classList.remove('crp-search-hide');
      n.classList.remove('crp-search-hit');
      n.classList.remove('crp-search-current');
    });
    toArr(document.querySelectorAll('.crp-sec-count[data-crp-orig]')).forEach(function (b) {
      b.textContent = b.getAttribute('data-crp-orig');
    });
  }

  function relSearchHighlightClear() {
    if (window.CSS && CSS.highlights) { try { CSS.highlights.delete('crp-search'); } catch (e) {} }
    toArr(document.querySelectorAll('.crp-busca-fallback')).forEach(function (n) { n.classList.remove('crp-busca-fallback'); });
  }

  function relSearchTextNodes(root, term, ranges) {
    if (!root || !term) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (p && p.closest('script,style,noscript,.crp-rel-oculto')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      var s = node.nodeValue, map = '', idx = [], lastSpace = true;
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        var nc = ch.normalize ? ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : ch.toLowerCase();
        if (/\s/.test(nc)) { if (lastSpace) continue; nc = ' '; lastSpace = true; } else { lastSpace = false; }
        for (var j = 0; j < nc.length; j++) { map += nc.charAt(j); idx.push(i); }
      }
      var p = 0;
      while ((p = map.indexOf(term, p)) >= 0) {
        var a = idx[p], b = idx[p + term.length - 1];
        if (a != null && b != null) {
          try {
            var range = document.createRange();
            range.setStart(node, a);
            range.setEnd(node, b + 1);
            ranges.push(range);
          } catch (e) {}
        }
        p += term.length;
      }
    }
  }

  function relSearchHighlight(term) {
    relSearchHighlightClear();
    if (!relSearchState.results.length) return;
    var can = !!(window.CSS && CSS.highlights && window.Highlight);
    if (!can) {
      relSearchState.results.forEach(function (r) {
        (r.kind === 'section' ? r.sec.tbl : r.field.tr).classList.add('crp-busca-fallback');
      });
      return;
    }
    var ranges = [];
    (relSearchState.index || []).forEach(function (sec) {
      if (sec.tbl.classList.contains('crp-rel-busca-oculto')) return;
      relSearchTextNodes(sec.tbl, term, ranges);
    });
    if (ranges.length) { try { CSS.highlights.set('crp-search', new Highlight(...ranges)); } catch (e) {} }
  }

  function relSearchUpdateUI() {
    var ui = relSearchState.ui;
    if (!ui) return;
    var n = relSearchState.results.length;
    ui.count.textContent = n ? (relSearchState.idx + 1) + ' de ' + n : 'Nenhum resultado';
    ui.count.title = 'em ' + (relSearchState.secCount || 0) + ' seções';
    ui.box.classList.toggle('is-empty', n === 0);
    ui.prev.disabled = !n;
    ui.next.disabled = !n;
    if (relSearchState.active) {
      ui.resumo.hidden = false;
      var raw = relSearchState.raw || '';
      ui.resumoTxt.textContent = relSearchState.secCount
        ? relSearchState.secCount + (relSearchState.secCount === 1 ? ' seção com ' : ' seções com ') + '"' + raw + '"'
        : 'Nenhuma seção com "' + raw + '"';
      if (ui.vazio) {
        var sem = n === 0;
        ui.vazio.hidden = !sem;
        if (sem) ui.vazioTxt.textContent = 'Nenhum dado com "' + raw + '"';
      }
    } else {
      ui.resumo.hidden = true;
      if (ui.vazio) ui.vazio.hidden = true;
    }
  }

  function relSearchMarkCurrent() {
    toArr(document.querySelectorAll('.crp-busca-atual')).forEach(function (n) { n.classList.remove('crp-busca-atual'); });
    var r = relSearchState.results[relSearchState.idx];
    if (r) (r.kind === 'section' ? r.sec.tbl : r.field.tr).classList.add('crp-busca-atual');
  }

  function relSearchNav(dir, silent) {
    if (!relSearchState.results.length) return;
    var n = relSearchState.results.length;
    relSearchState.idx = (relSearchState.idx + dir + n) % n;
    relSearchMarkCurrent();
    relSearchUpdateUI();
    if (!silent) {
      var r = relSearchState.results[relSearchState.idx];
      var alvo = r.kind === 'section' ? (r.sec.tbl.querySelector('tr.group > td') || r.sec.tbl) : r.field.tr;
      alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function relSearchClear(silent) {
    clearTimeout(relSearchState.timer);
    relSearchState.applying = true;
    try {
      relSearchClearMarks();
      document.body.classList.remove('crp-searching');
      var prev = relSearchState.prev;
      if (prev && typeof prev.toggle === 'boolean') {
        relSetMostrarVazios(prev.toggle);
        var tg = document.getElementById('crp-rel-toggle');
        if (tg) tg.setAttribute('aria-pressed', prev.toggle ? 'true' : 'false');
      }
      if (prev && prev.collapsed) {
        prev.collapsed.forEach(function (t) {
          t.classList.add('crp-collapsed');
          var h = t.querySelector('tr.group > td[data-crp-acc]') || t.querySelector('tr.group > td');
          if (h) h.setAttribute('aria-expanded', 'false');
        });
      }
      relSearchState.active = false;
      relSearchState.prev = null;
      relSearchState.results = [];
      relSearchState.idx = -1;
      relSearchState.norm = '';
      relSearchState.raw = '';
      relSearchState.secCount = 0;
      if (typeof relAplicarVazios === 'function' && relSecoesAtuais && relSecoesAtuais.length) relAplicarVazios(relSecoesAtuais);
      relSearchHighlightClear();
      var ui = relSearchState.ui;
      if (ui) {
        if (!silent) ui.input.value = '';
        ui.box.classList.remove('has-value');
        ui.box.classList.remove('is-empty');
        ui.hint.hidden = !!ui.input.value;
        ui.tools.hidden = !ui.input.value;
        ui.count.textContent = '';
        ui.count.title = '';
        ui.prev.disabled = true;
        ui.next.disabled = true;
        ui.resumo.hidden = true;
        if (ui.vazio) ui.vazio.hidden = true;
      }
      if (!silent && prev && typeof prev.scrollY === 'number') {
        window.scrollTo(0, prev.scrollY);
        requestAnimationFrame(function () { window.scrollTo(0, prev.scrollY); });
        setTimeout(function () { window.scrollTo(0, prev.scrollY); }, 60);
      }
      if (typeof relBanner === 'function' && relSecoesAtuais) relBanner(relSecoesAtuais);
    } finally {
      setTimeout(function () { relSearchState.applying = false; }, 80);
    }
  }

  function relSearchShort() {
    var ui = relSearchState.ui;
    var v = ui ? ui.input.value : '';
    if (relSearchState.active) relSearchClear(true);
    if (ui) {
      ui.input.value = v;
      ui.box.classList.toggle('has-value', !!v);
      ui.hint.hidden = !!v;
      ui.tools.hidden = !v;
      if (!v) { ui.count.textContent = ''; ui.count.title = ''; }
    }
  }

  function relSearchApply(termNorm) {
    termNorm = relNorm(termNorm);
    if (termNorm.length < 2) { relSearchShort(); return; }
    relSearchState.applying = true;
    clearTimeout(relSearchState.timer);
    try {
      relSearchClearMarks();
      if (!relSearchState.active) {
        relSearchState.active = true;
        relSearchState.prev = {
          toggle: relMostrarVazios(),
          scrollY: window.scrollY,
          collapsed: toArr(document.querySelectorAll('#PanelForm table.form.crp-collapsed'))
        };
        document.body.classList.add('crp-searching');
      }
      if (typeof relAplicarVazios === 'function' && relSecoesAtuais && relSecoesAtuais.length) relAplicarVazios(relSecoesAtuais);
      if (relSearchState.dirty || !relSearchState.index) relSearchIndexBuild();

      var digits = relDigits(termNorm);
      var raw = relSearchState.ui ? relSearchState.ui.input.value.trim() : termNorm;
      relSearchState.norm = termNorm;
      relSearchState.raw = raw;
      var results = [], secCount = 0;

      (relSearchState.index || []).forEach(function (sec) {
        var fieldHits = [];
        sec.fields.forEach(function (f) {
          var labelHit = f.nl.indexOf(termNorm) >= 0;
          var valueHit = f.nv.indexOf(termNorm) >= 0 || (digits.length >= 3 && f.nd.indexOf(digits) >= 0);
          var fileHit = f.files.some(function (name) { return relNorm(name).indexOf(termNorm) >= 0; });
          var rowMatches = [];
          f.tables.forEach(function (t) {
            t.rows.forEach(function (r) {
              var rn = relNorm(r.text), rd = relDigits(r.text);
              if (rn.indexOf(termNorm) >= 0 || (digits.length >= 3 && rd.indexOf(digits) >= 0)) rowMatches.push(r.tr);
            });
          });
          if (!(labelHit || valueHit || fileHit || rowMatches.length)) return;
          f.tr.classList.add('crp-busca-campo');
          rowMatches.forEach(function (tr) { tr.classList.add('crp-busca-linha'); });
          if (f.tr.getAttribute('data-crp-rel-empty') === '1' && labelHit) {
            f.tr.classList.remove(REL.hidden);
            if (!f.tdVal.classList.contains('crp-val-empty') && !f.tdVal.querySelector('[data-crp-mask]')) {
              f.tdVal.classList.add('crp-search-empty');
            }
          }
          fieldHits.push(f);
        });
        var titleHit = sec.titleNorm.indexOf(termNorm) >= 0;
        var show = fieldHits.length > 0 || titleHit;
        sec.tbl.classList.toggle('crp-rel-busca-oculto', !show);
        if (!show) return;
        secCount++;
        if (sec.badge) {
          if (!sec.badge.hasAttribute('data-crp-orig')) sec.badge.setAttribute('data-crp-orig', sec.badge.textContent);
          var q = fieldHits.length || 1;
          sec.badge.textContent = q + ' resultado' + (q === 1 ? '' : 's');
        }
        if (sec.tbl.classList.contains('crp-collapsed')) {
          sec.tbl.classList.remove('crp-collapsed');
          var h = sec.tbl.querySelector('tr.group > td[data-crp-acc]') || sec.tbl.querySelector('tr.group > td');
          if (h) h.setAttribute('aria-expanded', 'true');
        }
        if (titleHit && !fieldHits.length) sec.tbl.classList.add('crp-busca-secao');
        fieldHits.forEach(function (f) {
          results.push({ kind: 'field', sec: sec, field: f, el: f.tr });
        });
        if (titleHit && !fieldHits.length) results.push({ kind: 'section', sec: sec, el: sec.tbl });
      });

      relSearchState.secCount = secCount;
      relSearchState.results = results;
      relSearchState.idx = results.length ? 0 : -1;
      var note = document.getElementById('crp-rel-emptynote');
      if (note) note.hidden = true;
      relSearchMarkCurrent();
      relSearchUpdateUI();
      relSearchHighlight(termNorm);
      var bar = document.querySelector('.crp-rel-bar');
      var off = bar ? Math.round(bar.offsetHeight + 64) : 96;
      document.documentElement.style.setProperty('--crp-busca-offset', off + 'px');
    } finally {
      setTimeout(function () { relSearchState.applying = false; }, 80);
    }
  }

  function relSearchMount(bar, geral) {
    if (document.getElementById('crp-rel-search-input')) return;
    var box = el('div', 'crp-rel-search');
    var label = el('label', 'crp-rel-sr', 'Pesquisar nos dados do formulário');
    label.setAttribute('for', 'crp-rel-search-input');
    box.appendChild(label);
    box.appendChild(el('span', 'crp-rel-search-ico'));
    var input = el('input', 'crp-rel-search-input');
    input.id = 'crp-rel-search-input';
    input.type = 'search';
    input.placeholder = 'Pesquisar nos dados do formulário…';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Pesquisar nos dados do formulário');
    box.appendChild(input);
    var hint = el('span', 'crp-rel-search-hint', 'Ctrl+K');
    box.appendChild(hint);
    var tools = el('div', 'crp-rel-search-tools');
    tools.hidden = true;
    var count = el('span', 'crp-rel-search-count');
    count.setAttribute('aria-live', 'polite');
    var prev = el('button', 'crp-rel-search-nav', '⌃');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Resultado anterior');
    var next = el('button', 'crp-rel-search-nav', '⌄');
    next.type = 'button';
    next.setAttribute('aria-label', 'Próximo resultado');
    var clear = el('button', 'crp-rel-search-clear', '✕');
    clear.type = 'button';
    clear.setAttribute('aria-label', 'Limpar pesquisa');
    tools.appendChild(count);
    tools.appendChild(prev);
    tools.appendChild(next);
    tools.appendChild(clear);
    box.appendChild(tools);
    bar.appendChild(box);

    var resumo = el('div', 'crp-rel-busca-resumo');
    resumo.hidden = true;
    resumo.setAttribute('aria-live', 'polite');
    var resumoTxt = el('span', 'crp-rel-busca-resumo-txt');
    resumo.appendChild(resumoTxt);
    var limpar = el('button', 'crp-rel-busca-limpar', 'Limpar pesquisa');
    limpar.type = 'button';
    resumo.appendChild(limpar);
    var note = document.getElementById('crp-rel-emptynote');
    if (note) geral.insertBefore(resumo, note.nextSibling);
    else geral.insertBefore(resumo, bar.nextSibling);

    var vazio = el('div', 'crp-rel-busca-vazio');
    vazio.hidden = true;
    var vazioTxt = el('div', 'crp-rel-busca-vazio-txt');
    vazio.appendChild(vazioTxt);
    var vazioBtn = el('button', 'crp-rel-busca-limpar', 'Limpar pesquisa');
    vazioBtn.type = 'button';
    vazio.appendChild(vazioBtn);
    geral.insertBefore(vazio, resumo.nextSibling);

    relSearchState.ui = { box: box, input: input, hint: hint, tools: tools, count: count, prev: prev, next: next, clear: clear, resumo: resumo, resumoTxt: resumoTxt, vazio: vazio, vazioTxt: vazioTxt };

    input.addEventListener('input', function () {
      var has = !!input.value;
      box.classList.toggle('has-value', has);
      hint.hidden = has;
      tools.hidden = !has;
      if (!has) { relSearchClear(); return; }
      var term = relNorm(input.value);
      if (term.length < 2) { relSearchShort(); return; }
      clearTimeout(relSearchState.timer);
      relSearchState.timer = setTimeout(function () { relSearchApply(term); }, 150);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); relSearchNav(e.shiftKey ? -1 : 1); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); relSearchClear(); }
    });
    clear.addEventListener('click', function () { relSearchClear(); input.focus(); });
    prev.addEventListener('click', function () { relSearchNav(-1); });
    next.addEventListener('click', function () { relSearchNav(1); });
    limpar.addEventListener('click', function () { relSearchClear(); input.focus(); });
    vazioBtn.addEventListener('click', function () { relSearchClear(); input.focus(); });

    if (document.body.getAttribute('data-crp-search-keys') !== '1') {
      document.body.setAttribute('data-crp-search-keys', '1');
      document.addEventListener('keydown', function (e) {
        var t = e.target;
        var tag = (t && t.tagName || '').toLowerCase();
        var typing = /input|textarea|select/.test(tag) || (t && t.isContentEditable);
        if (!relIsMobile() && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'k' || e.key === 'K')) {
          e.preventDefault();
          var i = document.getElementById('crp-rel-search-input');
          if (i) { i.focus(); i.select(); }
          return;
        }
        if (!relIsMobile() && e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          var j = document.getElementById('crp-rel-search-input');
          if (j) j.focus();
          return;
        }
        if (e.key === 'Escape') {
          var k = document.getElementById('crp-rel-search-input');
          if (relSearchState.active || (k && document.activeElement === k)) {
            e.preventDefault();
            relSearchClear();
            if (k) k.blur();
          }
        }
      });
    }
    if (document.body.getAttribute('data-crp-search-print') !== '1') {
      document.body.setAttribute('data-crp-search-print', '1');
      window.addEventListener('beforeprint', function () {
        if (!relSearchState.active) return;
        relSearchState.printTerm = relSearchState.raw;
        relSearchClear(true);
      });
      window.addEventListener('afterprint', function () {
        var t = relSearchState.printTerm;
        if (!t) return;
        relSearchState.printTerm = '';
        if (relSearchState.ui) {
          relSearchState.ui.input.value = t;
          relSearchState.ui.box.classList.add('has-value');
          relSearchState.ui.hint.hidden = true;
          relSearchState.ui.tools.hidden = false;
        }
        relSearchApply(t);
      });
    }
  }

  function relBar() {
    var geral = document.getElementById('crp-panel-geral');
    if (!geral) return null;
    var bar = geral.querySelector('.crp-rel-bar');
    if (bar) return bar;
    bar = el('div', 'crp-rel-bar');
    bar.id = 'crp-rel-bar';

    var sel = el('select', 'crp-rel-goto');
    sel.id = 'crp-rel-goto';
    sel.setAttribute('aria-label', 'Ir para seção');
    sel.title = 'Ir para seção';
    var first = document.createElement('option');
    first.value = '';
    first.textContent = 'Ir para seção';
    sel.appendChild(first);
    sel.addEventListener('change', function () {
      var op = sel.options[sel.selectedIndex];
      sel.title = op && op.value ? (op.title || op.textContent) : 'Ir para seção';
      if (!sel.value) return;
      var alvo = document.getElementById(sel.value);
      if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      sel.value = '';
    });
    bar.appendChild(sel);
    geral.insertBefore(bar, geral.firstChild);

    var note = el('div', 'crp-rel-emptynote');
    note.id = 'crp-rel-emptynote';
    note.hidden = true;
    var noteTxt = el('span', 'crp-rel-emptynote-text');
    note.appendChild(noteTxt);
    var show = el('button', 'crp-rel-emptynote-show', 'Mostrar');
    show.type = 'button';
    show.addEventListener('click', function () {
      relSetMostrarVazios(true);
      var t = document.getElementById('crp-rel-toggle');
      if (t) t.setAttribute('aria-pressed', 'true');
      relAplicarVazios(relSecoesAtuais);
      if (relSearchState.active && relSearchState.norm) relSearchApply(relSearchState.norm);
    });
    note.appendChild(show);
    geral.insertBefore(note, bar.nextSibling);

    relSearchMount(bar, geral);

    var toggle = el('button', 'crp-rel-toggle');
    toggle.type = 'button';
    toggle.id = 'crp-rel-toggle';
    toggle.setAttribute('aria-pressed', relMostrarVazios() ? 'true' : 'false');
    toggle.appendChild(el('span', 'crp-rel-switch'));
    toggle.appendChild(el('span', 'crp-rel-toggle-txt', 'Campos vazios'));
    toggle.addEventListener('click', function () {
      var v = !relMostrarVazios();
      relSetMostrarVazios(v);
      toggle.setAttribute('aria-pressed', v ? 'true' : 'false');
      relAplicarVazios(relSecoesAtuais);
      if (relSearchState.active && relSearchState.norm) relSearchApply(relSearchState.norm);
    });
    bar.appendChild(toggle);
    return bar;
  }

  function relChips(secs) {
    var sel = document.getElementById('crp-rel-goto');
    if (!sel || !secs) return;
    var atual = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    var visiveis = secs.filter(function (s) { return relMostrarVazios() ? true : !s.vazia; });
    visiveis.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.anchorId;
      o.textContent = s.title + ' (' + s.preenchidos + '/' + s.campos + ')';
      o.title = s.title;
      sel.appendChild(o);
    });
    if (atual) sel.value = atual;
  }

  function relBanner(secs) {
    var note = document.getElementById('crp-rel-emptynote');
    if (!note || !secs) return;
    var n = secs.filter(function (s) { return s.vazia; }).length;
    note.hidden = n === 0 || relMostrarVazios() || relSearchState.active;
    var t = note.querySelector('.crp-rel-emptynote-text');
    if (t) t.textContent = n + (n === 1 ? ' seção vazia oculta' : ' seções vazias ocultas');
  }

  function relDestaques(secs) {
    var host = document.querySelector('.crp-rel-highlights');
    if (!host) {
      host = el('div', 'crp-rel-highlights');
      var bar = document.querySelector('.crp-rel-bar');
      if (!bar) return;
      bar.parentNode.insertBefore(host, bar);
    }
    host.innerHTML = '';
    if (!REL.highlightsEnabled) { host.hidden = true; return; }
    var achados = [];
    toArr(document.querySelectorAll('#PanelForm table.form tbody > tr[data-crp-rel-campo="1"]')).forEach(function (tr) {
      var tds = toArr(tr.children);
      if (tds.length < 2) return;
      var label = txt(tds[0]).replace(/\s+/g, ' ').trim();
      if (!relPreenchido(tds[1])) return;
      var val = relVal(tds[1]);
      var regra = REL.rules.find(function (r) { return r.re.test(label); });
      if (!regra) return;
      if (achados.some(function (a) { return a.key === regra.key; })) return;
      achados.push({ key: regra.key, label: label, value: val });
    });
    achados = achados.slice(0, REL.maxHighlights);
    host.hidden = achados.length === 0;
    achados.forEach(function (a) {
      var chip = el('span', 'crp-rel-hl');
      chip.appendChild(el('span', 'crp-rel-hl-label', a.label));
      chip.appendChild(el('span', 'crp-rel-hl-value', a.value.length > 60 ? a.value.slice(0, 57) + '…' : a.value));
      host.appendChild(chip);
    });
  }

  function relStepCols(t) {
    var cols = { task: 0, start: 1, end: 2, status: 4, resp: 5 };
    var rows = toArr(t.querySelectorAll('tr'));
    var head = rows.find(function (tr) {
      var s = txt(tr).toLowerCase();
      return /tarefa|atividade/.test(s) && /status|situa/.test(s);
    });
    if (head) {
      toArr(head.children).forEach(function (c, i) {
        var s = txt(c).toLowerCase();
        if (/tarefa|atividade/.test(s)) cols.task = i;
        else if (/in[ií]cio/.test(s)) cols.start = i;
        else if (/conclus/.test(s)) cols.end = i;
        else if (/status|situa/.test(s)) cols.status = i;
        else if (/respons/.test(s)) cols.resp = i;
      });
    }
    return cols;
  }

  function relStatus(t) {
    var s = String(t || '').toLowerCase();
    if (/cancel/.test(s)) return { cls: 'cancelada', label: 'Cancelada' };
    if (/conclu|fechad|finaliz/.test(s)) return { cls: 'concluida', label: 'Concluída' };
    if (/andamento|execu|atual|em curso|abert/.test(s)) return { cls: 'andamento', label: 'Em andamento' };
    return { cls: 'neutro', label: String(t || '—').trim() || '—' };
  }

  function relStepsData() {
    var t = document.getElementById('TableStep');
    if (!t) return [];
    var cols = relStepCols(t);
    return toArr(t.querySelectorAll('tbody > tr')).filter(function (tr) {
      return !isStepHead(tr) && tr.children.length > 2 && txt(tr);
    }).map(function (tr) {
      var c = function (i) { return tr.children[i] ? txt(tr.children[i]) : ''; };
      var respCell = tr.children[cols.resp];
      var respRaw = txt(respCell);
      var email = '';
      var m = respRaw.match(/[\w.+-]+@[\w.-]+\.\w+/);
      if (m) email = m[0];
      var people = relParsePeople(respCell, email);
      var executor = relFindExecutor(respCell, people);

      // Título × instruções: o que vier depois da 1ª linha (ou em .task-desc)
      // é descrição recolhível. Critério genérico, sem nome de fluxo.
      var taskCell = tr.children[cols.task];
      var taskText = txt(taskCell);
      var descEl = taskCell && taskCell.querySelector('.task-desc');
      var desc = descEl ? txt(descEl) : '';
      var title = taskText;
      if (desc) {
        title = taskText.replace(desc, '').trim();
      } else {
        var lines = taskText.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        if (lines.length > 1) { title = lines[0]; desc = lines.slice(1).join('\n'); }
      }

      // "Título NOME | Empresa | CLT | Início: ..." → título + subtítulo cinza.
      var subtitle = '';
      var pp = String(title).split('|').map(function (s) { return s.trim(); }).filter(Boolean);
      if (pp.length > 1) { title = pp[0]; subtitle = pp.slice(1).join(' · '); }

      var end = c(cols.end);
      var stRaw = c(cols.status);
      // Aberta = qualquer status que não seja terminal (Concluído, Aprovado,
      // Cancelado, Reprovado, Encerrado...). Status vazio: aberta se sem conclusão.
      var terminal = /conclu|finaliz|cancel|reprov|recus|encerr|complet|aprovad|closed|done/i.test(stRaw);
      var open = !terminal;
      var endStamp = parseStamp(end);
      var subLink = tr.querySelector('td:first-child a[href*="wfrel_tracker_detail"]') || tr.querySelector('a[href*="wfrel_tracker_detail"]');
      var formLink = tr.querySelector('a[href*="wfrel_tracker_form_detail"]') || tr.querySelector('td:last-child a[data-colorbox]');
      var detailEl = subLink || formLink || null;
      var detailSub = !!subLink;
      var detailNewTab = !!(detailEl && (detailEl.getAttribute('target') === '_blank' || /wfrel_tracker_detail/i.test(detailEl.getAttribute('href') || '')));
      return {
        task: title || taskText,
        desc: desc,
        subtitle: subtitle,
        start: c(cols.start),
        end: end,
        statusRaw: c(cols.status),
        status: relStatus(c(cols.status)),
        resp: respRaw,
        email: email,
        people: people,
        executor: executor,
        detailEl: detailEl,
        detailSub: detailSub,
        detailNewTab: detailNewTab,
        open: open,
        late: open && endStamp !== null && endStamp < Date.now()
      };
    });
  }

  function relBadge(cls, text) {
    var b = el('span', 'crp-rel-badge crp-rel-' + cls);
    b.textContent = text;
    return b;
  }

  // Prazo com hora 00:00/00:00:0x é data pura (evita "00:00:01").
  function relPrazo(raw) {
    var s = String(raw || '').trim();
    var m = s.match(/^(.*?)\s+00:00(?::0\d)?$/);
    return m ? m[1] : s;
  }

  /* Responsável: e-mail por regex; antes = nome; depois = cargo; trecho final
     entre parênteses = empresa. Sem e-mail, o texto todo é o nome. */
  function relParseResp(raw, emailHint) {
    var s = String(raw || '').replace(/\s+/g, ' ').trim().replace(/^\s*[A-Z]{2}\s+/, '');
    if (!s) return { name: '', cargo: '', empresa: '', email: emailHint || '' };
    var email = emailHint || '';
    var m = s.match(/[\w.+-]+@[\w.-]+\.\w+/);
    if (!m) return { name: s, cargo: '', empresa: '', email: email };
    email = email || m[0];
    var before = s.slice(0, m.index).trim().replace(/[·,;-]\s*$/, '');
    var after = s.slice(m.index + m[0].length).trim().replace(/^[·,;-]\s*/, '');
    var empresa = '';
    var em = after.match(/\(([^)]+)\)\s*$/);
    if (em) { empresa = em[1].trim(); after = after.slice(0, em.index).trim(); }
    if (!empresa && /(S\.?\s*A\.?|LTDA|EIRELI|ME|EPP)\s*$/i.test(after)) { empresa = after; after = ''; }
    return { name: before || s, cargo: after, empresa: empresa, email: email };
  }

  function relNoSec(s) {
    return String(s || '').replace(/(\d{1,2}:\d{2}):\d{2}\b/g, '$1');
  }

  function relPersonFromUser(u) {
    var nameEl = u.querySelector('.user-content strong, .user-content .inline') || u.querySelector('strong');
    var name = nameEl ? txt(nameEl) : '';
    var email = '';
    var tails = [];
    toArr(u.querySelectorAll('.user-content .small')).forEach(function (s) {
      var t = txt(s);
      if (!t) return;
      var m = t.match(/[\w.+-]+@[\w.-]+\.\w+/);
      if (m && !email) { email = m[0]; return; }
      tails.push(t);
    });
    if (!name) {
      var p = relParseResp(txt(u), email);
      p.userid = u.getAttribute('userid') || '';
      return p;
    }
    var tail = tails.join(' ').replace(/\s+/g, ' ').trim();
    var cargo = '', empresa = '';
    var em = tail.match(/\(([^)]+)\)\s*$/);
    if (em) { empresa = em[1].trim(); tail = tail.slice(0, em.index).trim(); }
    if (!empresa && /(S\.?\s*A\.?|LTDA|EIRELI)\s*$/i.test(tail)) { empresa = tail; tail = ''; }
    cargo = tail;
    return { name: name, cargo: cargo, empresa: empresa, email: email, userid: u.getAttribute('userid') || '' };
  }

  /* Plano B: um e-mail = uma pessoa; descarta iniciais soltas de avatar. */
  function relPeopleFromText(raw) {
    var s = String(raw || '').replace(/\s+/g, ' ').trim();
    s = s.replace(/(^|\s)[A-Z]{2}(?=\s)/g, ' ');
    var emails = s.match(/[\w.+-]+@[\w.-]+\.\w+/g) || [];
    if (!emails.length) return [];
    if (emails.length === 1) {
      var p = relParseResp(s);
      return p.name ? [p] : [];
    }
    var out = [];
    var cursor = 0;
    for (var i = 0; i < emails.length; i++) {
      var email = emails[i];
      var pos = s.indexOf(email, cursor);
      if (pos < 0) continue;
      var before = s.slice(cursor, pos).trim();
      var nextPos = i + 1 < emails.length ? s.indexOf(emails[i + 1], pos + email.length) : s.length;
      var after = s.slice(pos + email.length, nextPos).trim();
      var k = before.lastIndexOf(')');
      if (k >= 0) before = before.slice(k + 1).trim();
      before = before.replace(/(^|\s)[A-Z]{2}(?=\s)/g, ' ').trim();
      var cargo = after, empresa = '';
      var em = after.match(/^(.*?)\(([^)]+)\)/);
      if (em) { cargo = em[1].trim(); empresa = em[2].trim(); }
      else if (/(S\.?\s*A\.?|LTDA|EIRELI)\s*$/i.test(after)) { empresa = after; cargo = ''; }
      var cut = cargo.search(/\s[A-Z]{2}\s/);
      if (cut > 0) cargo = cargo.slice(0, cut).trim();
      if (before) out.push({ name: before, cargo: cargo, empresa: empresa, email: email, userid: '' });
      cursor = pos + email.length;
    }
    return out;
  }

  /* Estrutura: um bloco .user por pessoa. Fallback pelo texto. */
  function relParsePeople(respCell, emailHint) {
    var people = [];
    var seen = {};
    var add = function (p) {
      if (!p || !p.name) return;
      var key = String(p.userid || '') + '|' + String(p.email || '').toLowerCase() + '|' + p.name.toLowerCase();
      if (seen[key]) return;
      seen[key] = 1;
      people.push(p);
    };
    if (respCell) toArr(respCell.querySelectorAll('.user')).forEach(function (u) { add(relPersonFromUser(u)); });
    if (!people.length) {
      var textPeople = relPeopleFromText(respCell ? txt(respCell) : '');
      if (textPeople.length) textPeople.forEach(add);
      else {
        var p = relParseResp(respCell ? txt(respCell) : '', emailHint);
        if (p.name) add({ name: p.name, cargo: p.cargo, empresa: p.empresa, email: p.email || emailHint || '', userid: '' });
      }
    }
    return people;
  }

  function relFindExecutor(respCell, people) {
    if (!respCell || !people.length) return '';
    var marked = toArr(respCell.querySelectorAll('.user')).find(function (u) {
      return /(execut|done|conclu|finished|success)/i.test(String(u.className)) ||
        /(execut|conclu|finaliz)/i.test(u.getAttribute('title') || '');
    });
    if (marked) {
      var nameEl = marked.querySelector('.user-content strong, .user-content .inline') || marked.querySelector('strong');
      if (nameEl) return txt(nameEl);
    }
    var m = txt(respCell).match(/conclu[íi]d[oa]\s+por\s+([^,;|]+)/i);
    if (m) return m[1].trim();
    return '';
  }

  function relCargoLine(box, p) {
    var l2 = [p.cargo, p.empresa].filter(Boolean).join(' · ');
    if (l2) box.appendChild(el('div', 'crp-rel-resp-line2', l2));
  }

  function relPeopleExpand(box, people) {
    var btn = el('button', 'crp-rel-people-more', 'Ver todos');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    var list = el('div', 'crp-rel-people-list');
    list.hidden = true;
    people.forEach(function (p) {
      var row = el('div', 'crp-rel-people-row');
      row.appendChild(el('span', 'crp-rel-people-name', p.name));
      var det = [p.cargo, p.empresa].filter(Boolean).join(' · ');
      if (det) row.appendChild(el('span', 'crp-rel-people-det', ' · ' + det));
      if (p.email) row.title = p.email;
      list.appendChild(row);
    });
    btn.addEventListener('click', function () {
      list.hidden = !list.hidden;
      btn.textContent = list.hidden ? 'Ver todos' : 'Ocultar';
      btn.setAttribute('aria-expanded', list.hidden ? 'false' : 'true');
    });
    box.appendChild(btn);
    box.appendChild(list);
  }

  function relRespBlock(x) {
    var people = (x.people || []).slice(0);
    if (!people.length && x.resp) {
      var one = relParseResp(x.resp, x.email);
      if (one.name) people.push(one);
    }
    if (!people.length) return null;

    var wrap = el('div', 'crp-rel-tl-resp');
    var avs = el('div', 'crp-rel-avatars');
    people.slice(0, 3).forEach(function (p) {
      var av = el('span', 'crp-rel-avatar', initials(p.name));
      av.setAttribute('aria-hidden', 'true');
      if (p.email) av.title = p.email;
      avs.appendChild(av);
    });
    if (people.length > 3) avs.appendChild(el('span', 'crp-rel-avatar crp-rel-avatar-more', '+' + (people.length - 3)));
    wrap.appendChild(avs);

    var box = el('div', 'crp-rel-resp-text');

    if (x.open) {
      if (people.length === 1) {
        var lo1 = el('div', 'crp-rel-resp-line1');
        lo1.appendChild(document.createTextNode('Responsável: '));
        lo1.appendChild(el('span', 'crp-rel-resp-name', people[0].name));
        box.appendChild(lo1);
        relCargoLine(box, people[0]);
      } else {
        var lo = el('div', 'crp-rel-resp-line1');
        lo.appendChild(document.createTextNode('Responsáveis: '));
        lo.appendChild(el('span', 'crp-rel-resp-name', people[0].name));
        if (people.length === 2) {
          lo.appendChild(document.createTextNode(' e '));
          lo.appendChild(el('span', 'crp-rel-resp-name', people[1].name));
        } else {
          lo.appendChild(document.createTextNode(' e mais ' + (people.length - 1)));
        }
        box.appendChild(lo);
        relPeopleExpand(box, people);
      }
      wrap.appendChild(box);
      return wrap;
    }

    var exec = x.executor || '';
    var aprov = /aprov/i.test(x.statusRaw || '');
    var verb;
    if (exec) verb = aprov ? 'Aprovada por ' : (x.end ? 'Concluída em ' + relNoSec(x.end) + ' por ' : 'Concluída por ');
    else if (people.length === 1) verb = aprov ? 'Aprovada por ' : (x.end ? 'Concluída em ' + relNoSec(x.end) + ' por ' : 'Concluída por ');
    else verb = 'Responsáveis: ';

    if (exec && people.length > 1) {
      var lx = el('div', 'crp-rel-resp-line1');
      lx.appendChild(document.createTextNode(verb));
      lx.appendChild(el('span', 'crp-rel-resp-name', exec));
      box.appendChild(lx);
      var matched = people.filter(function (p) { return p.name.toLowerCase() === exec.toLowerCase(); }).length;
      var outros = Math.max(people.length - Math.max(matched, 1), 0);
      if (outros) box.appendChild(el('div', 'crp-rel-resp-line2', 'Atribuída também a ' + outros + ' pessoa' + (outros === 1 ? '' : 's')));
      relPeopleExpand(box, people);
    } else if (people.length === 1) {
      var l1 = el('div', 'crp-rel-resp-line1');
      l1.appendChild(document.createTextNode(verb));
      l1.appendChild(el('span', 'crp-rel-resp-name', people[0].name));
      box.appendChild(l1);
      relCargoLine(box, people[0]);
      if (people[0].email) wrap.title = people[0].email;
    } else if (people.length === 2) {
      var l2p = el('div', 'crp-rel-resp-line1');
      l2p.appendChild(document.createTextNode('Responsáveis: '));
      l2p.appendChild(el('span', 'crp-rel-resp-name', people[0].name));
      l2p.appendChild(document.createTextNode(' e '));
      l2p.appendChild(el('span', 'crp-rel-resp-name', people[1].name));
      box.appendChild(l2p);
      relPeopleExpand(box, people);
    } else {
      var lm = el('div', 'crp-rel-resp-line1');
      lm.appendChild(document.createTextNode('Responsáveis: '));
      lm.appendChild(el('span', 'crp-rel-resp-name', people[0].name));
      lm.appendChild(document.createTextNode(' e mais ' + (people.length - 1)));
      box.appendChild(lm);
      relPeopleExpand(box, people);
    }
    wrap.appendChild(box);
    return wrap;
  }

  function relSteps() {
    var step = document.getElementById('PanelStep');
    if (!step) return;
    var box = step.closest('.box.spaced') || step;
    var data = relStepsData();
    var abrir = data.filter(function (x) { return x.open; });
    var host = document.getElementById('crp-rel-steps');
    if (!host) {
      host = el('div', 'crp-rel-steps');
      host.id = 'crp-rel-steps';
      var head = box.querySelector('.box-header');
      if (head && head.nextSibling) box.insertBefore(host, head.nextSibling);
      else box.insertBefore(host, box.firstChild);
    }
    host.innerHTML = '';

    toArr(box.querySelectorAll('.crp-step-toolbar, .crp-table-wrap')).forEach(function (n) {
      n.classList.add(REL.srcHidden);
    });

    var filt = el('div', 'crp-rel-stepfilter');
    [['todas', 'Todas'], ['abertas', 'Só abertas']].forEach(function (d) {
      var b = el('button', 'crp-rel-stepbtn');
      b.type = 'button';
      b.textContent = d[1];
      b.setAttribute('aria-pressed', REL.stepFilter === d[0] ? 'true' : 'false');
      b.addEventListener('click', function () {
        REL.stepFilter = d[0];
        relSteps();
      });
      filt.appendChild(b);
    });
    host.appendChild(filt);

    var list = el('div', 'crp-rel-tl');
    var abertos = data.filter(function (x) { return x.open; });
    var outros = data.filter(function (x) { return !x.open; });

    function item(x) {
      var li = el('div', 'crp-rel-tl-item ' + (x.late ? 'atrasada' : x.status.cls));
      var top = el('div', 'crp-rel-tl-top');
      var taskEl;
      if (x.detailEl && x.detailNewTab) {
        taskEl = el('a', 'crp-rel-tl-task crp-rel-tl-task-link', x.task || '—');
        taskEl.href = x.detailEl.href;
        taskEl.target = '_blank';
        taskEl.rel = 'noopener';
        taskEl.title = 'Abrir subprocesso em nova aba';
      } else {
        taskEl = el('span', 'crp-rel-tl-task', x.task || '—');
        if (x.detailEl) {
          taskEl.classList.add('crp-rel-tl-task-link');
          taskEl.title = 'Abrir detalhes da tarefa';
          taskEl.setAttribute('role', 'link');
          taskEl.tabIndex = 0;
          var abrirDetalhe = function (e) {
            if (e) e.preventDefault();
            try { x.detailEl.click(); } catch (err) {}
          };
          taskEl.addEventListener('click', abrirDetalhe);
          taskEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirDetalhe(); }
          });
        }
      }
      top.appendChild(taskEl);
      if (String(x.statusRaw || '').trim()) {
        top.appendChild(relBadge(x.late ? 'atrasada' : x.status.cls, x.late ? 'Atrasada' : x.status.label));
      }
      li.appendChild(top);
      if (x.subtitle) li.appendChild(el('div', 'crp-rel-tl-sub', x.subtitle));
      var meta = el('div', 'crp-rel-tl-meta');
      if (x.open) {
        if (parseStamp(x.end) !== null) meta.appendChild(el('span', 'crp-rel-tl-prazo', 'Prazo: ' + relPrazo(relNoSec(x.end))));
      } else if (x.end && !(x.people && x.people.length)) {
        meta.appendChild(el('span', 'crp-rel-tl-conc', 'Concluído em ' + relNoSec(x.end)));
      }
      if (meta.children.length) li.appendChild(meta);
      var rb = relRespBlock(x);
      if (rb) li.appendChild(rb);
      if (x.desc) li.appendChild(relInstr(x.desc));
      if (x.detailEl) {
        var det = document.createElement('a');
        det.className = 'crp-rel-detail';
        det.href = x.detailEl.href;
        if (x.detailNewTab) {
          det.target = '_blank';
          det.rel = 'noopener';
          det.title = 'Abrir subprocesso em nova aba';
          det.textContent = 'Abrir subprocesso';
        } else {
          det.title = 'Abrir detalhes da tarefa';
          det.textContent = 'Ver detalhes';
          det.setAttribute('role', 'button');
          det.addEventListener('click', function (e) {
            e.preventDefault();
            try { x.detailEl.click(); } catch (err) {}
          });
        }
        li.appendChild(det);
      }
      if (REL.stepFilter === 'abertas' && !x.open) li.hidden = true;
      return li;
    }

    var dones = outros;
    if (abertos.length > 1) {
      var grp = el('div', 'crp-rel-tl-group');
      grp.appendChild(el('div', 'crp-rel-tl-grouphead', 'Em paralelo · ' + abertos.length + ' tarefas'));
      abertos.forEach(function (x) { grp.appendChild(item(x)); });
      list.appendChild(grp);
    } else {
      abertos.forEach(function (x) { list.appendChild(item(x)); });
    }

    if (REL.stepFilter === 'abertas') {
      // já nascem ocultas no item(); não renderiza as concluídas
    } else if (data.length > 10 && dones.length) {
      var det = el('details', 'crp-rel-donebox');
      det.appendChild(el('summary', 'crp-rel-donebox-sum', 'Mostrar ' + dones.length + (dones.length === 1 ? ' tarefa concluída' : ' tarefas concluídas')));
      dones.forEach(function (x) { det.appendChild(item(x)); });
      list.appendChild(det);
    } else {
      dones.forEach(function (x) { list.appendChild(item(x)); });
    }
    host.appendChild(list);
  }

  function relInstr(desc) {
    var det = el('details', 'crp-rel-instr');
    det.appendChild(el('summary', 'crp-rel-instr-sum', 'Ver instruções'));
    det.appendChild(el('div', 'crp-rel-instr-text', desc));
    return det;
  }

  function relOpenTasks() {
    var data = relStepsData();
    var abertas = data.filter(function (x) { return x.open; });
    var atrasadas = abertas.filter(function (x) { return x.late; });
    var host = document.getElementById('crp-rel-open');
    if (!host) {
      var req = document.querySelector('.crp-requester-card');
      if (!req) return;
      host = el('section', 'crp-rel-open');
      host.id = 'crp-rel-open';
      req.parentNode.insertBefore(host, req.nextSibling);
    }
    host.innerHTML = '';
    host.hidden = false;

    var snap = stepSnapshot();
    var facts = '';
    if (snap) {
      facts = 'Situação: ' + (snap.status || '—') + ' · Última movimentação: ' + (snap.updated || '—');
    }

    var head = el('div', 'crp-rel-open-head');
    head.appendChild(el('h3', 'crp-rel-open-title', abertas.length ? ('Tarefas abertas (' + abertas.length + ')') : 'Tarefas abertas'));
    head.appendChild(el('span', 'crp-rel-open-badge', abertas.length + ' em aberto · ' + atrasadas.length + ' atrasada' + (atrasadas.length === 1 ? '' : 's')));
    if (facts) head.appendChild(el('span', 'crp-rel-facts', facts));
    host.appendChild(head);

    if (!abertas.length) {
      host.appendChild(el('div', 'crp-rel-open-empty', 'Nenhuma tarefa aberta.'));
      return;
    }

    var lista = abertas.slice().sort(function (a, b) {
      if (a.late !== b.late) return a.late ? -1 : 1;
      var pa = parseStamp(a.end), pb = parseStamp(b.end);
      if (pa === null) return 1;
      if (pb === null) return -1;
      return pa - pb;
    });

    var ul = el('ul', 'crp-rel-open-list');
    lista.slice(0, 3).forEach(function (x) {
      var li = el('li', 'crp-rel-open-item');
      li.appendChild(el('span', 'crp-rel-open-task', x.task || '—'));
      if (String(x.statusRaw || '').trim()) {
        li.appendChild(relBadge(x.late ? 'atrasada' : x.status.cls, x.late ? 'Atrasada' : x.status.label));
      }
      if (x.subtitle) li.appendChild(el('div', 'crp-rel-open-sub', x.subtitle));
      if (parseStamp(x.end) !== null) li.appendChild(el('span', 'crp-rel-open-prazo', 'Prazo: ' + relPrazo(relNoSec(x.end))));
      var rb = relRespBlock(x);
      if (rb) { rb.classList.add('crp-rel-open-resp'); li.appendChild(rb); }
      if (x.desc) li.appendChild(relInstr(x.desc));
      ul.appendChild(li);
    });
    host.appendChild(ul);
    if (lista.length > 3) {
      var more = el('a', 'crp-rel-open-more', '+' + (lista.length - 3) + ' tarefa' + (lista.length - 3 === 1 ? '' : 's'));
      more.href = '#crp-rel-steps';
      more.addEventListener('click', function (e) {
        e.preventDefault();
        var alvo = document.getElementById('crp-rel-steps') || document.getElementById('PanelStep');
        if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      host.appendChild(more);
    }

    var heading = document.querySelector('.crp-hero-heading');
    if (heading) {
      var b = heading.querySelector('.crp-rel-open-summary');
      if (!b) { b = el('span', 'crp-rel-open-summary'); heading.appendChild(b); }
      b.textContent = abertas.length + ' em aberto · ' + atrasadas.length + ' atrasada' + (atrasadas.length === 1 ? '' : 's');
    }
  }

  /* Campo eventualmente solto fora da seção (ex.: Cliente/Projeto de atuação)
     volta para "Dados da Vaga"; linhas antes do cabeçalho viram conteúdo. */
  function relAjustarCampos() {
    var vaga = null;
    toArr(document.querySelectorAll('#PanelForm table.form')).some(function (t) {
      if (/Dados da Vaga/i.test(txt(t.querySelector('.crp-sec-label')))) { vaga = t; return true; }
      return false;
    });
    if (vaga && vaga.tBodies[0]) {
      var tb = vaga.tBodies[0];
      var foot = tb.querySelector('tr.crp-rel-footrow');
      toArr(document.querySelectorAll('tr')).forEach(function (tr) {
        if (vaga.contains(tr)) return;
        var lab = tr.querySelector('td.col0');
        if (!lab) return;
        if (!/Cliente\/Projeto de atuação/i.test(txt(lab))) return;
        if (foot && foot.parentNode === tb) tb.insertBefore(tr, foot);
        else tb.appendChild(tr);
      });
    }
    var secs = toArr(document.querySelectorAll('#PanelForm table.form')).map(function (t) {
      return { tbl: t, title: txt(t.querySelector('.crp-sec-label')) };
    });
    toArr(document.querySelectorAll('#PanelForm div.table-responsive')).forEach(function (wrap) {
      if (wrap.closest('table.form')) return;
      if (!wrap.getClientRects().length) return;
      var mt = wrap.querySelector('table[mult="S"]');
      if (!mt || !mt.getClientRects().length) return;
      var cap = relNorm(txt(mt.querySelector('caption')));
      var owner = null;
      if (cap) {
        var words = cap.split(/\s+/).filter(function (w) { return w.length >= 4; });
        secs.forEach(function (s) {
          if (owner) return;
          var tn = relNorm(s.title);
          if (!tn) return;
          if (tn.indexOf(cap) >= 0 || cap.indexOf(tn) >= 0) { owner = s; return; }
          words.forEach(function (w) { if (!owner && tn.indexOf(w) >= 0) owner = s; });
        });
      }
      if (!owner) {
        secs.forEach(function (s) { if (!owner && (s.tbl.compareDocumentPosition(wrap) & Node.DOCUMENT_POSITION_FOLLOWING)) owner = s; });
      }
      if (!owner) {
        secs.forEach(function (s) { if (s.tbl.compareDocumentPosition(wrap) & Node.DOCUMENT_POSITION_PRECEDING) owner = s; });
      }
      if (!owner || !owner.tbl.tBodies[0]) { wrap.classList.add('crp-rel-stray'); return; }
      var tb = owner.tbl.tBodies[0];
      var foot = tb.querySelector('tr.crp-rel-footrow');
      var tr = document.createElement('tr');
      tr.className = 'crp-full crp-rel-multrow';
      var td = document.createElement('td');
      td.colSpan = 2;
      td.appendChild(wrap);
      tr.appendChild(td);
      if (foot && foot.parentNode === tb) tb.insertBefore(tr, foot);
      else tb.appendChild(tr);
    });
    toArr(document.querySelectorAll('#PanelForm table.form')).forEach(function (t) {
      var tb = t.tBodies[0];
      if (!tb) return;
      var group = tb.querySelector(':scope > tr.group');
      if (!group) return;
      var antes = [];
      for (var n = tb.firstElementChild; n && n !== group; n = n.nextElementSibling) {
        if (n.tagName === 'TR' && !n.classList.contains('crp-note')) antes.push(n);
      }
      if (antes.length) {
        var ref = group.nextSibling;
        antes.forEach(function (r) { tb.insertBefore(r, ref); });
      }
    });
  }

  var relSecoesAtuais = [];
  var relBusy = false;
  var relTimer = 0;
  var relObserver = null;

  function relBuild() {
    if (relOff() || !relReadMode()) return;
    relSearchState.dirty = true;

    // Idempotência: remove rodapés/notas e o card de tarefas abertas.
    toArr(document.querySelectorAll('.crp-rel-footrow, .crp-rel-sec-foot, .crp-rel-mult-note, #crp-rel-open')).forEach(function (n) {
      n.remove();
    });

    // "Informações principais" sai: situação/última movimentação vão para o
    // cabeçalho, junto de Tarefas abertas.
    toArr(document.querySelectorAll('.crp-summary-card')).forEach(function (n) {
      n.classList.add('crp-src-hidden');
    });

    relAjustarCampos();
    relBar();
    relSecoesAtuais = relSecoes();
    relAplicarVazios(relSecoesAtuais);
    relDestaques(relSecoesAtuais);
    relSteps();
    // Card "Tarefas abertas" removido: o passo a passo já mostra tudo.
    // Mantém apenas a contagem resumida no cabeçalho.
    var abertas = relStepsData().filter(function (x) { return x.open; });
    var atrasadas = abertas.filter(function (x) { return x.late; }).length;
    relResumoAbertas(document.querySelector('.crp-hero-heading'), abertas.length, atrasadas);
  }

  function relInit() {
    if (relOff() || relBusy) return;
    if (relEditMode()) { relRestore(); return; }
    if (!relReadMode()) return;
    relBusy = true;
    if (relObserver) { relObserver.disconnect(); relObserver = null; }
    try {
      relBuild();
      if (relSearchState.active && relSearchState.norm) relSearchApply(relSearchState.norm);
    } catch (e) {
      console.warn('[crp-relatorio]', e);
    } finally {
      relBusy = false;
      relWatch();
    }
  }

  function relWatch() {
    if (relObserver || relOff() || !relReadMode()) return;
    relObserver = new MutationObserver(function (muts) {
      if (relBusy || relSearchState.applying) return;
      // Mudanças dentro da própria camada (ex.: "Ver todos") não rebuildam.
      var externo = false;
      for (var i = 0; i < muts.length; i++) {
        var t = muts[i].target;
        var e = t && t.nodeType === 1 ? t : (t && t.parentElement);
        if (!e || !e.closest || !e.closest('#crp-rel-steps, #crp-rel-open, .crp-rel-bar, .crp-rel-busca-resumo, .crp-rel-emptynote')) { externo = true; break; }
      }
      if (!externo) return;
      relSearchState.dirty = true;
      clearTimeout(relTimer);
      relTimer = setTimeout(relInit, 150);
    });
    // characterData: o Zeev preenche valores por texto depois do load.
    relObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function start() {
    if (build()) return;
    var tries = 0;
    var t = setInterval(function () {
      if (build() || ++tries > 25) clearInterval(t);
    }, 300);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
