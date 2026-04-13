import React, { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import ServiceCard from "../Cards/ServiceCard";
import {
  MdOutlineArrowForwardIos,
  MdOutlineArrowBackIosNew,
} from "react-icons/md";
import CommanCenterText from "../ReUseableComponents/CommanCenterText";
import { useRTL } from "@/utils/Helper";

const OurServices = ({ title, desc, data }) => {
  const swiperRef = useRef(null);
  const isRTL = useRTL();
  // Track the navigation state
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  
  const breakpoints = {
    320: {
      slidesPerView: 1,
    },
    375: {
      slidesPerView: 1.5,
    },
    576: {
      slidesPerView: 2,
    },
    768: {
      slidesPerView: 2.5,
    },
    992: {
      slidesPerView: 3,
    },
    1200: {
      slidesPerView: 4.5,
    },
    1400: {
      slidesPerView: 5,
    },
  };

  // Handle navigation safely
  const handleNext = () => {
    if (swiperRef.current && swiperRef.current.slideNext) {
      swiperRef.current.slideNext();
    }
  };

  const handlePrev = () => {
    if (swiperRef.current && swiperRef.current.slidePrev) {
      swiperRef.current.slidePrev();
    }
  };

  // Handle swiper state changes
  const handleSlideChange = (swiper) => {
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  };

  return (
    <section id="our_service" className="relative py-8 md:py-20">
      <div className="container mx-auto relative">
        <div className="detail flex flex-col items-center justify-center">
          <CommanCenterText
            highlightedText={""}
            title={title}
            description={desc}
          />
          <div className="services mt-10 w-full relative">
            <Swiper
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={breakpoints}
              dir={isRTL ? "rtl" : "ltr"}
              modules={[Navigation]}
              key={isRTL}
              navigation={false}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                // Initialize states based on initial swiper state
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
              }}
              onSlideChange={handleSlideChange}
              className="custom-swiper"
            >
              {data && data.length > 0 ? (
                data.map((service, index) => (
                  <SwiperSlide key={index}>
                    <ServiceCard data={service} />
                  </SwiperSlide>
                ))
              ) : (
                <SwiperSlide>
                  <div className="p-4 text-center description_color">
                    No services found
                  </div>
                </SwiperSlide>
              )}
            </Swiper>
            
            {data && data.length > 1 && (
              <div className="flex items-center justify-center gap-[32px] w-full mt-[70px] z-10 relative">
                <button
                  onClick={handlePrev}
                  className={`p-2 bg-transparent border-solid border-[1px] border-black dark:border-white rounded-full transition-all duration-300 ${
                    isBeginning
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:primary_bg_color hover:text-white hover:border-transparent"
                  }`}
                  disabled={isBeginning}
                  aria-label="Previous slide"
                  aria-disabled={isBeginning}
                >
                  <MdOutlineArrowBackIosNew size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className={`p-2 bg-transparent border-solid border-[1px] border-black dark:border-white rounded-full transition-all duration-300 ${
                    isEnd
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:primary_bg_color hover:text-white hover:border-transparent"
                  }`}
                  disabled={isEnd}
                  aria-label="Next slide"
                  aria-disabled={isEnd}
                >
                  <MdOutlineArrowForwardIos size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurServices;
