import { miniDevider, parseAndCeil, showDistance, useRTL } from "@/utils/Helper";
import React, { useState, useEffect } from "react";
import { BsBookmarkCheckFill, BsBookmarkPlus } from "react-icons/bs";
import { FaMapMarkerAlt } from "react-icons/fa";
import { FaStar } from "react-icons/fa6";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { useTranslation } from "../Layout/TranslationContext";
import { useSelector } from "react-redux";
import { bookmark } from "@/api/apiRoutes";
import { toast } from "sonner";
import { useIsLogin } from "@/utils/Helper";
import CustomLink from "../ReUseableComponents/CustomLink";
import { useDispatch } from "react-redux";
import { openLoginModal } from "@/redux/reducers/helperSlice";

const TopRatedProviderCard = ({ provider }) => {
  const t = useTranslation();
  const isRTL = useRTL();
  const dispatch = useDispatch();
  const isLoggedIn = useIsLogin(); // Reactive hook - automatically updates when login state changes
  const locationData = useSelector((state) => state?.location);
  const [isBookMarked, setIsBookMarked] = useState(false);

  const handleAddBookMark = async () => {
    if (isLoggedIn) {
      try {
        const res = await bookmark({
          type: "add",
          lat: locationData?.lat,
          lng: locationData?.lng,
          partner_id: provider?.id,
        });
        if (res?.error === false) {
          setIsBookMarked(true);

          toast.success(res?.message);
        } else {
          toast.error(res?.message);
          setIsBookMarked(false);
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      dispatch(openLoginModal());
    }
  };

  const handleRemoveBookMark = async () => {
    if (isLoggedIn) {
      try {
        const res = await bookmark({
          type: "remove",
          lat: locationData?.lat,
          lng: locationData?.lng,
          partner_id: provider?.id,
        });
        if (res?.error === false) {
          setIsBookMarked(false);

          toast.success(res?.message);
        } else {
          toast.error(res?.message);
          setIsBookMarked(true);
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      dispatch(openLoginModal());
    }
  };
  useEffect(() => {
    if (isLoggedIn) {
      setIsBookMarked(provider?.is_bookmarked == "1"); // Compare as string or number
    }
  }, [isLoggedIn, provider?.is_bookmarked]);

  const translatedCompanyName = provider?.translated_company_name ? provider?.translated_company_name : provider?.company_name;

  return (
    <div className="card_bg rounded-2xl overflow-hidden border group ">
      <div className="relative">
        <CustomImageTag
          className="w-full h-auto aspect-provider-banner object-cover"
          src={provider?.banner_image}
          alt={`${translatedCompanyName} cover`}
          imgClassName="object-cover"
        />
        {provider?.discount > 0 && (
          <div className="absolute top-3 left-3 card_bg text-green-500 text-xs font-semibold px-2 py-1 rounded-[8px]">
            {provider?.discount}% {t("off")}
          </div>
        )}
        <div className="absolute top-3 -right-10 card_bg text-black dark:text-white text-xs font-semibold px-2 py-1 rounded-[8px] transition-all duration-300 group-hover:right-3">
          {isBookMarked ? (
            <BsBookmarkCheckFill
              size={22}
              onClick={handleRemoveBookMark}
              className="cursor-pointer primary_text_color"
            />
          ) : (
            <BsBookmarkPlus
              size={22}
              onClick={handleAddBookMark}
              className="cursor-pointer transition-all duration-300 group-hover:right-3"
            />
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center mb-3">
          <CustomImageTag
            className={`w-12 aspect-square ${isRTL ? "mr-0 ml-3" : "ml-0 mr-3"
              }`}
            src={provider?.image}
            alt={`${translatedCompanyName} logo`}
            imgClassName="rounded-xl"
          />
          <div>
            <h2 className="font-semibold text-lg leading-tight line-clamp-1">
              {translatedCompanyName}
            </h2>
            {provider?.total_services > 0 && (
              <span className="text-sm primary_text_color font-medium">
                {provider?.total_services} {provider?.total_services > 1 ? t("services") : t("service")}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Rating */}
          {provider.ratings > 0 && (
            <>
              <div className="flex items-center">
                <FaStar className="rating_icon_color mr-1" />
                <span className="font-semibold">
                  {provider.ratings}
                </span>
              </div>

              {/* Vertical Divider */}
              {miniDevider}
            </>
          )}

          {/* Distance */}
          <div className="flex items-center">
            <FaMapMarkerAlt className="primary_text_color mr-1" />
            <span className="font-semibold">
              {" "}
              {showDistance(provider?.distance)}
            </span>
          </div>
        </div>
        <button className="w-full light_bg_color primary_text_color dark:text-white font-normal py-2.5 px-4 rounded-lg text-sm mt-4">
          <CustomLink href={`/provider-details/${provider?.slug}`}>
            {t("viewService")}
          </CustomLink>
        </button>
      </div>
    </div>
  );
};

export default TopRatedProviderCard;
