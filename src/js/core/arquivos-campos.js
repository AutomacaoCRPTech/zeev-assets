  function ajustarArquivosCampos() {
    var root = document.getElementById('containerRequest');

    if (!root) return;

    // Botão de download de cada arquivo.
    Array.prototype.forEach.call(
      root.querySelectorAll('.containerFormFileLink > a[donwload], .containerFormFileLink > a[download]'),
      function (botao) {
        if (botao.dataset.crpBaixar === '1') return;

        botao.setAttribute('aria-label', 'Baixar arquivo');
        botao.setAttribute('title', 'Baixar arquivo');
        botao.dataset.crpBaixar = '1';
      }
    );

    // Botão de remover, somente quando o campo oferecer a ação.
    Array.prototype.forEach.call(
      root.querySelectorAll('.containerFormFileLink a[onclick*="files.delete"], .containerFormFileLink a[onclick*="fileUpload.delete"], td.col1:has(.containerFormFileLink) a[onclick*="files.delete"], td.col1:has(.containerFormFileLink) a[onclick*="fileUpload.delete"]'),
      function (botao) {
        if (botao.dataset.crpRemover === '1') return;

        botao.setAttribute('aria-label', 'Remover arquivo');
        botao.setAttribute('title', 'Remover arquivo');
        botao.dataset.crpRemover = '1';
      }
    );

    // Botão de anexar arquivo do campo editável.
    Array.prototype.forEach.call(
      root.querySelectorAll('button[onclick*="fileUpload"]'),
      function (botao) {
        if (botao.dataset.crpAnexar === '1') return;

        var multi = !!botao.closest('table[mult="S"]');
        var campo = botao.closest('td');
        var arquivos = campo ? campo.querySelectorAll('.containerFormFileLink a[href*="/document/preview/"]').length : 0;
        var texto = multi && arquivos > 0 ? 'Adicionar arquivo' : 'Anexar arquivo';

        if (!botao.children.length && botao.textContent.trim() !== texto) {
          botao.textContent = texto;
        }

        botao.dataset.crpAnexar = '1';
      }
    );

    // CRP | Campos de arquivo em tabelas multivaloradas: o controle nativo de
    // remocao vira um botao-icone (icone desenhado via CSS ::before),
    // preservando handler, URL e atributos.
    Array.prototype.forEach.call(
      root.querySelectorAll('table[mult="S"] .containerFormFileLink a[onclick*="fileUpload.delete"], table[mult="S"] .containerFormFileLink [data-crp-remover="1"]'),
      function (botao) {
        if (botao.childNodes.length) botao.textContent = '';
        if (botao.getAttribute('aria-label') !== 'Apagar arquivo') botao.setAttribute('aria-label', 'Apagar arquivo');
        if (botao.getAttribute('title') !== 'Apagar arquivo') botao.setAttribute('title', 'Apagar arquivo');
      }
    );
  }

  // Reorganiza o card de mensagem: data no cabeçalho e, no rodapé,
  // a atividade de origem e o processo (preservando link, se houver).
