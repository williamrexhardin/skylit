'use strict';
(() => {
  const host=document.querySelector('[data-module="spotify"] .dashboard-module-content');
  if(host)SkylitUI.mountSpotify(host);
  SkylitUI.mountSpotify(document.getElementById('spotify-page-player'),true);
  SkylitUI.mountNavigation(document.getElementById('frame-navigation-controls'));
  document.getElementById('spotify-add-widget').onclick=()=>SkylitDashboard.chooseWidget('spotify');
  const recovery=document.createElement('article');recovery.className='card setting-block';const recoveryTitle=document.createElement('h3');recoveryTitle.textContent='Return from Android apps';const recoveryBody=document.createElement('div');recovery.append(recoveryTitle,recoveryBody);SkylitApp.settingsSurface.panels.get('frame').append(recovery);SkylitUI.mountNavigation(recoveryBody);
  const panel=SkylitApp.settingsSurface.panels.get('services');
  const card=document.createElement('article');card.className='card setting-block';card.id='spotify-settings';
  const title=document.createElement('h3');title.textContent='Spotify';
  const body=document.createElement('div');card.append(title,body);panel.append(card);SkylitUI.mountSpotify(body,true);
})();
