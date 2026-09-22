# Zeev | Padrão Visual

Arquivos estáticos hospedados via GitHub Pages para customização da plataforma Zeev da CRP Tecnologia.

## Estrutura

```
producao/
  zeev-main.js      # Script de customização em produção
homologacao/         # Scripts para ambiente de homologação (futuro)
```

## Como usar

No campo de customização do Zeev (Configurar > Personalização), adicione:

```html
<script type="text/javascript" src="https://automacaocrptech.github.io/zeev-assets/producao/zeev-main.js?v=1"></script>
```

Incremente o `?v=` a cada atualização para forçar a limpeza de cache nos navegadores.

## O que o script faz

- **Login personalizado** — Estiliza a tela de login com gradiente azul, card centralizado e banner informativo direcionando ao SSO Microsoft.
- **Suporte360 no sidebar** — Insere um link para o portal Suporte360 no menu lateral, visível em todas as páginas logadas.

## Deploy

O deploy é automático via GitHub Pages. Ao fazer `git push` na branch `main`, os arquivos ficam disponíveis em:

```
https://automacaocrptech.github.io/zeev-assets/
```
## Como aplicar o layout padrão nos formulários

Em cada fluxo/app do Zeev:

1. Abra o app e vá em **Scripts e estilos nas atividades**.
2. Cole o JavaScript abaixo no campo/aba **JavaScript**.
3. **Salvar**.

> Pode apagar o *Fontes externas* e usar só este JS no campo de JavaScript: é ele que
> injeta o CSS e o JS em runtime, sempre na versão do último commit.

### Código (copiar e colar)

```js
(function () {
  var REPO = 'AutomacaoCRPTech/zeev-assets';
  var FILES = [
    { t: 'css', p: 'producao/forms/zeev-default.css' },
    { t: 'js',  p: 'producao/forms/zeev-default.js' }
  ];
  var API = 'https://api.github.com/repos/' + REPO + '/commits/main';
  var KEY = 'zeev-assets:sha';
  var TTL = 5 * 60 * 1000;

  function inject(sha) {
    FILES.forEach(function (f) {
      var url = 'https://cdn.jsdelivr.net/gh/' + REPO + '@' + sha + '/' + f.p;
      var el = document.createElement(f.t === 'css' ? 'link' : 'script');
      if (f.t === 'css') { el.rel = 'stylesheet'; el.href = url; }
      else { el.src = url; el.defer = true; }
      document.head.appendChild(el);
    });
  }

  var sha = null;
  try {
    var c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.sha && Date.now() - c.t < TTL) sha = c.sha;
  } catch (e) {}

  if (sha) { inject(sha); return; }

  fetch(API, { cache: 'no-store', headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      var s = j.sha || 'main';
      try { localStorage.setItem(KEY, JSON.stringify({ sha: s, t: Date.now() })); } catch (e) {}
      inject(s);
    })
    .catch(function () { inject('main'); });
})();
```
### Observações importantes

- **Demora:** o SHA é guardado no `localStorage` por 5 minutos (`TTL`). Então uma alteração nova
  aparece em **até ~5 min**. Quer mais rápido? Diminua o `TTL`.
- **Limite da API do GitHub:** sem token são 60 requisições/hora por IP. O `TTL` de 5 min reduz
  para ~12/h por pessoa. Se muita gente sair pelo mesmo IP (NAT), aumente o `TTL`.
- **Outros arquivos:** se o fluxo usar CSS/JS com outro nome/caminho, é só ajustar a lista `FILES`.
- **Fallback:** se a API do GitHub falhar, ele cai para `@main` (funciona, mas pode ficar em cache).
- Não precisa mais do workflow de purge do jsDelivr para esses arquivos.
