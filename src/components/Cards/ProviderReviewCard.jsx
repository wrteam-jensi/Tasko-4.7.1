"use client";
import React from "react";
import quote from "../../assets/quote2.svg";
import { CiStar } from "react-icons/ci";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { useTranslation } from "../Layout/TranslationContext";
const ProviderReviewCard = ({ review }) => {
  const t = useTranslation();
  return (
    <div className="card_bg p-6 rounded-[30px] mx-auto h-[333px] flex flex-col items-start justify-center gap-[24px]">
      {/* Quote Icon */}
      <div className="quote">
        <CustomImageTag
          src={quote}
          className="w-[48px] h-[48px]  opacity-20"
          alt={t("quote")}
          imgClassName="opacity-20"
        />
      </div>

      {/* Review Text */}
      <p className="text-sm lg:description_text font-normal mb-6 line-clamp-3">
        {review?.comment}
      </p>

      {/* Reviewer Info */}
      <div className="flex flex-col sm:flex-row  items-start justify-center gap-4 sm:items-center sm:justify-between sm:gap-0 w-full">
        <div className="flex items-center">
          <CustomImageTag
            src={review?.profile_image}
            alt={review?.username}
            className="w-12 aspect-square rounded-full mr-4"
            imgClassName="rounded-full"
            width={0}
            height={0}
            loading="lazy"
          />
          <div className="flex flex-col items-start">
            <p className="text-base font-normal">{review?.username}</p>
            {/* <p className="description_color text-sm">{review.role}</p> */}
          </div>
        </div>
        <div>
          <div className="flex items-center primary_bg_color rounded-full py-1 px-4 gap-1 text-white">
            <CiStar size={22} />
            <span className="font-bold">{review?.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderReviewCard;
