"use client";
import {
  formatResponseTime,
  showDistance,
  formatStartingPrice,
} from "@/utils/Helper";
import { FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { MdBolt, MdVerified } from "react-icons/md";
import { BsImageFill } from "react-icons/bs";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";

const NearbyProviderCard = ({ provider }) => {
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
    <div className="w-full rounded-xl overflow-hidden border border-gray-100 bg-white flex flex-col h-full">
      {/* Image Area */}
      <div
        className="relative w-full shrink-0 bg-gray-50"
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
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <BsImageFill size={36} className="text-gray-300" />
          </div>
        )}

        {/* Verified Pro Badge */}
        {/* {provider?.is_verified && (
          <div className="absolute top-0 left-0 bg-[#007BFF] rounded-tl-xl rounded-br-xl px-2.5 py-1 flex items-center gap-1 z-10">
            <MdVerified size={13} className="text-white" />
            <span className="text-white text-[11px] font-semibold">
              Verified Pro
            </span>
          </div>
        )} */}

        {/* Reply Badge */}
        {provider?.avg_response_time &&
          formatResponseTime(provider.avg_response_time) && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 border border-white/10">
              <MdBolt size={13} className="text-[#00F380]" />
              <span className="text-[10px] font-semibold text-white">
                Replies in {formatResponseTime(provider.avg_response_time)}
              </span>
            </div>
          )}
      </div>

      {/* Card Body */}
      <div className="px-3 py-3 flex flex-col flex-1 gap-1.5">
        {/* Name + Rating */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <h2 className="text-[13px] font-semibold text-gray-900 truncate uppercase tracking-wide">
              {provider?.translated_company_name || provider?.company_name}
            </h2>
            {provider?.is_verified && (
              <MdVerified className="text-[#3B82F6] shrink-0" size={13} />
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 shrink-0 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[11px]">
            <FaStar className="text-amber-400" size={10} />
            <span className="font-semibold text-gray-900">
              {Number(provider?.ratings || 0).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Category */}
        {/* {(provider?.translated_category_name || provider?.category_name) && (
          <div className="text-[12px] text-gray-500 leading-snug line-clamp-2">
            {provider.translated_category_name || provider.category_name}
          </div>
        )} */}

        {/* Meta: Distance / Experience / Services */}
        {metaItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
            {metaItems.map((item, index) => (
              <div key={index} className="flex items-center gap-x-2">
                {index > 0 && (
                  <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
                )}
                <span className="flex items-center gap-1">
                  {item.icon && item.icon}
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Price Button — pinned to bottom */}
        <div className="mt-auto pt-2 border-t border-gray-100">
          <div className="w-full bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg py-2 flex items-center justify-center cursor-pointer">
            <span className="text-[12px] font-semibold text-gray-900">
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
