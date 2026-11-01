'use strict';
(() => {
 const toggle=document.getElementById('nav-toggle'),root=document.documentElement;
 let collapsed=false;try{collapsed=localStorage.getItem('skylit.navigation')==='compact';}catch(_){}
 function apply(save){
  root.dataset.navCollapsed=String(collapsed);toggle.setAttribute('aria-expanded',String(!collapsed));toggle.setAttribute('aria-label',collapsed?'Expand navigation':'Collapse navigation');toggle.title=toggle.getAttribute('aria-label');
  document.querySelectorAll('#main-nav [data-tab]').forEach(button=>button.title=button.getAttribute('aria-label')||button.textContent.trim());
  if(save)try{localStorage.setItem('skylit.navigation',collapsed?'compact':'expanded');}catch(_){SkylitApp.notify('Could not save navigation preference.');}
  window.dispatchEvent(new Event('skylit-navigation'));
  requestAnimationFrame(()=>{const rail=document.querySelector('.rail').getBoundingClientRect();window.Skylit?.serviceRail?.(rail.right/innerWidth);window.dispatchEvent(new Event('resize'));});
 }
 toggle.onclick=()=>{collapsed=!collapsed;apply(true);};apply(false);
})();
