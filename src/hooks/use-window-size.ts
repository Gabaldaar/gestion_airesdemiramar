
'use client';

import { useState, useEffect } from 'react';

// Define the state type
interface Size {
  width: number | undefined;
  height: number | undefined;
}

// Hook
export default function useWindowSize(): Size {
  // Initialize state with the client's window size to avoid hydration issues on navigation.
  const [windowSize, setWindowSize] = useState<Size>({
    width: typeof window !== 'undefined' ? window.innerWidth : undefined,
    height: typeof window !== 'undefined' ? window.innerHeight : undefined,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}
