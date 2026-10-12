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
