"use client"
import React from "react";
import quote from "../../assets/quote2.svg";
import { CiStar } from "react-icons/ci";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { useTranslation } from "../Layout/TranslationContext";

const ReviewCard = ({ review, onImageClick }) => {
  const t = useTranslation();

  // Get images array and calculate remaining count
  const images = review?.images || [];
  const displayedImages = images.slice(0, 4); // Show first 4 images
  const remainingCount = images.length - 4; // Calculate remaining images count (after 4th image)

  // Handle image click - call parent's onImageClick with all images and clicked index
  const handleImageClick = (index, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onImageClick && images.length > 0) {
      onImageClick(images, index);
    }
  };

  return (
    <div className="card_bg p-6 md:p-3 lg:p-6 rounded-[30px] mx-auto flex flex-col items-start justify-between gap-4 h-full">
      {/* Quote Icon */}
      <div className="w-full flex flex-col items-start gap-3 flex-1">
        <div className="quote">
          <CustomImageTag
            src={quote?.src}
            className="w-[48px] h-[48px] aspect-square opacity-20"
            imgClassName="opacity-20"
            alt={t("quote")}
          />
        </div>

        {/* Review Text - Fixed height to ensure consistency */}
        <p className="mb-4 line-clamp-3 min-h-[4.5rem]">{review?.comment || ""}</p>
        
        {/* Review Images - Always reserve space, show if images exist */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[64px]">
          {images.length > 0 ? (
            /* Display first 4 images */
            displayedImages.map((image, index) => (
              <div
                key={index}
                className="relative w-16 h-16 min-w-[64px] min-h-[64px] cursor-pointer hover:scale-105 transition-transform overflow-hidden"
                onClick={(e) => handleImageClick(index, e)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleImageClick(index, e);
                  }
                }}
              >
                <CustomImageTag
                  src={image}
                  alt={`Review image ${index + 1}`}
                  imgClassName="rounded-lg border border-gray-200 w-full h-full object-cover"
                  className="w-full h-full"
                />
                {/* Show count overlay on 4th image if there are more than 4 images */}
                {index === 3 && remainingCount > 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center pointer-events-none">
                    <span className="text-white font-bold text-sm">+{remainingCount}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            /* Empty space placeholder to maintain consistent height */
            <div className="w-full h-16"></div>
          )}
        </div>
      </div>

      {/* Reviewer Info - Fixed height section */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-4 w-full mt-auto">
        <div className="flex items-center min-w-0 flex-1">
          <CustomImageTag
            src={review?.profile_image}
            alt={review?.user_name}
            className="w-12 h-12 min-w-[48px] min-h-[48px] aspect-square mr-3 md:mr-2 flex-shrink-0"
            width={0}
            height={0}
            loading="lazy"
            imgClassName="rounded-full"
          />
          <div className="flex flex-col items-start min-w-0 flex-1">
            <p className="font-bold line-clamp-1 w-full">{review?.user_name || ""}</p>
            <p className="description_color text-sm line-clamp-1 w-full">{review?.partner_name || ""}</p>
          </div>
        </div>
        {review?.rating && (
          <div className="flex-shrink-0">
            <div className="flex items-center primary_bg_color rounded-full py-1 px-4 gap-1 text-white">
              <CiStar size={22} />
              <span className="font-bold">{review.rating}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
