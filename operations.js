'use strict';
// Manual campaign selector: no automatic motion or unexpected content changes.
const operationScenes = {
  maquinas: { image:'/assets/jcb-3cx-plus-operacao.webp', alt:'Cena ilustrativa de retroescavadeira JCB 3CX Plus em operação rural', kicker:'ECOMAIS · MÁQUINAS E SOLUÇÕES AMBIENTAIS', title:'Inteligência ambiental.', emphasis:'Força para realizar.', description:'Consultoria, regularização e máquinas para transformar as necessidades do seu empreendimento em um plano de ação.' },
  ambiental: { image:'/assets/paisagem-ambiental-ecomais.webp', alt:'Paisagem ilustrativa de rio, floresta e área rural', kicker:'CONSULTORIA AMBIENTAL E RURAL', title:'Seu empreendimento.', emphasis:'No caminho da regularização.', description:'Licenciamento ambiental, CAR, outorgas e apoio técnico para organizar as próximas etapas da sua empresa ou propriedade.' },
  seguranca: { image:'/assets/medicao-ruido-sonometro.webp', alt:'Cena ilustrativa de medição de ruído com sonômetro por profissional uniformizada ECOMAIS', kicker:'SEGURANÇA E AVALIAÇÃO TÉCNICA', title:'Conhecer os impactos.', emphasis:'Orientar as decisões.', description:'Medição de ruído ambiental e industrial, programas e laudos para apoiar a gestão da sua operação.' }
};
const sceneButtons = document.querySelectorAll('[data-scene]');
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
}));
