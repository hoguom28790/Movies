"use client";
 
import React, { createContext, useContext, useEffect, useState } from "react";
 
interface DeviceContextType {
  isIOS: boolean;
  isIPhone: boolean;
  isIPad: boolean;
  isTouch: boolean;
}
 
const DeviceContext = createContext<DeviceContextType>({
  isIOS: false,
  isIPhone: false,
  isIPad: false,
  isTouch: false,
});
 
export const DeviceProvider = ({ children }: { children: React.ReactNode }) => {
  const [device, setDevice] = useState<DeviceContextType>({
    isIOS: false,
    isIPhone: false,
    isIPad: false,
    isTouch: false,
  });
 
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIPhone = /iPhone/i.test(ua);
    const isIPad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIOS = isIPhone || isIPad;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
 
    setDevice({ isIOS, isIPhone, isIPad, isTouch });
 
    // Inject global classes to HTML for CSS targeting
    const root = document.documentElement;
    if (isIOS) root.classList.add('is-ios');
    if (isIPhone) root.classList.add('is-iphone');
    if (isIPad) root.classList.add('is-ipad');
    if (isTouch) root.classList.add('is-touch');
 
    // Handle viewport height on mobile (the 100vh issue)
    const setVH = () => {
      let vh = window.innerHeight * 0.01;
      root.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  }, []);
 
  return (
    <DeviceContext.Provider value={device}>
      {children}
    </DeviceContext.Provider>
  );
};
 
export const useDevice = () => useContext(DeviceContext);
