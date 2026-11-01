'use strict';
(() => {
  const host=document.querySelector('[data-module="spotify"] .dashboard-module-content');
  if(host)SkylitUI.mountSpotify(host);
  const panel=SkylitApp.settingsSurface.panels.get('services');
  const card=document.createElement('article');card.className='card setting-block';card.id='spotify-settings';
  const title=document.createElement('h3');title.textContent='Spotify';
  const body=document.createElement('div');card.append(title,body);panel.append(card);SkylitUI.mountSpotify(body,true);
})();
