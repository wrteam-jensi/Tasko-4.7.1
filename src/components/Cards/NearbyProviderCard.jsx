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
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white hover:shadow-md transition-all duration-300 group">

      {/* Cover Image with Badge */}
      <div className="relative w-full h-48 overflow-hidden">
        <CustomImageTag
          src={provider?.image}
          alt={provider?.company_name}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover"
        />

        {/* Reply Badge */}
        {provider?.response_time && (
          <div className="absolute bottom-3 left-3 bg-white/95 rounded-full px-3 py-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            <span className="text-xs font-medium text-gray-800">
              {provider.response_time}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="px-4 pt-3 pb-4">

        {/* Name + Verified */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <h2 className="text-base font-semibold text-gray-900 line-clamp-1">
            {provider?.translated_company_name || provider?.company_name}
          </h2>
          {provider?.is_verified && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="8" fill="#378ADD" />
              <path d="M4.5 8L7 10.5L11.5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 mb-2.5">{provider?.description}</p>

        {/* Rating + Distance */}
        <div className="flex items-center gap-2 mb-3">
          {provider?.ratings > 0 && (
            <>
              <FaStar className="text-amber-400" size={15} />
              <span className="text-sm font-medium text-gray-900">
                {Number(provider.ratings).toFixed(1)}
              </span>
              {provider?.review_count > 0 && (
                <span className="text-sm text-gray-400">({provider.review_count})</span>
              )}
            </>
          )}

          {provider?.ratings > 0 && provider?.distance !== "" && (
            <span className="w-1 h-1 rounded-full bg-gray-300 inline-block"></span>
          )}

          {provider?.distance !== "" && (
            <>
              <FaMapMarkerAlt className="text-blue-500" size={13} />
              <span className="text-sm text-gray-500">{showDistance(provider?.distance)} </span>
            </>
          )}
        </div>

        {/* Divider */}
        <hr className="border-gray-100 mb-3" />

        {/* Price + Arrow / Bookmark */}
        <div className="flex items-center justify-between">
          {provider?.min_price && (
            <span className="text-sm text-gray-500">
              From{" "}
              <span className="text-sm font-medium text-gray-900">
                {provider.min_price}
              </span>
            </span>
          )}

          {isBookmark ? (
            <div
              className="text-blue-500 cursor-pointer"
              onClick={(e) => handleRemoveBookMark(e, provider)}
            >
              <BsBookmarkCheckFill size={20} />
            </div>
          ) : (
            <FaAngleRight
              size={16}
              className={`text-blue-500 ${isRTL ? "rotate-180" : "rotate-0"}`}
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default NearbyProviderCard;