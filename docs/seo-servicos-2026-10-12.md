# Expansão de SEO por serviço — 12/10/2026

## Objetivo e base

A página inicial concentrava todas as intenções de busca e o sitemap continha uma URL. Esta alteração acrescenta três páginas úteis para potenciais clientes no Pará, com conteúdo próprio e caminhos diretos para orçamento.

Base inspecionada: `8c55b2e3e56423c838b86f3e08df79f3db235daf`, posterior ao commit de SEO `d13b44ad143349ad016ad6aa80998e45f271fb69`. Inclui as atualizações do banner, da marca no navegador e da verificação do Google. Não havia PR aberto para o mesmo trabalho na inspeção.

O resultado está preparado para revisão em `feat/seo-servicos-para`. A publicação depende da integração da branch; este trabalho não muda `main` nem envia solicitações ao Search Console.

## Páginas e intenção de busca

| Caminho canônico | Intenção e conteúdo |
| --- | --- |
| `/retificacao-car-para/` | Retificação de CAR no Pará: notificações, revisão de mapas, APP/Reserva Legal, documentos, distinção entre retificação e validação. |
| `/licenciamento-ambiental-para/` | Licenciamento em Marabá e no Pará: enquadramento, órgão competente, implantação, renovação e condicionantes. |
| `/outorga-pocos-para/` | Regularização de poços e outorga no Pará: perfuração, captação, avaliação de dispensa, dados de uso e potabilidade. |

Cada caminho é um diretório com `index.html`, compatível com hospedagem estática e acesso direto. As URLs canônicas usam HTTPS, o domínio atual e barra final. Não dependem de roteamento JavaScript. `index.html` permanece na raiz e todas as âncoras anteriores continuam existentes.

O conteúdo é original, em português, e inclui escopo, situações de contratação, etapas, documentos, cinco perguntas frequentes, referências oficiais e serviços relacionados. Não há preços inventados, prazos de aprovação prometidos, avaliações fabricadas ou filiais fictícias. A base comercial permanece Marabá, com atendimento no Pará sujeito ao escopo e à mobilização.

## Integração e SEO

- Título, descrição, H1, canônica, Open Graph e mensagem de WhatsApp próprios em cada página.
- Grafos JSON-LD de `Service`, `WebPage`, `BreadcrumbList`, `WebSite` e a identidade `#empresa` já existente. O catálogo da página inicial referencia os mesmos serviços.
- Breadcrumb visual consistente com o JSON-LD. Os dados da empresa mantêm nome, telefone, e-mail e localidade atuais.
- Sitemap com quatro URLs canônicas e `lastmod` da alteração. Não manter `lastmod` artificialmente atualizado sem mudança de conteúdo.
- Navegação no cabeçalho, no menu de celular, nos três cartões originais e no rodapé. Links entre as novas páginas, sem páginas órfãs.
- WhatsApp comercial preservado: `5594981068031`. As mensagens identificam o serviço e pedem município e dados iniciais. O visitante revisa e envia no WhatsApp; clicar no link não confirma envio nem constitui lead qualificado.
- As novas perguntas frequentes usam `details`/`summary`, sem marcação de FAQ para sugerir elegibilidade a resultado enriquecido comercial. O JSON-LD não garante exibição especial pelo Google.

Não foi criada redireção global nem fallback para a home. As variantes `/index.html` de cada diretório apontam a canônica correspondente. A normalização da variante sem barra precisa ser confirmada no servidor depois da publicação.

## Preservação e desempenho

Marca, banner, favicons, arquivo de verificação, `CNAME`, `robots.txt`, imagens publicadas e textos/campos do formulário anterior foram preservados. O JavaScript compartilhado passa a tolerar páginas sem formulário; menu, Esc, abertura do WhatsApp, cópia e observador do contato mantêm comportamento coberto por testes.

As páginas novas reutilizam CSS, JavaScript e logo atuais, com uma folha adicional; não acrescentam fontes remotas, bibliotecas, vídeos, rastreadores ou imagens de fundo. A página inicial recebeu dimensões intrínsecas, carregamento tardio e decodificação assíncrona nas oito logos de clientes abaixo da primeira tela. O banner original continua com sua regra de desktop e fica oculto no celular.

| Página | HTML em bytes | HTML + CSS + JavaScript + logo em bytes |
| --- | ---: | ---: |
| CAR | 19.585 | 176.670 |
| Licenciamento | 20.082 | 177.167 |
| Poços/outorgas | 20.005 | 177.090 |

Inventário local sem compressão, contando arquivos compartilhados uma vez por página e sem favicons ou imagens apenas referenciadas em metadados sociais. Não é transferência de rede medida nem resultado de Lighthouse. O cache entre páginas tende a reduzir transferências subsequentes; depende do servidor e do navegador.

## Validações executadas

Ambiente: Python 3.12.14 e Node.js 24.19.0. Comandos sem dependências adicionais, executáveis a partir de um clone completo:

```sh
python3 scripts/check_site.py
node --check app.js
node --test scripts/test_app.cjs
git diff --check
```

Resultados em 12/10/2026:

- **829 verificações estáticas aprovadas** em quatro páginas: estrutura explícita de tags, IDs e referências ARIA, nomes de controles, idioma, viewport, H1, metadados únicos, canônicas, robots, sitemap, existência de assets, fragmentos, navegação, links de WhatsApp, relações do JSON-LD e orçamento de bytes.
- **7 testes de comportamento aprovados**: páginas sem formulário, menu de celular, menu de serviços, geração da mensagem, validação dos campos, cópia e botão flutuante. São testes Node com DOM simulado, sem envio de mensagens; não são testes de navegador.
- Sintaxe JavaScript e espaços do diff: aprovados.
- Comparação com o commit-base: âncoras anteriores, formulário e arquivos de marca/verificação preservados.
- Contraste calculado para sete pares de cor sólidos usados nas novas páginas: pelo menos 4,5:1. Não é auditoria completa de contraste renderizado ou certificação WCAG.
- Produção atual: `python3 scripts/check_live.py --paths /` passou. A home responde 200, com canônica esperada, sem bloqueio por meta/HTTP robots e presente no sitemap publicado. Um endereço inexistente retorna 404. Isso verifica a versão anterior em produção, não as três páginas novas.

## Revisão visual pendente antes da publicação

A habilidade Sites exige o navegador de testes suportado neste ambiente. Esse navegador não estava disponível na sessão; a instrução impede iniciar preview ou improvisar outro caminho de automação. Por isso não foram executados screenshots, Playwright, axe, Lighthouse nem medições de LCP/CLS/INP. Os testes estáticos não comprovam responsividade renderizada, acessibilidade integral ou desempenho real.

Em máquina com navegador, execute `python3 -m http.server 8000` na raiz e confira as quatro páginas:

1. Larguras de **320, 375, 390, 768, 1024 e 1440 px**, além de zoom de 200%. Verificar ausência de rolagem horizontal, cortes de texto, sobreposição do CTA flutuante e clipping do menu. Confirmar a home e seu banner no celular.
2. Teclado: link “Pular para o conteúdo”, menu “Serviços” com Enter/Espaço, navegação entre links, Esc e retorno do foco; menu móvel, FAQs, contatos e rodapé. Foco precisa permanecer visível, sem armadilha.
3. Celular: abrir/fechar menu, rolar a lista, seguir uma página, retornar à home e alternar orientação. Confirmar o tamanho dos alvos e a leitura das colunas empilhadas.
4. Desativar JavaScript: conteúdo, canônicas, menu alternativo, FAQs e links diretos de WhatsApp continuam acessíveis. Reativar JavaScript e verificar console sem exceções, formulário, fallback de cópia e visibilidade do botão flutuante.
5. Conferir a abertura das mensagens de orçamento no aplicativo/navegador do WhatsApp; não enviar mensagens de teste a terceiros.
6. Rodar Lighthouse mobile e axe DevTools nas quatro páginas. Registrar versão, URL, data e condições do teste; resolver falhas de acessibilidade e regressões em comparação com a home-base.
7. Para desempenho, comparar três execuções sob as mesmas condições e guardar a mediana. Metas de experiência: LCP até 2,5 s, CLS até 0,1 e INP até 200 ms; INP requer dados de interação/campo, não deve ser declarado medido por esta inspeção.

## Verificação depois da integração/publicação

```sh
python3 scripts/check_live.py
```

O script consulta as quatro URLs no domínio real, a normalização da barra final, o sitemap, robots, canônicas, cabeçalhos e a resposta 404. Deve ser executado **após o deploy**, pois as novas URLs ainda não existem em produção durante a revisão. Uma falha de rede não comprova falha de indexação.

Depois que o deploy e as verificações passarem, reenviar `https://ecomaispa.com/sitemap.xml` no Search Console e inspecionar as três URLs. Conferir a canônica escolhida pelo Google e acompanhar consultas, impressões, cliques e solicitações de orçamento por serviço. O acesso e o envio ao Search Console não foram realizados nesta tarefa. Não há garantia de indexação, prazo ou posição no Google.

Para reverter, reverter o commit/PR na branch principal e republicar a versão anterior. Nenhuma migração ou alteração de dados é necessária.

## Fontes consultadas

- [SEMAS: SICAR/PA](https://car.semas.pa.gov.br/).
- [SEMAS: procedimento de análise/retificação para pequena propriedade ou posse rural](https://sistemas.semas.pa.gov.br/legislacao/publico/view/864043/). O procedimento específico não foi generalizado para todos os imóveis.
- [Código Florestal, Lei 12.651/2012](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm), especialmente a natureza do CAR e a regularização ambiental.
- [SEMAS: legislação de licenciamento](https://sistemas.semas.pa.gov.br/legislacao/publico/pesquisa/texto_norma%3Alicenciamento) e [atividades de impacto local](https://sistemas.semas.pa.gov.br/legislacao/normas/view/557655/).
- [Ibama: perguntas frequentes sobre licenciamento](https://www.gov.br/ibama/pt-br/acesso-a-informacao/perguntas-frequentes/licenciamento-ambiental).
- [SEMAS: termos de referência, formulários e guias de recursos hídricos](https://semas.pa.gov.br/Home/Page/RecursosHidricos/) e [procedimentos de outorga, dispensa e perfuração](https://sistemas.semas.pa.gov.br/legislacao/normas/view/98727).
- [Google Search Central: canônicas](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) e [construção/envio de sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- [Google web.dev: Web Vitals](https://web.dev/articles/vitals), critérios de LCP, CLS e INP e distinção entre medições de laboratório e de campo.

As fontes fundamentam a orientação geral. O enquadramento de cada processo e suas exigências precisam ser confirmados no momento da contratação.
