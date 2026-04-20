"use client";
import { formatResponseTime, showDistance } from "@/utils/Helper";
import { FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { MdBolt } from "react-icons/md";

import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { MdVerified } from "react-icons/md";

const NearbyProviderCard = ({ provider }) => {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-gray-100 bg-white transition-all duration-300 group flex flex-col h-full ">
      {/* Cover Image */}
      <div className="relative w-full h-44 p-0 shrink-0">
        <div className="w-full h-full overflow-hidden">
          <CustomImageTag
            src={provider?.image}
            alt={provider?.company_name}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover transition-transform duration-500 "
          />
        </div>

        {/* Verified Pro Badge */}
        {provider?.is_verified && (
          <div className="absolute top-0 left-0 bg-[#007BFF] rounded-tl-2xl rounded-br-2xl px-3 py-1.5 flex items-center gap-1.5 shadow-sm z-10 font-bold text-white text-[12px]">
            <MdVerified size={16} className="text-white" />
            <span>Verified Pro</span>
          </div>
        )}

        {/* Reply Badge */}
        {provider?.avg_response_time &&
          formatResponseTime(provider.avg_response_time) && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm border border-white/10">
              <MdBolt size={16} className="text-[#00F380]" />
              <span className="text-[11px] font-semibold text-white">
                Replies in {formatResponseTime(provider.avg_response_time)}
              </span>
            </div>
          )}
      </div>

      {/* Card Body */}
      <div className="px-4 py-4 flex flex-col flex-1">
        {/* Name + Verified */}
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-[17px] font-bold text-gray-900 line-clamp-1">
            {provider?.translated_company_name || provider?.company_name}
          </h2>
          {provider?.is_verified && (
            <MdVerified className="text-[#3B82F6]" size={18} />
          )}
        </div>

        {/* Category + Total Services */}
        <div className="text-[14px] text-gray-500 font-medium flex items-center mb-1 min-w-0">
          <span className="truncate">
            {provider?.service_title || provider?.category_name || "Service"}
          </span>
          {provider?.total_services > 0 && (
            <span className="text-gray-400 shrink-0 whitespace-nowrap">
              <span className="mx-1 text-gray-300">•</span>
              {provider.total_services} Services
            </span>
          )}
        </div>

        {/* Location + Rating */}
        <div className="flex items-center gap-1 text-[14px] text-gray-500 font-medium">
          <FaMapMarkerAlt size={12} className="text-gray-400" />
          <span>{showDistance(provider?.distance)}</span>
          <span className="mx-0.5 text-gray-300">•</span>
          <FaStar className="text-amber-400" size={13} />
          <span className="text-gray-900">
            {Number(provider?.ratings || 0).toFixed(1)}
          </span>
          <span className="text-gray-400">({provider?.review_count || 0})</span>
        </div>

        {/* Price Button */}
        <div className="mt-auto pt-4">
          <div className="w-full bg-[#f2f2f2] rounded-xl py-3 flex items-center justify-center">
            <span className="text-[15px] font-bold text-gray-800">
              {provider?.starting_price
                ? `From ${provider.starting_price}`
                : "Contact For Price"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyProviderCard;
