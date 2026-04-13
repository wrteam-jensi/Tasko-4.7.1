'use client';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useSelector } from 'react-redux';
import { useTranslation } from '../Layout/TranslationContext';

const CookieConsent = ({ title, description }) => {
  const t = useTranslation();
  const [showConsent, setShowConsent] = useState(false);
  const [isCookiesAccepted, setIsCookiesAccepted] = useState(false);
  
  // Get user data from redux store
  const userData = useSelector((state) => state?.userData);
  const userToken = userData?.token;
  
  const expirationDays = 7;

  // Handle accepting cookies
  const handleAccept = () => {
    Cookies.set('cookie-consent', 'accepted', { expires: expirationDays });
    setShowConsent(false);
    setIsCookiesAccepted(true);
    
    // Save user data if logged in
    if (userToken) {
      handleSaveUserData();
    }
  };

  // Handle declining cookies
  const handleDecline = () => {
    Cookies.set('cookie-consent', 'declined', { expires: expirationDays });
    setShowConsent(false);
  };

  // Save user data to cookies
  const handleSaveUserData = () => {
    if (userData?.data) {
      Cookies.set('user-name', userData?.data?.name, { expires: expirationDays });
      Cookies.set('user-email', userData?.data?.email, { expires: expirationDays });
      Cookies.set('user-number', userData?.data?.mobile, { expires: expirationDays });
      Cookies.set('user-token', userData?.token, { expires: expirationDays });
      Cookies.set('user-fcmId', userData?.data?.fcm_id, { expires: expirationDays });
      Cookies.set('user-loginType', userData?.data?.logintype, { expires: expirationDays });
    }
  };

  // Check for existing cookie consent on component mount
  useEffect(() => {
    const consent = Cookies.get('cookie-consent');
    if (!consent) {
      setShowConsent(true);
    } else if (consent === 'accepted') {
      setIsCookiesAccepted(true);
    }
  }, []);

  // Save user data when user logs in and cookies are accepted
  useEffect(() => {
    if (userToken && isCookiesAccepted) {
      handleSaveUserData();
    }
  }, [userToken, isCookiesAccepted, userData]);

  if (!showConsent) return null;

  return (
    <>
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"></div>
      
      {/* Cookie consent dialog */}
      <div className="fixed bottom-4 left-0 right-0 z-50">
        <div className="container mx-auto max-w-screen-xl card_bg shadow-lg p-4 rounded-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-lg">{title}</h3>
              <p className="text-sm description_color mt-1">
                {description}
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={handleDecline}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium flex-1 md:flex-none"
              >
                {t("decline")}
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-primary text-white dark:text-black rounded-md hover:bg-primary/90 text-sm font-medium flex-1 md:flex-none"
              >
                {t("accept")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent; 