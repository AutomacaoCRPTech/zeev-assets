
/* Ajuste do botão Salvar. */
(function () {
  'use strict';

  var observer;

  function ajustarSalvar() {
    var root = document.getElementById('containerRequest');
    if (!root) return false;

    var options = root.querySelector('#inpOtherOptions');
    var footer = root.querySelector('#buttons');

    if (!options || !footer) return false;

    var save = root.querySelector('.crp-save-button');

    if (!save) {
      save = Array.prototype.find.call(
        root.querySelectorAll('#ContainerForm button[onclick]'),
        function (button) {
          var action = button
            .getAttribute('onclick')
            .replace(/[\s;]/g, '');

          return action === 'save(false)';
        }
      );
    }

    if (!save) return false;

    var group = options.parentElement;

    if (!footer.contains(group)) return false;

    if (save.closest('form') !== group.closest('form')) {
      return false;
    }

    group.classList.add('crp-footer-secondary');

    save.classList.add('crp-save-button');
    save.classList.remove('float-right', 'm-2');
    save.type = 'button';

    if (save.parentElement !== group) {
      group.appendChild(save);
    }

    sincronizarEstado(save);

    if (!save.crpEstadoObservado) {
      save.crpEstadoObservado = true;
      new MutationObserver(function () {
        sincronizarEstado(save);
      }).observe(save, {
        attributes: true,
        attributeFilter: ['disabled', 'class']
      });
    }

    return true;
  }

  /* Comunica o estado do botão (habilitado apenas quando há alterações). */
  function sincronizarEstado(save) {
    var inativo = save.disabled || save.classList.contains('disabled');
    var rotulo = inativo ? 'Nenhuma alteração para salvar' : 'Salvar dados do formulário';

    save.title = rotulo;
    save.setAttribute('aria-label', rotulo);
    save.setAttribute('aria-disabled', inativo ? 'true' : 'false');
  }

  function iniciar() {
    if (ajustarSalvar()) return;

    observer = new MutationObserver(function () {
      if (ajustarSalvar()) observer.disconnect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
