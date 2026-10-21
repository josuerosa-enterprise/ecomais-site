'use strict';
// Campaign text changes only when the visitor chooses a scene.
const operationScenes = {
  maquinas: { image:'/assets/jcb-3cx-plus-operacao.webp', alt:'Cena ilustrativa de retroescavadeira JCB 3CX Plus em operação rural', kicker:'ECOMAIS · MÁQUINAS E SOLUÇÕES AMBIENTAIS', title:'Inteligência ambiental.', emphasis:'Força para realizar.', description:'Consultoria, regularização e máquinas para transformar as necessidades do seu empreendimento em um plano de ação.' },
  ambiental: { image:'/assets/paisagem-ambiental-ecomais.webp', alt:'Paisagem ilustrativa de rio, floresta e área rural', kicker:'CONSULTORIA AMBIENTAL E RURAL', title:'Seu empreendimento.', emphasis:'No caminho da regularização.', description:'Licenciamento ambiental, CAR, outorgas e apoio técnico para organizar as próximas etapas da sua empresa ou propriedade.' },
  seguranca: { image:'/assets/medicao-ruido-sonometro.webp', alt:'Cena ilustrativa de medição de ruído com sonômetro por profissional uniformizada ECOMAIS', kicker:'SEGURANÇA E AVALIAÇÃO TÉCNICA', title:'Conhecer os impactos.', emphasis:'Orientar as decisões.', description:'Medição de ruído ambiental e industrial, programas e laudos para apoiar a gestão da sua operação.' }
};
const sceneButtons = document.querySelectorAll('[data-scene]');
operationScenes.ambiental.image='/assets/equipe-ecomais-campo.webp';
operationScenes.ambiental.alt='Cena ilustrativa de profissionais ECOMAIS analisando um projeto em campo';
const heroVideo=document.querySelector('#operation-video');
const motionButton=document.querySelector('#operation-motion');
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let selectedScene='maquinas';
let requestedMotion=!motionPreference.matches && !navigator.connection?.saveData;
let heroVisible=true;
let videoGeneration=0;

function updateMotionButton() {
  const playing=!heroVideo.paused;
  const label=playing?'Pausar vídeo':'Reproduzir vídeo';
  motionButton.setAttribute('aria-label',label+' de abertura');
  motionButton.querySelector('span').textContent=label;
  motionButton.querySelector('path').setAttribute('d',playing?'M7 5h3v14H7zm7 0h3v14h-3z':'M8 5v14l11-7z');
}
function syncMotion() {
  if(!requestedMotion || !heroVisible || document.hidden) {
    heroVideo.pause();
    updateMotionButton();
    return;
  }
  if(!heroVideo.getAttribute('src')) {
    heroVideo.src='/assets/hero-'+selectedScene+'.mp4';
    heroVideo.load();
  }
  const generation=videoGeneration;
  heroVideo.play().catch(()=>{
    if(generation!==videoGeneration) return;
    heroVideo.classList.remove('is-playing');
    updateMotionButton();
  });
}
function changeVideo() {
  videoGeneration++;
  heroVideo.pause();
  heroVideo.classList.remove('is-playing');
  heroVideo.removeAttribute('src');
  heroVideo.load();
  syncMotion();
}
if(heroVideo && motionButton) {
  heroVideo.muted=true;
  motionButton.hidden=false;
  heroVideo.addEventListener('playing',()=>{
    heroVideo.classList.add('is-playing');
    updateMotionButton();
  });
  heroVideo.addEventListener('pause',updateMotionButton);
  heroVideo.addEventListener('error',()=>{
    heroVideo.classList.remove('is-playing');
    updateMotionButton();
  });
  motionButton.addEventListener('click',()=>{
    requestedMotion=heroVideo.paused;
    syncMotion();
  });
  motionPreference.addEventListener('change',event=>{
    requestedMotion=!event.matches;
    if(event.matches) heroVideo.classList.remove('is-playing');
    syncMotion();
  });
  document.addEventListener('visibilitychange',syncMotion);
  if('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{
      heroVisible=entries[0].isIntersecting;
      syncMotion();
    },{threshold:0}).observe(document.querySelector('.operation-hero'));
  }
  syncMotion();
}
const scenePhoto = document.querySelector('#operation-photo');
const sceneTitle = document.querySelector('#hero-title');
sceneButtons.forEach(button => button.addEventListener('click', () => {
  const scene=operationScenes[button.dataset.scene];
  if(!scene || !scenePhoto || !sceneTitle) return;
  scenePhoto.src=scene.image; scenePhoto.alt=scene.alt;
  document.querySelector('#operation-kicker').textContent=scene.kicker;
  document.querySelector('#operation-description').textContent=scene.description;
  const emphasis=document.createElement('em'); emphasis.textContent=scene.emphasis;
  sceneTitle.replaceChildren(document.createTextNode(scene.title),document.createElement('br'),emphasis);
  sceneButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  if(selectedScene!==button.dataset.scene && heroVideo) {
    selectedScene=button.dataset.scene;
    changeVideo();
  }
}));
