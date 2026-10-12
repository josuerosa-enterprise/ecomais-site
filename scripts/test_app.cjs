'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

class Element {
  constructor(attrs = {}) {
    this.attrs = attrs;
    this.listeners = {};
    this.hidden = true;
    this.value = '';
    this.textContent = '';
    this.links = [];
    this.classes = new Set();
    this.classList = { toggle: (name, state) => state ? this.classes.add(name) : this.classes.delete(name) };
  }
  setAttribute(name, value) { this.attrs[name] = value; }
  getAttribute(name) { return this.attrs[name]; }
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
  async fire(type, event = {}) { for (const handler of this.listeners[type] || []) await handler(event); }
  querySelectorAll(selector) { return selector === 'a' ? this.links : []; }
  querySelector(selector) { return selector === 'summary' ? this.summary : null; }
  contains(target) { return target === this || target === this.summary || this.links.includes(target); }
  focus() { this.focused = true; }
  select() { this.selected = true; }
}

function boot({ home = false, empty = false, clipboardFails = false, observer = true } = {}) {
  const elements = new Map();
  for (const id of empty ? [] : ['.menu-toggle', '#mobile-nav', '#year', '.whatsapp-float', '#orcamento']) elements.set(id, new Element());
  if (home) for (const id of ['#quote-form', '#request-preview', '#email-fallback', '#retry-whatsapp', '#copy-status', '#copy-request']) elements.set(id, new Element());
  const doc = new Element();
  const nav = empty ? null : new Element();
  if (nav) { nav.summary = new Element(); nav.links = [new Element()]; }
  doc.querySelector = selector => elements.get(selector) || null;
  doc.querySelectorAll = selector => selector === '.nav-services' && nav ? [nav] : [];
  const opened = [], copied = [], observed = [], media = new Element();
  const window = { open: (...args) => opened.push(args), matchMedia: () => media };
  function IntersectionObserver(callback) { this.observe = el => observed.push({ el, callback }); }
  if (observer) window.IntersectionObserver = IntersectionObserver;
  const button = elements.get('.menu-toggle');
  if (button) button.setAttribute('aria-expanded', 'false');
  if (elements.has('#mobile-nav')) elements.get('#mobile-nav').links = [new Element()];
  if (home) {
    const form = elements.get('#quote-form');
    form.valid = true;
    form.reportValidity = () => form.valid;
    form.fields = { service: 'Regularização rural', name: '  José  ', city: 'Marabá / PA', message: 'CAR com pendência & prazo\nPreciso de avaliação.' };
  }
  const context = vm.createContext({ document: doc, window, IntersectionObserver, FormData: class { constructor(form) { this.form = form; } get(key) { return this.form.fields[key]; } }, navigator: { clipboard: { async writeText(text) { if (clipboardFails) throw new Error('Unavailable'); copied.push(text); } } }, Date });
  vm.runInContext(source, context);
  return { elements, doc, nav, opened, copied, observed, media, context };
}

test('service pages run without the homepage form; missing optional elements are safe', () => {
  assert.doesNotThrow(() => boot());
  assert.doesNotThrow(() => boot({ empty: true, observer: false }));
});

test('mobile navigation opens, closes after navigation, and Escape restores focus', async () => {
  const ui = boot();
  const button = ui.elements.get('.menu-toggle'), menu = ui.elements.get('#mobile-nav');
  await button.fire('click');
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(button.getAttribute('aria-label'), 'Fechar menu');
  assert.equal(menu.hidden, false);
  await menu.links[0].fire('click');
  assert.equal(menu.hidden, true);
  await button.fire('click');
  await ui.doc.fire('keydown', { key: 'Escape' });
  assert.equal(menu.hidden, true);
  assert.equal(button.focused, true);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  await button.fire('click');
  await ui.media.fire('change');
  assert.equal(menu.hidden, true);
});

test('desktop services closes by Escape, outside click, and choosing a link', async () => {
  const ui = boot();
  ui.nav.open = true;
  await ui.nav.fire('keydown', { key: 'Escape' });
  assert.equal(ui.nav.open, false);
  assert.equal(ui.nav.summary.focused, true);
  ui.nav.open = true;
  await ui.doc.fire('click', { target: ui.nav.summary });
  assert.equal(ui.nav.open, true);
  await ui.doc.fire('click', { target: new Element() });
  assert.equal(ui.nav.open, false);
  ui.nav.open = true;
  await ui.nav.links[0].fire('click');
  assert.equal(ui.nav.open, false);
});

test('homepage quote preserves accents, line breaks, destination and fallback without sending', async () => {
  const ui = boot({ home: true });
  let prevented = false;
  await ui.elements.get('#quote-form').fire('submit', { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(ui.opened.length, 1);
  const [url, target, features] = ui.opened[0];
  const parsed = new URL(url), message = parsed.searchParams.get('text');
  assert.equal(parsed.origin + parsed.pathname, 'https://wa.me/5594981068031');
  assert.match(message, /Solução: Regularização rural/);
  assert.match(message, /Nome: José\nCidade \/ UF: Marabá \/ PA/);
  assert.match(message, /CAR com pendência & prazo\nPreciso de avaliação/);
  assert.equal(ui.elements.get('#request-preview').value, message);
  assert.equal(ui.elements.get('#retry-whatsapp').href, url);
  assert.equal(ui.elements.get('#email-fallback').hidden, false);
  assert.equal(target, '_blank');
  assert.equal(features, 'noopener,noreferrer');
});

test('invalid form never opens WhatsApp; omitted optional values never become undefined', async () => {
  const ui = boot({ home: true }), form = ui.elements.get('#quote-form');
  form.valid = false;
  await form.fire('submit', { preventDefault() {} });
  assert.equal(ui.opened.length, 0);
  form.valid = true;
  form.fields = { service: 'Preciso de orientação' };
  await form.fire('submit', { preventDefault() {} });
  const message = new URL(ui.opened[0][0]).searchParams.get('text');
  assert.doesNotMatch(message, /undefined|null|Nome:|Cidade \/ UF:|Sobre o projeto:/);
});

test('copy fallback works with and without Clipboard API access', async () => {
  for (const clipboardFails of [false, true]) {
    const ui = boot({ home: true, clipboardFails });
    ui.elements.get('#request-preview').value = 'Mensagem pronta';
    await ui.elements.get('#copy-request').fire('click');
    if (clipboardFails) {
      assert.equal(ui.elements.get('#request-preview').focused, true);
      assert.equal(ui.elements.get('#request-preview').selected, true);
      assert.match(ui.elements.get('#copy-status').textContent, /Texto selecionado/);
    } else {
      assert.deepEqual(ui.copied, ['Mensagem pronta']);
      assert.match(ui.elements.get('#copy-status').textContent, /Mensagem copiada/);
    }
  }
});

test('floating CTA hides at contact section without hiding a keyboard-focused link', () => {
  const ui = boot(), floating = ui.elements.get('.whatsapp-float');
  const observed = ui.observed[0];
  assert.equal(observed.el, ui.elements.get('#orcamento'));
  observed.callback([{ isIntersecting: true }]);
  assert.equal(floating.classes.has('is-hidden'), true);
  observed.callback([{ isIntersecting: false }]);
  assert.equal(floating.classes.has('is-hidden'), false);
  ui.doc.activeElement = floating;
  observed.callback([{ isIntersecting: true }]);
  assert.equal(floating.classes.has('is-hidden'), false);
});
