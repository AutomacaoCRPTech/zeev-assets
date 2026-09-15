(function(){
  var tries = 0;

  function inserirLogin(){
    if(!location.href.includes('/login') || document.getElementById('bv-l')) return;
    var form = document.querySelector('form');
    if(!form){ if(++tries < 12) setTimeout(inserirLogin, 300); return; }
    var d = document.createElement('div');
    d.id = 'bv-l';
    d.style.cssText = 'background:#f0f4ff;border:1px solid #dde6ff;border-radius:10px;padding:14px 16px;margin:0 0 16px;text-align:center';
    d.innerHTML = '<p style="margin:0 0 10px;color:#6b7280;font-size:.84em;line-height:1.5">Use seu e-mail corporativo para acessar a plataforma de processos.</p><span style="background:#fff;border:1px solid #c7d7ff;border-radius:8px;padding:10px 12px;color:#1d4ed8;font-size:.82em;font-weight:500;display:block">Clique em <strong>“Entrar com Microsoft” abaixo</strong></span>';
    form.insertAdjacentElement('beforebegin', d);
  }

  function inserirSuporte(){
    if(!location.href.includes('/my') || document.getElementById('s360')) return;
    var ref = document.getElementById('aSideMenuMyRequests');
    if(!ref) return;
    var parent = ref.parentElement;
    var clone = parent.cloneNode(false);
    var link = document.createElement('a');
    link.id = 's360';
    link.className = 'nav-link';
    link.href = 'https://suporte360.crptecnologia.com.br/tickets';
    link.target = '_blank';
    link.innerHTML = '<svg class="ico-star ico-md" focusable="true"><use xlink:href="#star"></use></svg> Suporte360 <svg class="ico-right ico-sm" focusable="true"><use xlink:href="#right"></use></svg>';
    clone.appendChild(link);
    parent.after(clone);
  }

  new MutationObserver(function(){ inserirLogin(); inserirSuporte(); }).observe(document.body, {childList: true, subtree: true});
  setTimeout(inserirLogin, 600);
  setTimeout(inserirSuporte, 1000);
})();
