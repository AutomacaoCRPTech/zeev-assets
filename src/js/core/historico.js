  function classificarStatusHistorico() {
    var escopo = document.getElementById('containerHistoryRender');

    if (!escopo) return;

    // Subprocesso: a instancia atual possui uma instancia mestre diferente.
    var subprocesso = false;
    var atual = document.getElementById('inpCodFlowExecute');
    var mestre = document.getElementById('inpCodFlowExecuteMaster');
    if (atual && mestre) {
      var a = (atual.value || '').trim();
      var m = (mestre.value || '').trim();
      subprocesso = m !== '' && m !== '0' && m !== a;
    }

    // Registro de abertura = tarefa mais antiga (menor data-id).
    var abertura = null, menor = null;
    escopo.querySelectorAll(':scope > .row').forEach(function (r) {
      var id = parseInt(r.getAttribute('data-id'), 10);
      if (isNaN(id)) return;
      if (menor === null || id < menor) { menor = id; abertura = r; }
    });

    escopo.querySelectorAll('.badge').forEach(function (selo) {
      var texto = (selo.textContent || '').toLowerCase();
      var status = 'neutro';

      if (texto.indexOf('subprocesso') >= 0) status = 'subprocesso';
      else if (texto.indexOf('conclu') >= 0) status = 'concluido';
      else if (texto.indexOf('revis') >= 0) status = 'revisao';

      var vazio = (selo.textContent || '').trim() === '';
      if (subprocesso && vazio && abertura && abertura.contains(selo)) {
        selo.textContent = 'Subprocesso';
        status = 'subprocesso';
      }

      if (selo.getAttribute('data-crp-status') !== status) {
        selo.setAttribute('data-crp-status', status);
      }
    });
  }

