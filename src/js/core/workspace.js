  function setup() {
    var root = document.getElementById('containerRequest');
    var form = root && root.querySelector('#ContainerForm');
    var body = form && form.querySelector('#BoxFrmExecute');
    var main = root && root.querySelector('.main-col');

    if (!body || !main) return;
    if (state && state.body === body) return state;

    root.classList.add('crp-form', 'crp-workspace');
    main.classList.add('crp-main');

    var header = root.querySelector('.page-title');
    if (header) header.classList.add('crp-header');

    form.classList.add('crp-form-shell');
    body.classList.add('crp-work-grid');

    var original = Array.prototype.slice.call(body.childNodes);
    var left = el('div', 'crp-context-column');
    var right = el('div', 'crp-action-column');

    body.appendChild(left);
    body.appendChild(right);

    var info = el('section', 'crp-card crp-info');
    info.id = 'crp-info-card';

    info.appendChild(
      el('h2', 'crp-card-title', 'Informações da solicitação')
    );

    var tabs = el('div', 'crp-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Informações da solicitação');

    var summary = el('div', 'crp-panel crp-summary');
    summary.id = 'crp-summary';

    info.appendChild(tabs);
    info.appendChild(summary);
    left.appendChild(info);

    var actions = el('section', 'crp-card crp-actions');

    actions.appendChild(
      el('h2', 'crp-action-title', 'Suas ações nesta etapa')
    );

    var content = el('div', 'crp-action-content');
    actions.appendChild(content);
    right.appendChild(actions);

    original.forEach(function (node) {
      content.appendChild(node);
    });

    state = {
      root: root,
      body: body,
      main: main,
      left: left,
      right: right,
      info: info,
      tabs: tabs,
      summary: summary,
      actions: actions,
      content: content,
      items: [],
      active: null
    };

    addTab(summary, 'Resumo');

    return state;
  }

