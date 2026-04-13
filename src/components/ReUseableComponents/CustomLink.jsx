"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';

const CustomLink = ({
  href,
  children,
  className,
  onClick,
  preserveLanguage = true,
  ...props
}) => {
  const [mounted, setMounted] = useState(false);

  // Always call useSelector (never conditionally)
  const reduxLanguage = useSelector((state) => 
    state?.translation?.currentLanguage || { langCode: 'en' }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only use redux value after mount
  const langCode = mounted ? reduxLanguage?.langCode || 'en' : 'en';

  // Function to add language parameter to URL
  const getUrlWithLanguage = (url) => {
    if (!preserveLanguage) return url;

    try {
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.set('lang', langCode);
      return urlObj.pathname + urlObj.search;
    } catch (error) {
      const hasQueryParams = url.includes('?');
      const separator = hasQueryParams ? '&' : '?';
      return `${url}${separator}lang=${langCode}`;
    }
  };

  // Prepare the final href
  const finalHref = preserveLanguage ? getUrlWithLanguage(href) : href;

  return (
    <Link
      href={finalHref}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </Link>
  );
};

export default CustomLink;
