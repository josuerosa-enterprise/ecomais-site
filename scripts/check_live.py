#!/usr/bin/env python3
"""Check actual HTTP behavior after deployment; never publishes or submits to Google.
python3 scripts/check_live.py                  # all canonical URLs, after merge
python3 scripts/check_live.py --paths /        # homepage-only baseline check
"""
import argparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser
from html.parser import HTMLParser
import xml.etree.ElementTree as ET

ORIGIN = 'https://ecomaispa.com'
PATHS = ['/', '/retificacao-car-para/', '/licenciamento-ambiental-para/', '/outorga-pocos-para/']
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--paths', nargs='+', choices=PATHS, default=PATHS)
args = parser.parse_args()

class Metadata(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.canonicals, self.robots, self.h1 = [], [], 0
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonicals.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'googlebot'): self.robots.append(attrs.get('content', '').lower())
        if tag == 'h1': self.h1 += 1

def fetch(path):
    request = Request(ORIGIN + path, headers={'User-Agent': 'ECOMAIS-SEO-Check/1.0'})
    with urlopen(request, timeout=25) as response:
        return response.status, response.url, response.headers, response.read().decode('utf-8')

status, final, headers, robots_text = fetch('/robots.txt')
assert status == 200, 'robots.txt unavailable'
robots = RobotFileParser()
robots.parse(robots_text.splitlines())
assert 'Sitemap: ' + ORIGIN + '/sitemap.xml' in robots_text, 'Sitemap declaration missing'
status, final, headers, sitemap_text = fetch('/sitemap.xml')
locations = {node.text for node in ET.fromstring(sitemap_text).findall('.//{*}loc')}
for path in args.paths:
    assert robots.can_fetch('Googlebot', ORIGIN + path), 'Blocked by robots: ' + path
    assert ORIGIN + path in locations, 'Canonical absent from live sitemap: ' + path
    status, final, headers, body = fetch(path)
    assert status == 200 and final == ORIGIN + path, 'Canonical HTTP result: ' + path
    assert 'text/html' in headers.get('Content-Type', ''), 'Not HTML: ' + path
    assert 'noindex' not in headers.get('X-Robots-Tag', '').lower(), 'X-Robots-Tag blocks indexing: ' + path
    metadata = Metadata(body)
    assert metadata.canonicals == [ORIGIN + path], 'Wrong canonical (or home fallback): ' + path
    assert metadata.h1 == 1 and not any('noindex' in x for x in metadata.robots), 'HTML not indexable: ' + path
    if path != '/':
        status, final, _, body = fetch(path.rstrip('/'))
        assert final == ORIGIN + path, 'Slashless URL did not normalize: ' + path
        assert Metadata(body).canonicals == [ORIGIN + path], 'Slashless duplicate: ' + path
    print('PASS HTTP / canonical / robots / sitemap:', ORIGIN + path)
try:
    fetch('/_ecomais-seo-missing-page-check_/')
except HTTPError as error:
    assert error.code == 404, 'Missing URL should return HTTP 404'
else:
    raise AssertionError('Missing URL returned success: possible soft 404')
print('PASS — unknown URL returns 404. Indexability is not proof of Google indexing.')
