import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './office/App';
import './style.css';
// The browser chrome color comes from the same token file as every other color.
const themeColor=getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
if(themeColor)document.querySelector('meta[name="theme-color"]')?.setAttribute('content',themeColor);
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
