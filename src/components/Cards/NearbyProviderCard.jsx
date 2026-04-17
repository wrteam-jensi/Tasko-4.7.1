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
    <div className="w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-gray-50  bg-white  transition-all duration-300 group flex flex-col h-full">
      {/* Cover Image */}
      <div className="relative w-full h-56 overflow-hidden p-3 shrink-0">
        <div className="w-full h-full rounded-lg overflow-hidden shadow-inner">
          <CustomImageTag
            src={provider?.image}
            alt={provider?.company_name}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Reply Badge - Matching the mockup pill style */}
        {provider?.avg_response_time && (
          <div className="absolute bottom-6 left-6 bg-[#34A853]/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
            <div className="flex items-center justify-center">
              <FaMapMarkerAlt size={10} className="text-[#A5D6A7]" />
            </div>
            <span className="text-[13px] font-bold text-white tracking-tight">
              Replies in {provider.avg_response_time}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="px-6 pt-1 pb-6 flex flex-col flex-1">
        {/* Name + Verified */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 line-clamp-1">
              {provider?.translated_company_name || provider?.company_name}
            </h2>
            {provider?.is_verified && (
              <div className="bg-blue-500 rounded-full p-0.5 shrink-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.5 8L7 10.5L11.5 6"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Subtitle: Category • Experience - Clamped to 1 line for consistent height */}
          <p className="text-[15px] font-medium text-gray-400 line-clamp-1">
            {provider?.years_of_experience > 0 && (
              <span className="mx-1.5 inline-block w-1 h-1 bg-gray-300 rounded-full align-middle"></span>
            )}
            {provider?.years_of_experience > 0 && (
              <span>
                {Math.floor(Number(provider.years_of_experience))} yrs exp.
              </span>
            )}
          </p>
        </div>

        {/* Rating + Distance Row */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <FaStar className="text-amber-400" size={18} />
            <span className="text-[15px] font-extrabold text-gray-900">
              {provider?.ratings > 0
                ? Number(provider.ratings).toFixed(1)
                : "0.0"}
            </span>
            <span className="text-[15px] font-semibold text-gray-400">
              ({provider?.review_count || 0})
            </span>
          </div>

          {provider?.distance !== "" && (
            <div className="flex items-center gap-1.5">
              <FaMapMarkerAlt className="text-blue-500" size={14} />
              <span className="text-[15px] font-semibold text-gray-400">
                {showDistance(provider?.distance)}
              </span>
            </div>
          )}
        </div>

        {/* Price Pill - mt-auto ensures it stays at the bottom */}
        <div className="pt-6 mt-auto">
          <div className="w-full bg-[#f3f4f6] hover:bg-gray-200 transition-colors rounded-lg py-4 px-6 flex items-center justify-center">
            <span className="text-base font-semibold text-gray-900 line-clamp-1">
              {provider?.min_price
                ? `From ${provider.min_price}`
                : "Contact For Price"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyProviderCard;
