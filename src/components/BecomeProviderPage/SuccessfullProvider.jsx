"use client";
import React, { useRef } from "react";
import StepCard from "./StepCard";
import linesbg1 from "@/assets/lines1.svg";
import linesbg2 from "@/assets/lines2.svg";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Scrollbar } from "swiper/modules"; // Import Scrollbar
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar"; // Import Swiper scrollbar CSS
import CommanCenterText from "../ReUseableComponents/CommanCenterText";
import { useRTL } from "@/utils/Helper";

const SuccessfullProvider = ({ data }) => {
  const swiperRef = useRef(null);

  const isRTL = useRTL();

  const breakpoints = {
    320: {
      slidesPerView: 1,
    },
    375: {
      slidesPerView: 1,
    },
    576: {
      slidesPerView: 1.1,
    },
    768: {
      slidesPerView: 1.3,
    },
    992: {
      slidesPerView: 1.5,
    },
    1200: {
      slidesPerView: 2,
    },
    1400: {
      slidesPerView: 2,
    },
  };
  
  const translatedShortHeadline = data?.translated_short_headline ? data?.translated_short_headline : data?.short_headline;
  const translatedTitle = data?.translated_title ? data?.translated_title : data?.title;
  const translatedDescription = data?.translated_description ? data?.translated_description : data?.description;
  const translatedSteps = data?.translated_steps ? data?.translated_steps : data?.steps;

  return (
    <div className="successfull relative">
      <div className="py-8 md:py-20 container mx-auto">
        {/* Section Header */}

        <CommanCenterText
          highlightedText={translatedShortHeadline}
          title={translatedTitle}
          description={translatedDescription}
        />

        <div className="relative bg-[#0277FA0A] overflow-hidden rounded-[30px] py-10 px-4 md:px-8 md:py-20 lg:px-16">
          <img
            loading="lazy"
            src={linesbg1.src}
            alt={translatedTitle}
            className="absolute top-0 right-0 -z-10 w-auto h-auto bg-no-repeat"
          />
          {/* Steps Section */}
          <div className="becomeProviderSteps flex justify-center">
            {translatedSteps?.length <= 2 ? (
              // Regular grid layout for 2 or fewer items
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {translatedSteps.map((step, index) => (
                  <div key={index} className="">
                    <StepCard data={step} number={index + 1} />
                  </div>
                ))}
              </div>
            ) : (
              // Swiper for more than 2 items
              <Swiper
                autoplay={{
                  delay: 2500,
                  disableOnInteraction: false,
                }}
                loop={false}
                spaceBetween={20}
                slidesPerView={2}
                key={isRTL}
                dir={isRTL ? "rtl" : "ltr"}
                breakpoints={breakpoints}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                modules={[Scrollbar, Autoplay]}
                scrollbar={{
                  hide: false,
                  draggable: true,
                  dragSize: 100,
                }}
                className="custom-swiper w-full"
              >
                {translatedSteps.map((step, index) => (
                  <SwiperSlide key={index}>
                    <StepCard data={step} number={index + 1} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
          <img
            loading="lazy"
            src={linesbg2.src}
            alt={translatedTitle}
            className="absolute bottom-0 left-0 -z-10 w-auto h-auto bg-no-repeat"
          />
        </div>
      </div>
    </div>
  );
};

export default SuccessfullProvider;
