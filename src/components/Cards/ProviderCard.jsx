"use client";
import React, { useState, useLayoutEffect, useRef, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { useTranslation } from "../Layout/TranslationContext";

const ProviderCard = ({ provider }) => {
  const t = useTranslation();
  const [maxItems, setMaxItems] = useState(6); // Set a reasonable default value
  const serviceContainerRef = useRef(null);

  useLayoutEffect(() => {
    const calculateMaxItems = () => {
      if (serviceContainerRef.current) {
        const containerWidth = serviceContainerRef.current.offsetWidth;
        if (containerWidth > 0) {
          const itemWidth = 75; // Width of each service item
          const gap = 8; // Gap between items
          const itemsPerRow = Math.floor(
            (containerWidth + gap) / (itemWidth + gap)
          ); // Number of items per row
          const maxRows = 2; // Max 2 rows of items

          setMaxItems(itemsPerRow * maxRows); // Set the maximum items in 2 rows
        }
      }
    };

    calculateMaxItems();

    const resizeObserver = new ResizeObserver(() => calculateMaxItems());
    if (serviceContainerRef.current) {
      resizeObserver.observe(serviceContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [provider?.services]); // Ensure effect runs when provider's services change

  useEffect(() => {
    if (provider?.services?.length > 0 && maxItems === 0) {
      setMaxItems(provider.services.length);
    }
  }, [provider?.services]);

  const servicesToDisplay = provider?.services?.slice(0, maxItems) || [];

  const translatedCompanyName = provider?.translated_company_name ? provider?.translated_company_name : provider?.company_name;


  return (
    <div className="card_bg rounded-[30px] border p-6 flex flex-col items-start space-y-4 custom-shadow text_color hover:border_color">
      <div className="flex flex-col md:flex-row items-center md:items-center md:justify-start w-full gap-5 ">
        <CustomImageTag
          src={provider?.image}
          alt={translatedCompanyName}
          className="w-[80px] aspect-square"
          imgClassName="rounded-[16px] object-cover"
        />
        <div className="flex flex-col gap-1 w-full">
          <h3 className="text-lg font-semibold">{translatedCompanyName}</h3>
          <p className="text-sm description_color">{provider?.location}</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
            {provider?.average_rating > 0 && (
              <div className="text-md font-medium bg-[#DB930514] rating_icon_color p-1 rounded-[4px] flex items-center justify-center gap-1">
                <FaStar />
                <span>{Number(provider?.average_rating).toFixed(1)}</span>
              </div>
            )}
            {provider?.completed_orders > 0 && (
              <div className="text-md font-medium bg-[#83B80714] text-[#83B807] p-1 rounded-[4px] flex items-center justify-center gap-1">
                <FaCircleCheck />
                <span>
                  {provider?.completed_orders} {t("ordersDone")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service display section */}
      {servicesToDisplay.length > 0 && (
        <div
          ref={serviceContainerRef}
          className="flex flex-wrap gap-2 max-h-[5rem] overflow-hidden w-full border-t py-5"
        >
          {servicesToDisplay.map((service, index) => {
            const translatedServiceName = service?.translated_title ? service?.translated_title : service?.title;
            return translatedServiceName &&<span
              key={index}
              className="text-xs description_color background_color px-2 py-1 rounded"
            >
              {translatedServiceName}
            </span>
          })}
        </div>
      )}
    </div>
  );
};

export default ProviderCard;
