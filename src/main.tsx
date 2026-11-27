import React from 'react';
import { createRoot } from 'react-dom/client';
import { officeSound } from './office/sound/player';
import { bindSoundInteractions } from './office/sound/interactions';
import App from './office/App';
import './style.css';
// The browser chrome color comes from the same token file as every other color.
const themeColor=getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
if(themeColor)document.querySelector('meta[name="theme-color"]')?.setAttribute('content',themeColor);
void officeSound.preload().catch(() => { /* Audio is optional on unsupported devices. */ });
const releaseSoundEvents = bindSoundInteractions(document);
if (import.meta.hot) import.meta.hot.dispose(releaseSoundEvents);
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
