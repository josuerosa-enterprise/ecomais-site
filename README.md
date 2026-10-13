# ECOMAIS — site institucional

Site estático em HTML, CSS e JavaScript, servido a partir da raiz do repositório. Domínio canônico: `https://ecomaispa.com/`. Não requer build, framework ou instalação de dependências para publicar.

## Validação local

Requisitos: clone Git completo, Python 3.10+ e Node.js 20+.

```sh
python3 scripts/check_site.py
node --check app.js
node --test scripts/test_app.cjs
git diff --check
```

Para inspecionar as páginas em um ambiente local com navegador:

```sh
python3 -m http.server 8000
```

Abra `http://localhost:8000/` e os caminhos das páginas de serviço. Conteúdo, menus nativos, perguntas frequentes e links diretos de orçamento funcionam sem JavaScript. O formulário da página inicial usa JavaScript para montar a mensagem antes de abrir o WhatsApp.

A [documentação da expansão de SEO](docs/seo-servicos-2026-10-12.md) contém as URLs, as fontes, os resultados executados e o roteiro de revisão visual e pós-publicação.

## Identidade visual

A composição editorial segue a referência publicada em [gruponortebr.com](https://www.gruponortebr.com/) em 12/10/2026. As cores são da ECOMAIS: verde `#35b447`, azul `#074bab`, verde-claro `#8cce38` e verde profundo `#103c2c`. A logo original permanece intacta. A imagem da abertura aparece somente acima de 680 px.

`style.css` contém a base compartilhada, `home.css` a página inicial e `services.css` as páginas detalhadas. A fonte Inter é hospedada localmente, com `font-display: swap`; sua licença está em [assets/fonts/OFL.txt](assets/fonts/OFL.txt).

Para a verificação opcional de sintaxe CSS, sem dependências no site publicado:

```sh
python3 -m pip install --target /tmp/ecomais-css-qa tinycss2==1.4.0
PYTHONPATH=/tmp/ecomais-css-qa python3 scripts/check_styles.py
```

Esta verificação não substitui a revisão visual em navegador. Para conferir HTTP, canonical, robots e sitemap após publicar, execute `python3 -u scripts/check_live.py`.
