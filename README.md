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

A reforma comercial usa verde e azul derivados da logo original, preservada sem alterações. A página inicial apresenta os serviços, clientes já publicados e caminhos de orçamento. As cenas operacionais permanecem identificadas como ilustrativas.

`style.css` contém a base, `brand.css` a identidade compartilhada, `commercial.css` a composição da página inicial e `services.css` os detalhes dos serviços. Os estilos antigos `home.css`, `presentation.css` e `operations.css` foram substituídos. A fonte Inter continua local. Os vídeos da abertura são opcionais: o visitante inicia ou pausa a reprodução; preferências de movimento reduzido são respeitadas.

A [revisão visual de novembro](docs/reforma-comercial-2026-11-12.md) registra a implementação e os testes. A publicação dessa reforma depende de aprovação explícita.

Para a verificação opcional de sintaxe CSS, sem dependências no site publicado:

```sh
python3 -m pip install --target /tmp/ecomais-css-qa tinycss2==1.4.0
PYTHONPATH=/tmp/ecomais-css-qa python3 scripts/check_styles.py
```

Esta verificação não substitui a revisão visual em navegador. Para conferir HTTP, canonical, robots e sitemap após publicar, execute `python3 -u scripts/check_live.py`.

## Portfólio de serviços

A [expansão de seis páginas de serviços](docs/portfolio-servicos-2026-11-11.md) documenta o escopo editorial, as URLs e a verificação antes da publicação. Execute também `node --test scripts/test_app.cjs scripts/test_conversion.cjs`. O teste SEO cobre a home e as nove páginas comerciais; contatos é uma página auxiliar preservada. `check_live.py` obtém as rotas diretamente do sitemap e deve ser executado após a publicação autorizada.
