import {
  darkThemeStyles,
  t,
  useGoogleMapsLoader,
  useIsDarkMode,
} from "@/utils/Helper";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import React, { useState, useEffect, useRef } from "react";
import { GrLocation } from "react-icons/gr";
import { useTranslation } from "../Layout/TranslationContext";
import DOMPurify from "dompurify";


const ProviderAboutTab = ({ providerData }) => {
  const t = useTranslation();
  const isDarkMode = useIsDarkMode();

  const { isLoaded, loadError } = useGoogleMapsLoader();

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const [isExpanded, setIsExpanded] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const aboutRef = useRef(null);

  // Convert time from 24-hour format to 12-hour format
  const convertTo12HourFormat = (time) => {
    const [hours, minutes] = time?.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const adjustedHours = hours % 12 || 12; // Convert 0 or 24 to 12
    return `${adjustedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Mapping provider's data to opening hours
  const openingHours = days?.map((day, index) => ({
    day: t(day), // Already translated day name
    hours:
      providerData[`${day.toLowerCase()}_is_open`] === "1"
        ? `${convertTo12HourFormat(
            providerData[`${day.toLowerCase()}_opening_time`]
          )} - ${convertTo12HourFormat(providerData[`${day.toLowerCase()}_closing_time`])}`
        : t("closed"),
  }));

  const todayIndex = new Date().getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const today = openingHours[todayIndex];

  const todayHours =
    today.hours !== "Closed"
      ? today.hours // Optional: remove ":00" from times
      : t("closed");

      useEffect(() => {
        // Use translated_long_description if available, otherwise fall back to long_description
        const descriptionToUse = providerData?.translated_long_description || providerData?.long_description;
        
        if (descriptionToUse) {
          const sanitizedHTML = DOMPurify.sanitize(descriptionToUse);
      
          // Convert HTML to plain text to measure length
          const tempElement = document.createElement("div");
          tempElement.innerHTML = sanitizedHTML;

          setFullDescription(sanitizedHTML);
          setShortDescription(
            sanitizedHTML.length > 600
              ? `${sanitizedHTML.substring(0, 600)}...`
              : sanitizedHTML
          );
        }
      }, [providerData]);
      

  // Error or loading states
  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Center coordinates for the map
  const center = {
    lat: Number(providerData?.latitude) || 0,
    lng: Number(providerData?.longitude) || 0,
  };
  return (
    <div className="space-y-6">
      {/* Company Information */}
      {(providerData?.translated_long_description || providerData?.long_description) && (
      <div className="rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          {t("companyInformation")}
        </h2>
        <div className="space-y-4">
          <p
            className="text-sm description_color leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: isExpanded ? fullDescription : shortDescription,
            }}
          ></p>

          {fullDescription.length > shortDescription.length && (
            <button
              className="text-sm hover:underline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? t("viewLess") : t("viewMore")}
            </button>
          )}
        </div>
      </div>
    )}
      {/* Business Hours */}
      <div className="rounded-lg">
        <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t("bussinessHours")}
          </h2>
          <div className="text-sm text-nowrap ">
            <span className="description_color">{t("today")} </span>
            <span className="primary_text_color">
              {todayHours !== "Closed" ? todayHours : t("closed")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 light_bg_color p-[18px] rounded-md">
          {openingHours?.map((schedule, index) => (
            <div key={index} className="card_bg p-3 shadow-sm rounded-md">
              <p className="font-medium text-gray-900 dark:text-white">
                {schedule?.day}
              </p>
              <p className="text-sm description_color">{schedule?.hours}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Us */}
      {providerData?.latitude &&
        providerData?.longitude &&
        providerData?.address && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t("contactUs")}
            </h2>

            {/* Map */}
            <div className="w-full h-[320px] rounded-lg mb-4 relative overflow-hidden">
              <GoogleMap
                mapContainerClassName="w-full h-full"
                center={center}
                zoom={15}
                options={{
                  streetViewControl: false,
                  styles: isDarkMode ? darkThemeStyles : [],
                }}
              >
                {providerData?.latitude && providerData?.longitude && (
                  <MarkerF position={center} />
                )}
              </GoogleMap>
            </div>

            {/* Address */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center p-[12px] light_bg_color rounded-md primary_text_color">
                <GrLocation className="h-5 w-5 mt-1 flex-shrink-0" />
              </div>
              <div>
                <p className="text-sm primary_text_color">{t("address")}</p>
                <p className="text-xs sm:text-base md:text-lg font-medium">
                  {providerData?.address}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ProviderAboutTab;
