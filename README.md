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

Para utilizar o layout padrão da CRP nos formulários do Zeev:

1. Abra o formulário em que deseja aplicar o layout.
2. Acesse **Scripts e estilos**.
3. Na seção **Fontes externas**, cole o código abaixo.
4. Configure a aplicação para **todas as atividades** do processo.
5. Salve as alterações.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/AutomacaoCRPTech/zeev-assets@main/producao/forms/zeev-default.css"
>

<script
  src="https://cdn.jsdelivr.net/gh/AutomacaoCRPTech/zeev-assets@main/producao/forms/zeev-default.js"
  defer
></script>
```

Repita essa configuração em cada formulário que deverá utilizar o layout padrão.

> Os arquivos são carregados da branch `main` deste repositório pelo jsDelivr. As atualizações poderão refletir em todos os formulários que utilizam esses links, com possível atraso devido ao cache.
