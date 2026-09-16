(function(){
  var tries = 0;

  function estilizarLogin(){
    if(!location.href.includes('/login')) return;
    if(document.getElementById('crp-login-style')) return;
    var style = document.createElement('style');
    style.id = 'crp-login-style';
    style.textContent =
      'body.login { background: linear-gradient(135deg, #0a1e5e 0%, #1a3fa0 40%, #2563eb 100%) !important; margin: 0 !important; min-height: 100vh !important; }' +
      '.desktop-content-view { display: none !important; }' +
      '.col-12.col-lg-4 { flex: 0 0 100% !important; max-width: 100% !important; display: flex !important; justify-content: center !important; align-items: center !important; min-height: 100vh !important; }' +
      '.login-form { max-width: 480px !important; width: calc(100% - 32px) !important; border-radius: 16px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important; background: #fff !important; padding: 28px 24px !important; margin: 16px !important; }' +
      '.login-form .view-scroll-behavior { max-height: none !important; overflow: visible !important; }' +
      '.logo-field { margin-bottom: 12px !important; }' +
      '#bv-l { margin-bottom: 12px !important; }' +
      '@media(max-width:500px){ .login-form { max-width: 100% !important; border-radius: 12px !important; padding: 20px 16px !important; } }';
    document.head.appendChild(style);
  }

  function inserirLogin(){
    if(!location.href.includes('/login') || document.getElementById('bv-l')) return;
    var form = document.querySelector('form');
    if(!form){ if(++tries < 12) setTimeout(inserirLogin, 300); return; }
    var d = document.createElement('div');
    d.id = 'bv-l';
    d.style.cssText = 'background:#f0f4ff;border:1px solid #dde6ff;border-radius:10px;padding:14px 16px;margin:0 0 16px;text-align:center';
    d.innerHTML = '<p style="margin:0 0 10px;color:#6b7280;font-size:.84em;line-height:1.5">Use seu e-mail corporativo para acessar a plataforma de processos.</p><span style="background:#fff;border:1px solid #c7d7ff;border-radius:8px;padding:10px 12px;color:#1d4ed8;font-size:.82em;font-weight:500;display:block">Clique em <strong>"Entrar com Microsoft" abaixo</strong></span>';
    form.insertAdjacentElement('beforebegin', d);
  }

  function inserirBotoesAcompanhar(){
    if(!location.href.includes('/report/my-legacy') || document.getElementById('crp-filtro-rapido')) return;
    var items = document.querySelectorAll('#dropdownReportMenuType .dropdown-item');
    if(!items.length) return;
    var btnAtual = document.querySelector('#btnReportType span');
    var textoAtivo = btnAtual ? btnAtual.textContent.trim() : 'Minhas solicitações';
    var bar = document.createElement('div');
    bar.id = 'crp-filtro-rapido';
    bar.style.cssText = 'display:flex;gap:8px;padding:12px 16px;flex-wrap:wrap';
    var nomes = {'Minhas solicitações':'Minhas solicitações','Solicitações que participei e tenho acesso':'Participei e tenho acesso','Todas as solicitações que tenho acesso':'Todas as solicitações'};
    items.forEach(function(item){
      var label = item.textContent.trim();
      var btn = document.createElement('button');
      btn.textContent = nomes[label] || label;
      btn.dataset.reportId = item.dataset.reportId;
      var ativo = textoAtivo === label;
      btn.style.cssText = 'padding:8px 18px;border-radius:20px;border:2px solid '+(ativo?'#1a3fa0':'#e0e0e0')+';cursor:pointer;font-size:13px;font-weight:500;transition:all .2s;background:'+(ativo?'#1a3fa0':'#fff')+';color:'+(ativo?'#fff':'#555');
      btn.addEventListener('click', function(){
        item.click();
        bar.querySelectorAll('button').forEach(function(b){
          var on = b.dataset.reportId === item.dataset.reportId;
          b.style.background = on?'#1a3fa0':'#fff';
          b.style.color = on?'#fff':'#555';
          b.style.borderColor = on?'#1a3fa0':'#e0e0e0';
        });
      });
      bar.appendChild(btn);
    });
    var container = document.querySelector('.d-flex.h-100.flex-column');
    var row = container ? container.querySelector('.row.flex-nowrap') : null;
    if(container && row) container.insertBefore(bar, row);
  }

  function inserirSuporte(){
    if(location.href.includes('/login') || document.getElementById('s360')) return;
    var ids = ['aSideMenuMyRequests','aSideMenuMyTasks','aSideMenuStartApplication'];
    var ref = null;
    for(var i = 0; i < ids.length; i++){ ref = document.getElementById(ids[i]); if(ref) break; }
    if(!ref) return;
    var parent = ref.parentElement;
    var clone = parent.cloneNode(false);
    var link = document.createElement('a');
    link.id = 's360';
    link.className = 'nav-link';
    link.href = 'https://suporte360.crptecnologia.com.br/tickets';
    link.target = '_blank';
    link.innerHTML = '<img src="https://automacaocrptech.github.io/zeev-assets/producao/icons/logo_suporte.svg" style="width:24px;height:24px;vertical-align:middle;margin-right:10px"> Suporte360 <svg class="ico-right ico-sm" focusable="true"><use xlink:href="#right"></use></svg>';
    clone.appendChild(link);
    parent.after(clone);
  }

  new MutationObserver(function(){ estilizarLogin(); inserirLogin(); inserirSuporte(); inserirBotoesAcompanhar(); }).observe(document.body, {childList: true, subtree: true});
  estilizarLogin();
  setTimeout(inserirLogin, 600);
  setTimeout(inserirSuporte, 1000);
  setTimeout(inserirBotoesAcompanhar, 1000);
})();
