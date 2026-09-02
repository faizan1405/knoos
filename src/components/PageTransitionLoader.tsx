"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";

function LoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // When the route or search params change, navigation has finished rendering.
    // Next.js App Router updates pathname and searchParams AFTER the new route renders.
    setIsLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const startLoading = () => {
      setIsLoading(true);
      // Fallback timeout to clear loader if navigation fails or gets stuck
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
    };

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target || !target.href) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      if (target.target === "_blank") return;

      try {
        const url = new URL(target.href);
        const currentUrl = new URL(window.location.href);

        if (url.origin !== currentUrl.origin) return;
        // Ignore same page navigation (e.g. hash links or just query changes)
        if (url.pathname === currentUrl.pathname) return;
        // Exclude specific static assets
        if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip)$/i)) return;

        startLoading();
      } catch (err) {
        // Ignored
      }
    };

    const handlePopState = () => {
      // Browser back/forward
      startLoading();
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (data, unused, url) {
      if (url) {
        try {
          const targetUrl = new URL(url.toString(), window.location.origin);
          if (targetUrl.pathname !== window.location.pathname) {
            startLoading();
          }
        } catch (e) {}
      }
      return originalPushState.apply(this, [data, unused, url]);
    };

    window.history.replaceState = function (data, unused, url) {
      if (url) {
        try {
          const targetUrl = new URL(url.toString(), window.location.origin);
          if (targetUrl.pathname !== window.location.pathname) {
            startLoading();
          }
        } catch (e) {}
      }
      return originalReplaceState.apply(this, [data, unused, url]);
    };

    document.addEventListener("click", handleAnchorClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 400); // Wait for fade out
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  if (!visible && !isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-md transition-opacity duration-400 ease-in-out ${
        isLoading ? "opacity-100" : "opacity-0"
      } motion-reduce:transition-opacity`}
      style={{ pointerEvents: isLoading ? "auto" : "none" }}
    >
      <div className="relative flex items-center justify-center">
        {/* Animated outer ring */}
        <div 
          className="absolute w-32 h-32 rounded-full border border-brand-gray-200 dark:border-brand-gray-800 border-t-brand-black dark:border-t-white animate-spin motion-reduce:hidden" 
          style={{ animationDuration: '1s' }} 
        />
        
        {/* Soft pulsing glow */}
        <div 
          className="absolute w-24 h-24 rounded-full bg-brand-black/5 dark:bg-white/5 animate-pulse motion-reduce:hidden blur-2xl" 
          style={{ animationDuration: '2s' }} 
        />
        
        {/* Logo container */}
        <div 
          className="relative w-20 h-20 flex items-center justify-center animate-pulse motion-reduce:animate-none" 
          style={{ animationDuration: '2s' }}
        >
          <Image
            src="/knoos-logo.png"
            alt="Loading..."
            fill
            className="object-contain p-2"
            priority
          />
        </div>
      </div>
    </div>
  );
}

export function PageTransitionLoader() {
  return (
    <Suspense fallback={null}>
      <LoaderContent />
    </Suspense>
  );
}
