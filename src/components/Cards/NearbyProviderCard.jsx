"use client";
import {
  formatResponseTime,
  showDistance,
  formatStartingPrice,
} from "@/utils/Helper";
import { FaMapMarkerAlt, FaStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { MdBolt, MdVerified } from "react-icons/md";
import { BsImageFill } from "react-icons/bs";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";

const NearbyProviderCard = ({ provider, isBookmark, handleRemoveBookMark }) => {
  const metaItems = [
    provider?.service_title && {
      label: provider.service_title,
    },
    provider?.distance && {
      icon: <FaMapMarkerAlt size={11} className="text-[#3B82F6]" />,
      label: showDistance(provider.distance),
    },
    provider?.total_services > 0 && {
      label: `${provider.total_services} Services`,
    },
  ].filter(Boolean);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1A1C1E] flex flex-col h-full transition-colors duration-300">
      {/* Image Area */}
      <div
        className="relative w-full shrink-0 bg-gray-50 dark:bg-gray-900"
        style={{ height: "200px" }}
      >
        {provider?.image ? (
          <CustomImageTag
            src={provider.banner_image}
            alt={provider?.company_name}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <BsImageFill size={36} className="text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Verified Pro Badge */}
        {provider?.verified_pro && (
          <div className="absolute top-0 left-0 bg-[#007BFF] rounded-tl-xl rounded-br-xl px-2.5 py-1 flex items-center gap-1 z-10 shadow-lg">
            <MdVerified size={13} className="text-white" />
            <span className="text-white text-[11px] font-semibold">
              Verified Pro
            </span>
          </div>
        )}

        {/* Reply Badge */}
        {provider?.avg_response_time &&
          formatResponseTime(provider.avg_response_time) && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 flex items-center gap-1 border border-white/20">
              <MdBolt size={13} className="text-[#00F380]" />
              <span className="text-[10px] font-semibold text-white">
                Replies in {formatResponseTime(provider.avg_response_time)}
              </span>
            </div>
          )}

        {/* Bookmark Button */}
        {handleRemoveBookMark && (
          <button
            onClick={(e) => handleRemoveBookMark(e, provider)}
            className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-black/40 backdrop-blur-md flex items-center justify-center text-red-500 hover:scale-110 active:scale-90 transition-all shadow-md dark:shadow-black/20"
          >
            {isBookmark ? (
              <FaHeart size={15} />
            ) : (
              <FaRegHeart size={15} />
            )}
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="px-3 py-3 flex flex-col flex-1 gap-1.5">
        {/* Name + Verified Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <h2 className="text-[14px] font-bold text-gray-900 dark:text-white truncate uppercase tracking-wide">
              {provider?.translated_company_name || provider?.company_name}
            </h2>
            {provider?.is_verified && (
                <MdVerified className="text-[#3B82F6] shrink-0" size={14} />
            )}
          </div>
        </div>

        {/* Row 1: Category & Total Services */}
        <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400 font-medium">
          <span className="truncate">
            {provider?.translated_category_name || provider?.category_name || provider?.service_title || "Service"}
          </span>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <span className="shrink-0">
            {provider?.total_services || 0} Services
          </span>
        </div>

        {/* Row 2: Distance & Reviews */}
        <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400 font-medium">
          <div className="flex items-center gap-1">
            <FaMapMarkerAlt size={12} className="text-[#3B82F6]" />
            <span>{showDistance(provider?.distance)}</span>
          </div>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <div className="flex items-center gap-1">
            <FaStar className="text-amber-400" size={12} />
            <span className="text-gray-900 dark:text-white font-semibold">
              {Number(provider?.ratings || 0).toFixed(1)}
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              ({provider?.number_of_ratings || 0})
            </span>
          </div>
        </div>

        {/* Price Button — pinned to bottom */}
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-white/5">
          <div className="w-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors rounded-lg py-2 flex items-center justify-center cursor-pointer">
            <span className="text-[12px] font-semibold text-gray-900 dark:text-white">
              {provider?.starting_price
                ? `From ${formatStartingPrice(provider.starting_price)}`
                : "Contact For Price"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyProviderCard;
