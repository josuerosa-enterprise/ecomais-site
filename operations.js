'use strict';
// Automatic seven-second carousel with manual selection and a shared pause control.
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
let rotationTimer;
const sceneOrder=Object.keys(operationScenes);
function scheduleRotation() {
  clearTimeout(rotationTimer);
  if(requestedMotion && heroVisible && !document.hidden) {
    rotationTimer=setTimeout(()=>selectScene(sceneOrder[(sceneOrder.indexOf(selectedScene)+1)%sceneOrder.length]),7000);
  }
}

function updateMotionButton() {
  const playing=requestedMotion;
  const label=playing?'Pausar animação':'Reproduzir animação';
  motionButton.setAttribute('aria-label',label+' de abertura');
  motionButton.querySelector('span').textContent=label;
  motionButton.querySelector('path').setAttribute('d',playing?'M7 5h3v14H7zm7 0h3v14h-3z':'M8 5v14l11-7z');
}
function syncMotion() {
  scheduleRotation();
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
    requestedMotion=!requestedMotion;
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
function selectScene(key) {
  const scene=operationScenes[key];
  if(!scene || !scenePhoto || !sceneTitle) return;
  if(key!==selectedScene && !motionPreference.matches) {
    const outgoing=scenePhoto.cloneNode();
    outgoing.removeAttribute('id');
    outgoing.alt='';
    outgoing.setAttribute('aria-hidden','true');
    document.querySelector('.operation-hero').prepend(outgoing);
    outgoing.animate([{transform:'translateX(0)'},{transform:'translateX(-100%)'}],{duration:650,easing:'ease-in-out'}).finished.finally(()=>outgoing.remove());
    document.querySelector('.operation-media').animate([{transform:'translateX(100%)'},{transform:'translateX(0)'}],{duration:650,easing:'ease-in-out'});
    document.querySelector('.operation-content').animate([{opacity:0,transform:'translateX(35px)'},{opacity:1,transform:'translateX(0)'}],{duration:650,easing:'ease-out'});
  }
  scenePhoto.src=scene.image; scenePhoto.alt=scene.alt;
  document.querySelector('#operation-kicker').textContent=scene.kicker;
  document.querySelector('#operation-description').textContent=scene.description;
  const emphasis=document.createElement('em'); emphasis.textContent=scene.emphasis;
  sceneTitle.replaceChildren(document.createTextNode(scene.title),document.createElement('br'),emphasis);
  sceneButtons.forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.scene===key)));
  if(selectedScene!==key && heroVideo) {
    selectedScene=key;
    changeVideo();
  }
  scheduleRotation();
}
sceneButtons.forEach(button=>button.addEventListener('click',()=>selectScene(button.dataset.scene)));
