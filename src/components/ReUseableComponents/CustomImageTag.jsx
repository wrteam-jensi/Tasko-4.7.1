"use client";
import React, { useEffect, useState, useRef } from "react";
import ImagePlaceholder from "../../assets/placeholder.svg";
import { useSelector } from "react-redux";
import { useTranslation } from "../Layout/TranslationContext";

const imageCache = new Map();

const CustomImageTag = ({
  src,
  alt,
  className,
  loadingBuilder,
  errorBuilder,
  fadeInDuration = 300,
  cacheKey,
  maxCacheSize = 100,
  retryCount = 2,
  imgClassName,
}) => {

  const settings = useSelector(
    (state) => state.settingsData?.settings?.web_settings
  );
  const placeholderLogo = settings?.web_half_logo || ImagePlaceholder;
  const t = useTranslation();

  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retries, setRetries] = useState(0);

  const imgRef = useRef(null);

  const actualSrc = typeof src === "object" && src?.src ? src.src : src;
  const key = cacheKey || actualSrc;

  // → Cache Manager
  const updateCache = (key, url) => {
    if (imageCache.size >= maxCacheSize && !imageCache.has(key)) {
      const firstKey = imageCache.keys().next().value;
      imageCache.delete(firstKey);
    }
    imageCache.set(key, url);
  };

  // → Main loader (NO HEAD REQUEST)
  const loadImage = () => {
    setIsLoading(true);
    setHasError(false);

    if (!actualSrc || actualSrc === "") {
      setImageSrc(placeholderLogo);
      setHasError(true);
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // If cached
    if (imageCache.has(key)) {
      setImageSrc(imageCache.get(key));
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    const img = new Image();

    img.onload = () => {
      updateCache(key, actualSrc);
      setImageSrc(actualSrc);
      setIsLoaded(true);
      setIsLoading(false);
    };

    img.onerror = () => {
      if (retries < retryCount) {
        setRetries((p) => p + 1);
        setTimeout(() => loadImage(), 600);
      } else {
        setHasError(true);
        setImageSrc(placeholderLogo);
        setIsLoaded(true);
        setIsLoading(false);
      }
    };

    img.src = actualSrc;
  };

  // Reload on src or settings update
  useEffect(() => {
    setRetries(0);
    loadImage();
  }, [actualSrc, settings]);

  const fadeInStyle = {
    opacity: isLoaded ? 1 : 0,
    transition: `opacity ${fadeInDuration}ms ease-in-out`,
  };

  return (
    <div className={`relative ${className}`}>
      {/* Loader */}
      {isLoading && !hasError && (
        loadingBuilder ? (
          loadingBuilder()
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-50 bg-opacity-80 dark:bg-gray-900 z-10">
            <img
              src={placeholderLogo}
              alt={t("loading")}
              className="w-full h-full object-contain animate-pulse"
            />
          </div>
        )
      )}

      {/* Error */}
      {hasError ? (
        errorBuilder ? (
          errorBuilder()
        ) : (
          <img
            src={placeholderLogo}
            alt={t("placeholder")}
            className="w-full h-full object-contain bg-gray-50 dark:bg-gray-900"
          />
        )
      ) : (
        // Actual Image
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={`${isLoaded ? "block" : "hidden"} w-full h-full ${imgClassName}`}
          style={fadeInStyle}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default CustomImageTag;
