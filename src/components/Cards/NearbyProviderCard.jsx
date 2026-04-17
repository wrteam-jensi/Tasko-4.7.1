"use client";
import { formatResponseTime, showDistance } from "@/utils/Helper";
import { FaMapMarkerAlt, FaStar, FaRegClock } from "react-icons/fa";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { MdVerified } from "react-icons/md";

const NearbyProviderCard = ({ provider }) => {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-gray-100 bg-white transition-all duration-300 group flex flex-col h-full ">
      {/* Cover Image */}
      <div className="relative w-full h-44 p-2.5 shrink-0">
        <div className="w-full h-full rounded-xl overflow-hidden">
          <CustomImageTag
            src={provider?.image}
            alt={provider?.company_name}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover  transition-transform duration-500"
          />
        </div>

        {/* Reply Badge */}
        {provider?.avg_response_time && formatResponseTime(provider.avg_response_time) && (
          <div className="absolute bottom-[18px] left-[18px] bg-[#34A853]/90 backdrop-blur-sm rounded-full px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
            <FaRegClock size={9} className="text-[#ffffff]" />
            <span className="text-[11px] font-bold text-white tracking-tight">
              Replies in {formatResponseTime(provider.avg_response_time)}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="px-3.5 pt-2.5 pb-3.5 flex flex-col flex-1">
        {/* Name + Verified */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[14px] font-semibold text-gray-900 line-clamp-1">
              {provider?.translated_company_name || provider?.company_name}
            </h2>
            {provider?.is_verified && (
             <MdVerified className="text-blue-500" size={14} />
            )}
          </div>

          {/* Category + Experience */}
          <p className="text-[12px] font-medium text-gray-400 line-clamp-1 min-h-[18px]">
            {provider?.category_name || provider?.years_of_experience > 0 ? (
              <>
                {provider?.category_name && (
                  <span>{provider.category_name}</span>
                )}
                {provider?.category_name && provider?.years_of_experience > 0 && (
                  <span className="mx-1">•</span>
                )}
                {provider?.years_of_experience > 0 && (
                  <span>{Math.floor(Number(provider.years_of_experience))} yrs exp.</span>
                )}
              </>
            ) : (
              <>&nbsp;</>
            )}
          </p>
        </div>

        {/* Rating + Distance */}
        <div className="flex items-center gap-3 mt-2.5">
          <div className="flex items-center gap-1">
            <FaStar className="text-amber-400" size={14} />
            <span className="text-[13px]  text-gray-900">
              {provider?.ratings > 0
                ? Number(provider.ratings).toFixed(1)
                : "0.0"}
            </span>
            <span className="text-[12px] font-medium text-gray-400">
              ({provider?.review_count || 0})
            </span>
          </div>

          {provider?.distance !== "" && (
            <div className="flex items-center gap-1">
              <FaMapMarkerAlt className="text-blue-500" size={11} />
              <span className="text-[12px] font-medium text-gray-400">
                {showDistance(provider?.distance)}
              </span>
            </div>
          )}
        </div>

        {/* Price Button - mt-auto ensures the button is always at the bottom */}
        <div className="mt-auto pt-3">
          <div className="w-full bg-[#F3F4F6] rounded-lg py-2.5 px-3.5 flex items-center justify-center">
            <span className="text-[13px] font-semibold text-gray-900 line-clamp-1">
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