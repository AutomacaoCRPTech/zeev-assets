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

  function txt(node) { return node ? String(node.innerText || node.textContent || '').trim() : ''; }

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
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
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
        // linhas de texto/ajuda (célula única ou colspan) e campos largos em linha cheia
        if (tds.length === 1 || tr.querySelector('td[colspan]') ||
            tr.querySelector('table[mult="S"], .containerFormFileLink, [data-fieldformat="FILE"], textarea')) {
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

    var knownOrder = ['LkCancel', 'LkHoldShowOn', 'LkEdit'];
    var keyOf = { LkEdit: 'edit', LkHoldShowOn: 'hold', LkCancel: 'cancel' };
    var entries = [];
    Array.prototype.forEach.call(menu.children, function (li, idx) {
      var a = li.querySelector('a');
      if (!a) return;
      var label = txt(a);
      // Excluir nunca aparece; as demais (ex.: Reabrir do super admin) entram.
      if (a.id === 'LkDelete' || /^excluir$/i.test(label)) {
        if (li.parentNode) li.parentNode.removeChild(li);
        return;
      }
      var key = keyOf[a.id] || (/reabr/i.test(label) ? 'reopen' : 'other');
      li.classList.add('crp-ab-' + key);
      entries.push({ li: li, id: a.id || '', order: idx });
    });

    entries.sort(function (x, y) {
      var ox = knownOrder.indexOf(x.id);
      var oy = knownOrder.indexOf(y.id);
      if (ox < 0) ox = 99;
      if (oy < 0) oy = 99;
      if (ox !== oy) return ox - oy;
      return x.order - y.order;
    });

    var list = el('ul', 'crp-bottom-bar-actions');
    entries.forEach(function (e) {
      list.appendChild(e.li); // move o próprio li (mantém handlers)
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

    if (dd && dd.parentNode) dd.parentNode.removeChild(dd);
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
    return !!(document.getElementById('PanelStep') && document.getElementById('PanelForm'));
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
      if (secVazia && !relZeevOculto(tbl)) tbl.setAttribute('data-crp-rel-empty', '1');
      else tbl.removeAttribute('data-crp-rel-empty');

      var badge = tbl.querySelector('.crp-sec-count');
      if (badge) badge.textContent = preenchidos + ' de ' + campos + ' preenchidos';

      var foot = tbl.querySelector('.crp-rel-sec-foot');
      if (!foot) {
        foot = el('div', 'crp-rel-sec-foot');
        if (tbl.parentNode) tbl.parentNode.insertBefore(foot, tbl.nextSibling);
      }
      foot.textContent = vazios + (vazios === 1 ? ' campo vazio oculto' : ' campos vazios ocultos');
      if (secVazia) foot.setAttribute('data-crp-rel-empty', '1');
      else foot.removeAttribute('data-crp-rel-empty');

      list.push({ tbl: tbl, title: title, slug: slug, anchorId: anchorId, campos: campos, preenchidos: preenchidos, vazia: secVazia, vazios: vazios, foot: foot });
    });
    return list;
  }

  function relAplicarVazios(secs) {
    var show = relMostrarVazios();
    toArr(document.querySelectorAll('[data-crp-rel-empty="1"]')).forEach(function (n) {
      if (n.hasAttribute('data-crp-rel-zeev-hidden')) return;
      n.classList.toggle(REL.hidden, !show);
    });
    // O "—" cinza dos vazios vem do marcador existente (crp-val-empty),
    // reavaliado após o Zeev preencher os valores.
    if (typeof markEmptyValues === 'function') markEmptyValues();
    relChips(secs);
    relBanner(secs);
  }

  function relBar() {
    var geral = document.getElementById('crp-panel-geral');
    if (!geral) return null;
    var bar = geral.querySelector('.crp-rel-bar');
    if (bar) return bar;
    bar = el('div', 'crp-rel-bar');
    var chips = el('div', 'crp-rel-chips');
    chips.id = 'crp-rel-chips';
    var acts = el('div', 'crp-rel-bar-actions');
    var toggle = el('button', 'crp-rel-toggle');
    toggle.type = 'button';
    toggle.id = 'crp-rel-toggle';
    toggle.setAttribute('aria-pressed', relMostrarVazios() ? 'true' : 'false');
    toggle.textContent = 'Mostrar campos vazios';
    toggle.addEventListener('click', function () {
      var v = !relMostrarVazios();
      relSetMostrarVazios(v);
      toggle.setAttribute('aria-pressed', v ? 'true' : 'false');
      relAplicarVazios(relSecoesAtuais);
    });
    acts.appendChild(toggle);
    bar.appendChild(chips);
    bar.appendChild(acts);
    geral.insertBefore(bar, geral.firstChild);

    var banner = el('div', 'crp-rel-banner');
    banner.hidden = true;
    banner.appendChild(el('span', 'crp-rel-banner-text'));
    var showAll = el('button', 'crp-rel-showall');
    showAll.type = 'button';
    showAll.textContent = 'Mostrar tudo';
    showAll.addEventListener('click', function () {
      relSetMostrarVazios(true);
      var t = document.getElementById('crp-rel-toggle');
      if (t) t.setAttribute('aria-pressed', 'true');
      relAplicarVazios(relSecoesAtuais);
    });
    banner.appendChild(showAll);
    geral.insertBefore(banner, bar.nextSibling);
    return bar;
  }

  function relChips(secs) {
    var box = document.getElementById('crp-rel-chips');
    if (!box || !secs) return;
    box.innerHTML = '';
    secs.forEach(function (s) {
      if (relMostrarVazios() ? false : s.vazia) return;
      var a = el('a', 'crp-rel-chip');
      a.href = '#' + s.anchorId;
      a.textContent = s.title + ' ' + s.preenchidos + '/' + s.campos;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var alvo = document.getElementById(s.anchorId);
        if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      box.appendChild(a);
    });
    if (!box.children.length) box.appendChild(el('span', 'crp-rel-chip-empty', 'Nenhuma seção preenchida'));
  }

  function relBanner(secs) {
    var banner = document.querySelector('.crp-rel-banner');
    if (!banner || !secs) return;
    var n = secs.filter(function (s) { return s.vazia; }).length;
    banner.hidden = n === 0 || relMostrarVazios();
    var t = banner.querySelector('.crp-rel-banner-text');
    if (t) t.textContent = n + (n === 1 ? ' seção sem dados está oculta' : ' seções sem dados estão ocultas');
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
      var email = '';
      var m = txt(respCell).match(/[\w.+-]+@[\w.-]+\.\w+/);
      if (m) email = m[0];
      var resp = txt(respCell).replace(/^\s*[A-Z]{2}\s+/, '').replace(/[\w.+-]+@[\w.-]+\.\w+.*$/, '').trim();
      var end = c(cols.end);
      var open = /andamento|execu|atual/i.test(c(cols.status));
      var endStamp = parseStamp(end);
      return {
        task: c(cols.task),
        start: c(cols.start),
        end: end,
        statusRaw: c(cols.status),
        status: relStatus(c(cols.status)),
        resp: resp,
        email: email,
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
      top.appendChild(el('span', 'crp-rel-tl-task', x.task || '—'));
      top.appendChild(relBadge(x.late ? 'atrasada' : x.status.cls, x.late ? 'Atrasada' : x.status.label));
      li.appendChild(top);
      var meta = el('div', 'crp-rel-tl-meta');
      if (x.open) {
        var prazo = parseStamp(x.end);
        if (prazo !== null) meta.appendChild(el('span', 'crp-rel-tl-prazo', 'Prazo: ' + x.end));
      } else if (x.end) {
        meta.appendChild(el('span', 'crp-rel-tl-conc', 'Concluído em ' + x.end));
      }
      if (meta.children.length) li.appendChild(meta);
      if (x.resp || x.email) {
        var resp = el('div', 'crp-rel-tl-resp');
        var av = el('span', 'crp-rel-avatar', initials(x.resp));
        av.setAttribute('aria-hidden', 'true');
        if (x.email) resp.title = x.email;
        resp.appendChild(av);
        resp.appendChild(el('span', 'crp-rel-tl-respname', x.resp || x.email));
        li.appendChild(resp);
      }
      if (REL.stepFilter === 'abertas' && !x.open) li.hidden = true;
      return li;
    }

    if (abertos.length > 1) {
      var grp = el('div', 'crp-rel-tl-group');
      grp.appendChild(el('div', 'crp-rel-tl-grouphead', 'Em paralelo · ' + abertos.length + ' tarefas'));
      abertos.forEach(function (x) { grp.appendChild(item(x)); });
      list.appendChild(grp);
    } else {
      abertos.forEach(function (x) { list.appendChild(item(x)); });
    }
    outros.forEach(function (x) { list.appendChild(item(x)); });
    host.appendChild(list);
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
    if (!abertas.length) { host.hidden = true; return; }
    host.hidden = false;

    var head = el('div', 'crp-rel-open-head');
    head.appendChild(el('h3', 'crp-rel-open-title', 'Tarefas abertas (' + abertas.length + ')'));
    head.appendChild(el('span', 'crp-rel-open-badge', abertas.length + ' em aberto · ' + atrasadas.length + ' atrasada' + (atrasadas.length === 1 ? '' : 's')));
    host.appendChild(head);

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
      li.appendChild(relBadge(x.late ? 'atrasada' : x.status.cls, x.late ? 'Atrasada' : x.status.label));
      if (parseStamp(x.end) !== null) li.appendChild(el('span', 'crp-rel-open-prazo', 'Prazo: ' + x.end));
      if (x.resp) {
        var r = el('span', 'crp-rel-open-resp');
        r.appendChild(el('span', 'crp-rel-avatar crp-rel-avatar-sm', initials(x.resp)));
        r.appendChild(el('span', 'crp-rel-open-respname', x.resp));
        li.appendChild(r);
      }
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

  var relSecoesAtuais = [];
  var relBusy = false;
  var relTimer = 0;
  var relObserver = null;

  function relBuild() {
    if (relOff() || !relReadMode()) return;
    relBar();
    relSecoesAtuais = relSecoes();
    relAplicarVazios(relSecoesAtuais);
    relDestaques(relSecoesAtuais);
    relSteps();
    relOpenTasks();
  }

  function relInit() {
    if (relOff() || !relReadMode() || relBusy) return;
    relBusy = true;
    if (relObserver) { relObserver.disconnect(); relObserver = null; }
    try {
      relBuild();
    } catch (e) {
      console.warn('[crp-relatorio]', e);
    } finally {
      relBusy = false;
      relWatch();
    }
  }

  function relWatch() {
    if (relObserver || relOff() || !relReadMode()) return;
    relObserver = new MutationObserver(function () {
      if (relBusy) return;
      clearTimeout(relTimer);
      relTimer = setTimeout(relInit, 150);
    });
    relObserver.observe(document.body, { childList: true, subtree: true });
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
