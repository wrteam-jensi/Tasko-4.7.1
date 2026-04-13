"use client";
import { miniDevider, showDistance, useRTL } from "@/utils/Helper";
import { BsBookmarkCheckFill } from "react-icons/bs";
import { FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { FaAngleRight } from "react-icons/fa6";
import { useTranslation } from "../Layout/TranslationContext";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";

const NearbyProviderCard = ({ provider, isBookmark, handleRemoveBookMark }) => {
  const t = useTranslation();
  const isRTL = useRTL();

  return (
    <div className="w-full flex flex-col border rounded-2xl p-4 max-w-md sm:max-w-full mx-auto custom-shadow card_bg hover:border_color transition-all duration-300 group">
      {/* Top Section: Provider Image and Details */}
      <div className="flex items-center mb-2 gap-4">
        {/* Provider Image */}
        <div className="flex-shrink-0 border rounded-xl light_bg_color">
          <CustomImageTag
            src={provider?.image} // Using provider's image URL
            alt={provider?.company_name}
            className="rounded-xl w-16 h-auto aspect-square sm:w-20"
            imgClassName="rounded-xl object-cover"
          />
        </div>

        {/* Provider Details */}
        <div className="flex-grow h-full">
          <div className="flex flex-col justify-between">
            <h2 className="font-semibold text-xl line-clamp-1">
              {provider?.translated_company_name ? provider?.translated_company_name : provider?.company_name}
            </h2>
            <p className="text-sm description_color">{provider?.description}</p>
          </div>

          {/* Services and Discount */}
          <div className="flex flex-wrap md:flex-nowrap gap-4 items-center text-sm mt-2">
            {provider?.total_services > 0 && (
              <>
                <span className="primary_text_color group-hover:underline">
                  {provider?.total_services.toString().padStart(2, "0")}{" "}
                  {provider?.total_services > 1 ? t("services") : t("service")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="my-2" />

      {/* Bottom Section: Rating, Distance, and Arrow */}
      <div className="flex items-center justify-between text-sm sm:text-base">
        {/* Rating and Distance Grouped */}
        <div className="flex items-center gap-4">
          {/* Rating */}
          {(provider?.ratings > 0) && (
            <div className="flex items-center">
              <FaStar className="rating_icon_color mr-1" size={18} />
              <span className="font-semibold">
                {Number(provider?.ratings).toFixed(1)}
              </span>
            </div>
          )}

          {/* Show miniDevider only if both ratings and distance exist */}
          {(provider?.ratings > 0 || provider?.ratings > 0) &&
          provider?.distance !== ""
            ? miniDevider
            : null}

          {/* Distance */}
          {provider?.distance !== "" && (
            <div className="flex items-center">
              <FaMapMarkerAlt className="primary_text_color mr-1" />
              <span className="font-semibold capitalize">
                {showDistance(provider?.distance)}
              </span>
            </div>
          )}
        </div>
        {isBookmark ? (
          <div
            className="primary_text_color"
            onClick={(e) => handleRemoveBookMark(e, provider)}
          >
            <BsBookmarkCheckFill size={22} />
          </div>
        ) : (
          <div className="flex items-center gap-1 relative">
            <div className="flex items-center gap-1">
              {/* Show hover effect only on large screens */}
              <span
                className={`text-base font-normal primary_text_color underline transform transition-transform duration-500 opacity-0 ${
                  isRTL ? "-translate-x-2" : "translate-x-2"
                } hidden xl:inline group-hover:opacity-100 group-hover:translate-x-0`}
              >
                {t("viewMore")}
              </span>
              {/* Always visible icon */}
              <FaAngleRight
                size={16}
                className={`group-hover:primary_text_color hidden xl:inline ${
                  isRTL ? "rotate-180" : "rotate-0"
                }`}
              />
              <FaAngleRight
                size={16}
                className={`primary_text_color xl:hidden ${
                  isRTL ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyProviderCard;
