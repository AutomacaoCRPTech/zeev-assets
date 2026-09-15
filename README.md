# zeev-assets

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