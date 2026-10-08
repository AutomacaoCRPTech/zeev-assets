
//*
	//* ZEEV — Extrair dados da NFSe XML + validar tipos de arquivo
	//* Escopo: Esta tarefa
	//

function preencherCampo(identificador, valor) {
  const campo = document.querySelector(`[data-name='${identificador}']`);
  if (!campo || !valor) return;
  campo.value = valor;
  campo.dispatchEvent(new Event('change', { bubbles: true }));
  campo.dispatchEvent(new Event('input',  { bubbles: true }));
}

function extrairDadosNFSe(xmlText) {
  const cleanXml = xmlText.replace(/ xmlns="[^"]*"/g, '').replace(/ xmlns:[^=]+="[^"]*"/g, '');
  const xml = new DOMParser().parseFromString(cleanXml, 'text/xml');

  const emit   = xml.getElementsByTagName('emit')[0];
  const cnpj   = emit?.getElementsByTagName('CNPJ')[0]?.textContent?.trim() || '';
  const vLiq   = xml.getElementsByTagName('vLiq')[0]?.textContent?.trim() || '';
  const numero = xml.getElementsByTagName('nNFSe')[0]?.textContent?.trim() || '';

  const vLiqFormatado = vLiq
    ? parseFloat(vLiq).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '';

  preencherCampo('profissionalCNPJ',      cnpj);
  preencherCampo('pagamentoValorLiquido', vLiqFormatado);
  preencherCampo('nfNumero',             numero);
}

function buscarXMLNF() {
  const aHref = document.getElementById('td1docNFXML')?.querySelector('a')?.href;
  if (!aHref) return;

  fetch(aHref, { credentials: 'include' })
    .then(r => r.text())
    .then(html => {
      const downloadPath = html.match(/\/document\/download\/[^\s"']+/i)?.[0];
      if (!downloadPath) return;
      return fetch('https://crptech.zeev.it' + downloadPath, { credentials: 'include' });
    })
    .then(r => r?.text())
    .then(xml => { if (xml) extrairDadosNFSe(xml); })
    .catch(e => console.error('[NF] Erro:', e));
}

function monitorarArquivo(idCampo, extensao, callback) {
  const input = document.getElementById('inp' + idCampo);
  if (!input) return;

  new MutationObserver(() => {
    if (!input.value) return;
    const nome = document.getElementById('td1' + idCampo)
      ?.querySelector('a')?.textContent?.trim()?.toLowerCase() || '';

    if (nome && !nome.endsWith('.' + extensao)) {
      input.value = '';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input',  { bubbles: true }));
      alert(`Arquivo inválido. Envie apenas arquivos .${extensao}`);
      return;
    }

    if (callback) callback();
  }).observe(input, { attributes: true, attributeFilter: ['value'] });
}

function inicializar() {
  if (document.getElementById('td1docNFXML')) {
    buscarXMLNF();
    monitorarArquivo('docNFXML', 'xml', buscarXMLNF);
  }

  monitorarArquivo('docNF', 'pdf', null);
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(inicializar, 500);
});
