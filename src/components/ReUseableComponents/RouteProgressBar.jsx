import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

const RouteProgressBar = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let progressTimer;
    let progressInterval;

    const startLoading = (url) => {
      // Don't show progress for shallow routing or hash changes
      if (url && (url.includes("#") || router.asPath === url)) return;

      setLoading(true);
      setProgress(0);

      // Start progress animation
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
    };

    const stopLoading = () => {
      // Complete the progress
      setProgress(100);

      // Clear any existing timers
      clearInterval(progressInterval);
      clearTimeout(progressTimer);

      // Reset after animation completes
      progressTimer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300); // Match this with CSS transition duration
    };

    const handleError = () => {
      stopLoading();
    };

    router.events.on("routeChangeStart", startLoading);
    router.events.on("routeChangeComplete", stopLoading);
    router.events.on("routeChangeError", handleError);

    return () => {
      router.events.off("routeChangeStart", startLoading);
      router.events.off("routeChangeComplete", stopLoading);
      router.events.off("routeChangeError", handleError);
      clearInterval(progressInterval);
      clearTimeout(progressTimer);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className="h-1 primary_bg_color transition-all duration-300 ease-in-out"
        style={{
          width: `${progress}%`,
          transition: "width 300ms ease-in-out",
        }}
      />
    </div>
  );
};

export default RouteProgressBar;
