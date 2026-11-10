/* CRP | Janela "Enviar arquivos" (/files/upload) no padrão do layout.
   O modal roda num iframe próprio (mesma origem), que não carrega o nosso
   CSS. Aqui injetamos um <style> no contentDocument dele. */
(function () {
  'use strict';
  if (window.__crpUploadEstilo) return;
  window.__crpUploadEstilo = true;

  var CSS = [
    'html,body{font-family:Roboto,"Segoe UI",Arial,sans-serif !important;color:#22304F !important;background:#FFFFFF !important;}',
    'body{padding:6px 2px !important;}',
    'h1,h2,h3,h4,h5{color:#1F3F8E !important;font-weight:700 !important;}',
    'a{color:#1F3F8E !important;}',
    '.text-muted,small,.help-block,.form-text{color:#5B6B8C !important;}',
    'label,.control-label{color:#5B6B8C !important;font-weight:500 !important;font-size:12px !important;}',
    '.btn{border-radius:10px !important;font-weight:600 !important;box-shadow:none !important;min-height:40px;padding:9px 18px !important;font-size:14px !important;}',
    '.btn-primary,.btn-primary.start{background:#1F3F8E !important;border:1px solid #1F3F8E !important;color:#FFFFFF !important;}',
    '.btn-primary:hover,.btn-primary:focus,.btn-primary.start:hover{background:#18326F !important;border-color:#18326F !important;color:#FFFFFF !important;}',
    '.btn-secondary,.btn-default,.btn-link{background:#FFFFFF !important;border:1px solid #C7D4EA !important;color:#1F3F8E !important;}',
    '.btn-secondary:hover,.btn-default:hover,.btn-link:hover{background:#E4ECFB !important;border-color:#1F3F8E !important;color:#1F3F8E !important;}',
    'input[type="text"],input[type="email"],input[type="number"],input[type="password"],textarea,select,#inpDsDocType,#inpDsResume{box-sizing:border-box !important;width:100% !important;min-height:44px;padding:10px 14px !important;border:1px solid #E3E8F3 !important;border-radius:10px !important;background:#FFFFFF !important;color:#22304F !important;font-size:14px !important;box-shadow:none !important;}',
    'textarea,#inpDsResume{min-height:80px !important;line-height:1.5 !important;}',
    'input[type="text"]:focus,textarea:focus,select:focus,#inpDsDocType:focus{border-color:#1F3F8E !important;outline:3px solid rgba(31,63,142,.15) !important;outline-offset:0 !important;}',
    'input[type="checkbox"]{width:18px;height:18px;vertical-align:middle;}',
    '.fileupload-buttonbar,#fileupload,.fileupload-process{border:1px dashed #C9D3E8 !important;border-radius:12px !important;background:#F5F7FC !important;padding:16px !important;}',
    '.fileupload-buttonbar .btn{margin:0 6px 6px 0;}',
    '.template-upload,.template-download{border:1px solid #E3E8F3 !important;border-radius:10px !important;background:#FFFFFF !important;margin-top:8px !important;padding:8px !important;}',
    '.template-upload .name,.template-download .name,.template-upload .size,.template-download .size{color:#1F3F8E !important;font-weight:600 !important;}',
    '.progress{height:8px !important;border-radius:999px !important;background:#E4ECFB !important;}',
    '.progress-bar{background:#1F3F8E !important;}',
    '.alert{border-radius:12px !important;}'
  ].join('');

  function injetar(doc) {
    if (!doc || !doc.head || doc.getElementById('crp-upload-style')) return;
    var st = doc.createElement('style');
    st.id = 'crp-upload-style';
    st.textContent = CSS;
    doc.head.appendChild(st);
  }

  function varrer() {
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function (ifr) {
      try {
        var src = ifr.getAttribute('src') || '';
        if (src.indexOf('/files/upload') < 0) return;
        var doc = ifr.contentDocument;
        if (!doc) return;
        injetar(doc);
        if (!ifr.__crpUploadBound) {
          ifr.__crpUploadBound = true;
          ifr.addEventListener('load', function () { injetar(ifr.contentDocument); });
        }
      } catch (e) { /* origem diferente: ignora */ }
    });
  }

  var raf = 0;
  function agendar() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; varrer(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', varrer);
  } else {
    varrer();
  }
  new MutationObserver(agendar).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src']
  });
})();
