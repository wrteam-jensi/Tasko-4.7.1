import React, { useState, useEffect } from "react";
import { maintanceModeImage } from "./Images";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import Countdown from 'react-countdown';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const MaintenanceMode = () => {
  const t = useTranslation();
  const router = useRouter();
  const webSettings = useSelector((state) => state.settingsData.settings.web_settings);
  const isMaintenanceMode = webSettings?.customer_web_maintenance_mode === 1 || webSettings?.customer_web_maintenance_mode === "1";
  const [isCompleted, setIsCompleted] = useState(false);

  // Get end date from maintenance schedule
  const getEndDate = () => {
    const maintenanceDate = webSettings?.customer_web_maintenance_mode_end_datetime;
    if (!maintenanceDate) return new Date();

    // Parse the UTC date string using dayjs and convert to local Date object
    return dayjs.utc(maintenanceDate).toDate();
  };

  // Handle navigation to home
  const handleBackToHome = () => {
    window.location.href = "/";
  };

  const handleComplete = () => {
    setIsCompleted(true);
  };

  // Countdown renderer
  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold primary_text_color">{t("weAreBackNow")}</h2>
          <button
            onClick={handleBackToHome}
            className="primary_bg_color hover:bg-opacity-90 text-white px-6 py-3 rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {t("goToHomePage")}
          </button>
        </div>
      )
    }

    return (
      <div className="flex justify-center items-center gap-2 md:gap-3">
        <div className="flex flex-col items-center">
          <div className="primary_bg_color text-white text-md md:text-2xl font-bold rounded-[4px] w-[50px] md:w-[70px] h-[50px] md:h-[70px] flex items-center justify-center">
            {String(days).padStart(2, '0')}
          </div>
          <span className="text-sm mt-2">{t("day")}</span>
        </div>
        <div className="flex items-center text-xl md:text-2xl font-bold mb-6">-</div>
        <div className="flex flex-col items-center">
          <div className="primary_bg_color text-white text-md md:text-2xl font-bold rounded-[4px] w-[50px] md:w-[70px] h-[50px] md:h-[70px] flex items-center justify-center">
            {String(hours).padStart(2, '0')}
          </div>
          <span className="text-sm mt-2">{t("hour")}</span>
        </div>
        <div className="flex items-center text-xl md:text-2xl font-bold mb-6">-</div>
        <div className="flex flex-col items-center">
          <div className="primary_bg_color text-white text-md md:text-2xl font-bold rounded-[4px] w-[50px] md:w-[70px] h-[50px] md:h-[70px] flex items-center justify-center">
            {String(minutes).padStart(2, '0')}
          </div>
          <span className="text-sm mt-2">{t("minute")}</span>
        </div>
        <div className="flex items-center text-xl md:text-2xl font-bold mb-6">-</div>
        <div className="flex flex-col items-center">
          <div className="primary_bg_color text-white text-md md:text-2xl font-bold rounded-[4px] w-[50px] md:w-[70px] h-[50px] md:h-[70px] flex items-center justify-center">
            {String(seconds).padStart(2, '0')}
          </div>
          <span className="text-sm mt-2">{t("second")}</span>
        </div>
      </div>
    );
  };
  const translatedMessage = webSettings?.translated_message_for_customer_web ? webSettings?.translated_message_for_customer_web : webSettings?.message_for_customer_web;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center card_bg text-center p-4">
      <div className="max-w-2xl space-y-6 flex flex-col items-center justify-center">
        {isMaintenanceMode && !isCompleted ? (
          <>
            {maintanceModeImage}
            {translatedMessage && (
              <p className="text-base md:text-xl description_color">
                {translatedMessage}
              </p>
            )}
            <Countdown
              date={getEndDate()}
              renderer={renderer}
              onComplete={handleComplete}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-semibold primary_text_color">{t("weAreBackNow")}</h2>
            <button
              onClick={handleBackToHome}
              className="primary_bg_color hover:bg-opacity-90 text-white px-6 py-3 rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {t("goToHomePage")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceMode;