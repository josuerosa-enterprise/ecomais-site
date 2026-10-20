'use strict';
const WHATSAPP_NUMBER = '5594981068031';
const UNIT_CONTACTS = {
  maraba: { number: '5594981068031', label: 'Marabá' },
  'novo-repartimento': { number: '5594991614641', label: 'Novo Repartimento' }
};
function whatsappLink(message, unit) {
  const number = UNIT_CONTACTS[unit]?.number || WHATSAPP_NUMBER;
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
}
function quoteMessage(data) {
  const details = [
    'Olá, equipe ECOMAIS! Gostaria de orientação técnica e orçamento.',
    '', 'Solução: ' + data.service,
    'Unidade: ' + (UNIT_CONTACTS[data.unit]?.label || 'Marabá'),
    data.name ? 'Nome: ' + data.name : '',
    data.city ? 'Cidade / UF: ' + data.city : '',
    data.message ? '\nSobre o projeto:\n' + data.message : ''
  ];
  return details.filter((line, index) => line || index === 1).join('\n');
}
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
  mobileNav.hidden = true;
}
if (menuButton && mobileNav) {
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    menuButton.setAttribute('aria-label', expanded ? 'Abrir menu' : 'Fechar menu');
    mobileNav.hidden = expanded;
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); }
  });
  if (window.matchMedia) window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);
}
document.querySelectorAll('.nav-services').forEach(menu => {
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
  document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
});
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
// Service discovery is progressively enhanced: every service remains visible without JS.
const filterGroup = document.querySelector('.service-filters');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const serviceCards = [...document.querySelectorAll('.solution-card')];
const moreServices = document.querySelector('#show-all-services');
const servicesStatus = document.querySelector('#services-status');
let activeFilter = 'all';
let expandedServices = false;
function renderServices() {
  const matching = serviceCards.filter(card => activeFilter === 'all' || card.dataset.category === activeFilter);
  const visible = activeFilter === 'all' && !expandedServices ? matching.slice(0, 3) : matching;
  serviceCards.forEach(card => { card.hidden = !visible.includes(card); });
  filterButtons.forEach(button => {
    const active = button.dataset.filter === activeFilter;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('active', active);
  });
  if (servicesStatus) servicesStatus.textContent = visible.length + (visible.length === 1 ? ' solução para o seu projeto.' : ' soluções para o seu projeto.');
  if (moreServices) {
    moreServices.hidden = activeFilter !== 'all' || matching.length <= 3;
    moreServices.firstChild.textContent = expandedServices ? 'Mostrar principais soluções ' : 'Ver todas as soluções (9) ';
  }
}
if (filterGroup && serviceCards.length) {
  filterGroup.hidden = false;
  filterButtons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    expandedServices = false;
    renderServices();
  }));
  moreServices?.addEventListener('click', () => {
    expandedServices = !expandedServices;
    renderServices();
    if (expandedServices) serviceCards[3]?.querySelector('a')?.focus({ preventScroll: true });
    else document.querySelector('#solucoes')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
  function revealLinkedService() {
    const id = window.location.hash.slice(1);
    const target = serviceCards.find(card => card.id === id);
    if (!target) return;
    activeFilter = 'all';
    expandedServices = true;
    renderServices();
    target.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  renderServices();
  revealLinkedService();
  window.addEventListener('hashchange', revealLinkedService);
}
const rail = document.querySelector('.clients-rail');
const railControls = document.querySelector('.rail-controls');
if (rail && railControls) {
  railControls.hidden = false;
  document.querySelector('[data-clients-prev]')?.addEventListener('click', () => rail.scrollBy({ left: -rail.clientWidth * .8, behavior: reducedMotion ? 'auto' : 'smooth' }));
  document.querySelector('[data-clients-next]')?.addEventListener('click', () => rail.scrollBy({ left: rail.clientWidth * .8, behavior: reducedMotion ? 'auto' : 'smooth' }));
}
const form = document.querySelector('#quote-form');
const preview = document.querySelector('#request-preview');
const firstStep = document.querySelector('[data-form-step="1"]');
const secondStep = document.querySelector('[data-form-step="2"]');
const serviceSelect = document.querySelector('#service');
const selectedService = document.querySelector('#selected-service');
let formStep = 1;
function updateSelectedService() {
  if (selectedService && serviceSelect) {
    selectedService.hidden = !serviceSelect.value;
    selectedService.textContent = 'Seu projeto: ' + (serviceSelect.selectedOptions[0]?.textContent || serviceSelect.value);
  }
}
function showFormStep(step, moveFocus = false) {
  if (!firstStep || !secondStep) return;
  formStep = step;
  firstStep.hidden = step !== 1;
  secondStep.hidden = step !== 2;
  document.querySelectorAll('[data-step-label]').forEach(label => {
    const active = Number(label.dataset.stepLabel) === step;
    label.classList.toggle('active', active);
    if (active) label.setAttribute('aria-current', 'step');
    else label.removeAttribute('aria-current');
  });
  updateSelectedService();
  if (moveFocus) (step === 1 ? serviceSelect : document.querySelector('#name'))?.focus({ preventScroll: true });
}
function nextFormStep() {
  if (!serviceSelect?.reportValidity()) return;
  showFormStep(2, true);
}
if (form && firstStep && secondStep) {
  document.querySelector('.form-progress').hidden = false;
  document.querySelector('#form-next').hidden = false;
  document.querySelector('#form-back').hidden = false;
  document.querySelector('#form-next').addEventListener('click', nextFormStep);
  document.querySelector('#form-back').addEventListener('click', () => {
    document.querySelector('#email-fallback').hidden = true;
    showFormStep(1, true);
  });
  serviceSelect.addEventListener('change', updateSelectedService);
  showFormStep(1);
}
document.querySelectorAll('[data-quote-service]').forEach(link => {
  link.addEventListener('click', () => {
    if (!serviceSelect) return;
    serviceSelect.value = link.dataset.quoteService;
    document.querySelector('#email-fallback').hidden = true;
    showFormStep(1);
  });
});
if (form && preview) form.addEventListener('submit', event => {
  event.preventDefault();
  if (firstStep && formStep === 1) { nextFormStep(); return; }
  if (!form.reportValidity()) return;
  const fields = new FormData(form);
  const data = Object.fromEntries(['name','city','service','message','unit'].map(key => [key, String(fields.get(key) || '').trim()]));
  const body = quoteMessage(data);
  const url = whatsappLink(body, data.unit);
  preview.value = body;
  document.querySelector('#email-fallback').hidden = false;
  document.querySelector('#retry-whatsapp').href = url;
  document.querySelector('#copy-status').textContent = '';
  window.open(url, '_blank', 'noopener,noreferrer');
});
document.querySelector('#copy-request')?.addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try { await navigator.clipboard.writeText(preview.value); status.textContent = 'Mensagem copiada. Cole no WhatsApp para enviar.'; }
  catch { preview.focus(); preview.select(); status.textContent = 'Texto selecionado. Use a opção Copiar do seu dispositivo.'; }
});
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
const floatingContact = document.querySelector('.whatsapp-float');
const mobileContact = document.querySelector('.mobile-cta');
const contactSection = document.querySelector('#orcamento');
if ('IntersectionObserver' in window && contactSection) {
  const observer = new IntersectionObserver(entries => {
    const inContact = entries[0].isIntersecting;
    [floatingContact, mobileContact].filter(Boolean).forEach(element => {
      element.classList.toggle('is-hidden', inContact && !element.contains(document.activeElement));
    });
  }, { threshold: 0 });
  observer.observe(contactSection);
}

