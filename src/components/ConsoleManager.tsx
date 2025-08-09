"use client";

import { useEffect } from 'react';

export const ConsoleManager = () => {
  useEffect(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args: any[]) => {
      const message = args[0];
      
      if (typeof message === 'string' && 
          (message.includes('Performance warning! LoadScript has been reloaded') ||
           message.includes('google.maps.places.Autocomplete is not available') ||
           message.includes('google.maps.Marker is deprecated') ||
           message.includes('As of March 1st, 2025, google.maps.places.Autocomplete') ||
           message.includes('As of February 21st, 2024, google.maps.Marker is deprecated'))) {
        return;
      }
      
      originalWarn.apply(console, args);
    };

    if (process.env.NODE_ENV === 'production') {
      console.warn = () => {};
      console.error = () => {};
    }

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return null;
};
