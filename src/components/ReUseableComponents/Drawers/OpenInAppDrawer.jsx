"use client";

import { useTranslation } from "@/components/Layout/TranslationContext";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

const OpenInAppDrawer = ({ IsOpenInApp, systemSettingsData }) => {
  const t = useTranslation();
  const path = usePathname();
  const [showPopup, setShowPopup] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(IsOpenInApp);

  // Extract company name and store links
  const companyName =
    systemSettingsData?.general_settings?.schema_for_deeplink ||
    process.env.NEXT_PUBLIC_APP_NAME;

  const sanitizedCompanyName = companyName
    ?.trim()
    ?.toLowerCase()
    ?.replace(/\s+/g, "-");

  const playStoreLink =
    systemSettingsData?.app_settings?.customer_playstore_url;
  const appStoreLink = systemSettingsData?.app_settings?.customer_appstore_url;

  const primaryColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--primary-color");

  // Detect device type
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const storeLink = isAndroid ? playStoreLink : isIOS ? appStoreLink : playStoreLink;
  const storeText = isAndroid ? t("playStore") : t("appStore");

  // Restore drawer state on page load
  useEffect(() => {
    const hasOpenedInApp = localStorage.getItem("hasOpenedInApp");
    if (IsOpenInApp && !hasOpenedInApp) {
      setIsDrawerOpen(true);
    }
  }, [IsOpenInApp]);

  function openInApp() {
    const appScheme = `${sanitizedCompanyName}://${window.location.hostname}${path}`;
    const start = Date.now();

    // Open the app via deep link
    window.location.href = appScheme;

    setTimeout(() => {
      const now = Date.now();
      if (!document.hidden && now - start < 2000) {
        setShowPopup(true); // Show popup to install the app
      } else {
        localStorage.setItem("hasOpenedInApp", "true");
        setIsDrawerOpen(false);
        setShowPopup(false);
      }
    }, 1500); // Adjust delay as needed
  }

  function handleRedirect() {
    setShowPopup(false);
    localStorage.setItem("hasOpenedInApp", "true");
    setIsDrawerOpen(false);

    setTimeout(() => {
      window.location.href = storeLink;
    }, 300);
  }

  // 🔥 Close Drawer & Popup When User Returns from App
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setShowPopup(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="rounded-t-xl p-4 text-center">
          <h2 className="text-lg font-semibold mt-4">
            {`${t("viewIn")} ${companyName} ${t("app")}`}
          </h2>
          <div className="flex justify-center gap-4 mt-4">
            <Button
              className="w-full bg-primary text-white"
              onClick={openInApp}
              style={{ backgroundColor: primaryColor }}
            >
              {t("open")}
            </Button>
            <Button
              className="w-full bg-gray-300 text-black"
              onClick={() => {
                setIsDrawerOpen(false);
                localStorage.setItem("hasOpenedInApp", "true");
              }}
            >
              {t("cancel")}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Custom Popup if App is not Installed */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="card_bg p-6 rounded-lg text-center shadow-lg">
            <h2 className="text-lg font-semibold">
              {t("appNotInstalled", { companyName })}
            </h2>
            <p className="mt-2">
              {isIOS ? t("downloadPromptAppStore") : t("downloadPromptPlayStore")}
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Button
                className="primary_bg_color text-white"
                onClick={handleRedirect}
              >
                {storeText}
              </Button>
              <Button onClick={() => setShowPopup(false)}>{t("cancel")}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OpenInAppDrawer;
