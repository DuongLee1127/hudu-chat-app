'use client';

import { useSyncExternalStore } from 'react';

const subscribe = (query: string) => (callback: () => void) => {
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener('change', callback);
  return () => mediaQueryList.removeEventListener('change', callback);
};

const getServerSnapshot = () => false;

export const useMediaQuery = (query: string) =>
  useSyncExternalStore(subscribe(query), () => window.matchMedia(query).matches, getServerSnapshot);

export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
