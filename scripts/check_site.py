#!/usr/bin/env python3
"""Offline SEO/link/accessibility structure and resource-budget checks (stdlib only).
Run from any directory: python3 scripts/check_site.py
This does not replace rendered/browser accessibility or Core Web Vitals testing.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, parse_qs, unquote
from urllib.robotparser import RobotFileParser
import json
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://ecomaispa.com'
BASELINE = '8c55b2e3e56423c838b86f3e08df79f3db235daf'
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
errors = []
checks = 0

def check(condition, message):
    global checks
    checks += 1
    if not condition:
        errors.append(message)

class Element:
    def __init__(self, tag='', attrs=(), parent=None):
        self.tag, self.attrs, self.parent = tag, dict(attrs), parent
        self.children = []
    def text(self):
        return ' '.join(x.text() if isinstance(x, Element) else x for x in self.children)
    def all(self, tag=None):
        for child in self.children:
            if isinstance(child, Element):
                if tag is None or child.tag == tag:
                    yield child
                yield from child.all(tag)
    def get(self, key, default=''):
        return self.attrs.get(key, default)

class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Element()
        self.stack = [self.root]
        self.structure_errors = []
        self.feed(source)
        self.close()
        if len(self.stack) != 1:
            self.structure_errors.append('Unclosed: ' + ','.join(x.tag for x in self.stack[1:]))
    def handle_starttag(self, tag, attrs):
        node = Element(tag, attrs, self.stack[-1])
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)
    def handle_endtag(self, tag):
        if self.stack[-1].tag == tag:
            self.stack.pop()
        else:
            self.structure_errors.append(f'Unexpected </{tag}> within <{self.stack[-1].tag}>')
    def handle_data(self, data):
        self.stack[-1].children.append(data)
    def all(self, tag=None):
        return list(self.root.all(tag))
    def meta(self, key):
        return [x.get('content') for x in self.all('meta') if x.get('name') == key or x.get('property') == key]

files = sorted(p for p in ROOT.rglob('index.html') if '.git' not in p.parts)
pages = {'/' + p.relative_to(ROOT).as_posix().removesuffix('index.html'): Document(p.read_text()) for p in files}
check(len(pages) == 4, 'Expected homepage and three service pages')
robots = RobotFileParser()
robots.parse((ROOT / 'robots.txt').read_text().splitlines())
sitemap = ET.parse(ROOT / 'sitemap.xml')
locations = [x.text for x in sitemap.findall('.//{*}loc')]
check(set(locations) == {ORIGIN + p for p in pages}, 'Sitemap must list exactly the canonical pages')
check(len(locations) == len(set(locations)), 'Duplicate sitemap entries')
check('Sitemap: ' + ORIGIN + '/sitemap.xml' in (ROOT / 'robots.txt').read_text(), 'robots sitemap URL missing')
for lastmod in sitemap.findall('.//{*}lastmod'):
    check(bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', lastmod.text or '')), 'Invalid sitemap lastmod')

def local_target(value, current):
    url = urlsplit(urljoin(ORIGIN + current, value))
    if url.netloc != 'ecomaispa.com' or url.scheme != 'https':
        return None, url
    pathname = unquote(url.path)
    target = ROOT / pathname.lstrip('/')
    if pathname.endswith('/'):
        target /= 'index.html'
    return target, url

def name(node):
    return node.get('aria-label') or node.text().strip() or ' '.join(x.get('alt') or x.get('aria-label') for x in node.all())

titles, descriptions, resources_report = [], [], []
internal_graph = {}
for pathname, doc in pages.items():
    context = pathname + ': '
    check(not doc.structure_errors, context + '; '.join(doc.structure_errors))
    check(len(doc.all('html')) == 1 and doc.all('html')[0].get('lang') == 'pt-BR', context + 'Language')
    check(len(doc.all('head')) == 1 and len(doc.all('main')) == 1, context + 'Document landmarks')
    check(len(doc.all('h1')) == 1, context + 'Exactly one H1 required')
    check(doc.meta('viewport') == ['width=device-width,initial-scale=1'], context + 'Zoom-friendly viewport')
    title = doc.all('title')
    check(len(title) == 1, context + 'Single title')
    titles.append(title[0].text())
    description = doc.meta('description')
    check(len(description) == 1 and 100 <= len(description[0]) <= 165, context + 'Description length/uniqueness')
    descriptions.extend(description)
    check(len(doc.meta('robots')) == 1 and 'noindex' not in doc.meta('robots')[0], context + 'Indexable robots meta')
    check(robots.can_fetch('Googlebot', ORIGIN + pathname), context + 'Blocked by robots.txt')
    canonical = [x for x in doc.all('link') if x.get('rel') == 'canonical']
    check(len(canonical) == 1 and canonical[0].get('href') == ORIGIN + pathname, context + 'Self canonical')
    check(canonical[0].parent.tag == 'head', context + 'Canonical in head')
    check(doc.meta('og:url') == [ORIGIN + pathname], context + 'Open Graph/canonical disagreement')
    ids = [x.get('id') for x in doc.all() if x.get('id')]
    check(len(ids) == len(set(ids)), context + 'Duplicate IDs')
    for node in doc.all():
        for attribute in ['aria-controls', 'aria-labelledby', 'aria-describedby', 'for']:
            if node.get(attribute):
                check(all(x in ids for x in node.get(attribute).split()), context + 'Unresolved ' + attribute)
        if node.tag in ('a','button','summary'):
            check(bool(name(node)), context + 'Unnamed interactive element')
        if node.get('target') == '_blank':
            check('noopener' in node.get('rel').split(), context + 'Unsafe new-tab link')
        if node.tag == 'img':
            check('alt' in node.attrs, context + 'Image missing alt')
            check(node.get('width').isdigit() and node.get('height').isdigit(), context + 'Image without dimensions')
    check(any(x.get('href') == '#conteudo' for x in doc.all('a')), context + 'Missing skip link')
    check(any(x.get('id') == 'conteudo' and x.get('tabindex') == '-1' for x in doc.all('main')), context + 'Skip target not focusable')
    for nav in doc.all('nav'):
        check(bool(nav.get('aria-label')), context + 'Unnamed navigation')
    internal_graph[pathname] = set()
    assets = {ROOT / pathname.lstrip('/') / 'index.html'}
    for node in doc.all():
        attribute = 'src' if node.tag in ('script','img') else 'href'
        if node.tag not in ('a','link','script','img','image') or not node.get(attribute):
            continue
        href = node.get(attribute)
        target, url = local_target(href, pathname)
        if target is not None:
            check(target.is_file(), context + 'Missing local resource ' + href)
            if url.fragment and (target.suffix == '.html'):
                dest_path = '/' + target.relative_to(ROOT).as_posix().removesuffix('index.html')
                check(dest_path in pages and any(x.get('id') == unquote(url.fragment) for x in pages[dest_path].all()), context + 'Broken fragment ' + href)
            if node.tag == 'a' and url.path in pages:
                internal_graph[pathname].add(url.path)
            if node.tag in ('script','image','img') or node.get('rel') == 'stylesheet' or (node.get('rel') == 'preload' and node.get('as') == 'font'):
                assets.add(target)
        if url.netloc == 'wa.me':
            check(url.path == '/5594981068031', context + 'Wrong WhatsApp number')
            if pathname != '/':
                msg = parse_qs(url.query).get('text', [''])[0]
                check('orçamento' in msg and 'Município:' in msg, context + 'Missing service quote brief')
    payloads = [json.loads(x.text()) for x in doc.all('script') if x.get('type') == 'application/ld+json']
    check(len(payloads) == 1, context + 'Single structured graph')
    graph = payloads[0]['@graph']
    entity = next(x for x in graph if x.get('@id') == ORIGIN + '/#empresa')
    check(entity['telephone'] == '+55 94 98106-8031' and entity['address']['addressLocality'] == 'Marabá', context + 'Business identity mismatch')
    if pathname != '/':
        by_type = {x['@type']:x for x in graph if isinstance(x.get('@type'),str)}
        check({'WebPage','Service','BreadcrumbList','WebSite'} <= set(by_type), context + 'Required schema types')
        service = by_type['Service']
        check(service['url'] == ORIGIN + pathname and service['name'] == doc.all('h1')[0].text(), context + 'Service does not match page')
        check(service['provider']['@id'] == entity['@id'], context + 'Service provider')
        check(by_type['WebPage']['mainEntity']['@id'] == service['@id'], context + 'WebPage main entity')
        crumbs = by_type['BreadcrumbList']['itemListElement']
        check([x['position'] for x in crumbs] == [1,2] and crumbs[-1]['item'] == ORIGIN + pathname, context + 'Breadcrumb schema')
        check('FAQPage' not in by_type, context + 'No FAQ rich-result claims for commercial pages')
        check(len(doc.all('main')[0].text().split()) >= 600, context + 'Missing substantial static content')
        check(len(list(doc.all('main')[0].all('details'))) >= 5, context + 'Missing native FAQs')
        for script in doc.all('script'):
            if script.get('src'):
                check('defer' in script.attrs, context + 'Blocking script')
        size = sum(p.stat().st_size for p in assets if p.is_file())
        check(size < 220_000, context + f'Initial HTML/CSS/JS/logo/font budget exceeded: {size}')
        resources_report.append({'path': pathname, 'html_bytes': (ROOT / pathname.lstrip('/') / 'index.html').stat().st_size, 'html_css_js_logo_font_bytes':size})

check(len(titles) == len(set(titles)), 'Duplicate page titles')
check(len(descriptions) == len(set(descriptions)), 'Duplicate descriptions')
seen, queue = set(), ['/']
while queue:
    current = queue.pop()
    if current in seen:
        continue
    seen.add(current)
    queue.extend(internal_graph[current] - seen)
check(seen == set(pages), 'Orphan pages')
for pathname in pages:
    check('/' in internal_graph[pathname] or pathname == '/', pathname + ': Missing return path')
    check(set(pages)-{pathname} <= internal_graph[pathname], pathname + ': Missing cross-service navigation')

# CSS references must resolve even when a selector is only used on the homepage.
for css in ROOT.glob('*.css'):
    for value in re.findall(r'url\([\'\"]?([^\)\'\"]+)', css.read_text()):
        target, url = local_target(value, '/')
        check(target is not None and target.is_file(), css.name + ': Missing CSS asset ' + value)
check((ROOT/'app.js').stat().st_size < 8_000, 'JavaScript size budget')
check(sum(p.stat().st_size for p in ROOT.glob('*.css')) < 70_000, 'CSS size budget')

# Protect published anchors, business assets, verification and the form contract.
try:
    old = subprocess.check_output(['git','show',BASELINE+':index.html'],cwd=ROOT,text=True)
    previous = Document(old)
    check({x.get('id') for x in previous.all() if x.get('id')} <= {x.get('id') for x in pages['/'].all()}, 'Published homepage anchors removed')
    original_form = next(x for x in previous.all('form') if x.get('id') == 'quote-form')
    current_form = next(x for x in pages['/'].all('form') if x.get('id') == 'quote-form')
    # Copy and service choices may evolve; keep field IDs/types and constraints
    # so the existing WhatsApp flow still works after the commercial redesign.
    fields = ('input', 'select', 'textarea')
    old_fields = {x.get('id'):x for x in original_form.all() if x.tag in fields}
    new_fields = {x.get('id'):x for x in current_form.all() if x.tag in fields}
    check(old_fields.keys() == new_fields.keys(), 'Homepage form fields removed/renamed')
    for field_id, old_field in old_fields.items():
        new_field = new_fields[field_id]
        check(old_field.tag == new_field.tag, 'Form field type changed: ' + field_id)
        for attribute in ('type', 'name', 'maxlength', 'autocomplete', 'required', 'readonly'):
            check(old_field.attrs.get(attribute) == new_field.attrs.get(attribute), 'Form contract changed: ' + field_id + '/' + attribute)
    choices = {x.get('value') or x.text().strip() for x in current_form.all('option')}
    required_services = {'Gestão e licenciamento ambiental', 'Regularização rural',
                         'Recursos hídricos e poços', 'Segurança do trabalho',
                         'Máquinas e serviços em campo', 'Embargos ambientais',
                         'Regularização agronômica', 'Pecuária e confinamentos',
                         'Medição de ruído industrial com sonômetro'}
    check(required_services <= choices, 'Missing service in quote selector')
    for filename in ['CNAME','robots.txt','googlebb000e05e4119fe0.html','favicon.ico','apple-touch-icon.png']:
        check(subprocess.check_output(['git','show',BASELINE+':'+filename],cwd=ROOT) == (ROOT/filename).read_bytes(), 'Published file changed: '+filename)
    old_assets = subprocess.check_output(['git','ls-tree','-r','--name-only',BASELINE,'assets'],cwd=ROOT,text=True).splitlines()
    for filename in old_assets:
        check(subprocess.check_output(['git','show',BASELINE+':'+filename],cwd=ROOT) == (ROOT/filename).read_bytes(), 'Published asset changed: '+filename)
except subprocess.CalledProcessError:
    check(False, 'Baseline unavailable. Run from a full git clone, not a shallow archive.')

# WCAG contrast calculation for the solid text/background pairs used by new pages.
def luminance(color):
    values=[int(color[i:i+2],16)/255 for i in (1,3,5)]
    values=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in values]
    return sum(v*w for v,w in zip(values,(.2126,.7152,.0722)))
for fg,bg in [('#183c35','#ffffff'),('#587068','#ffffff'),('#587068','#edf3e9'),('#ffffff','#074bab'),('#b5df91','#103c2c'),('#d8eaca','#103c2c'),('#bdd7fa','#074bab')]:
    a,b=sorted([luminance(fg),luminance(bg)])
    contrast=(b+.05)/(a+.05)
    check(contrast>=4.5,f'Insufficient text contrast {fg}/{bg}: {contrast:.2f}')

for report in resources_report:
    print(json.dumps(report,ensure_ascii=False))
if errors:
    print('\nFAIL — '+str(len(errors))+' errors in '+str(checks)+' checks')
    for error in errors:
        print(' - '+error)
    raise SystemExit(1)
print(f'PASS — {checks} offline checks across {len(pages)} pages. Browser QA and live headers are separate gates.')
