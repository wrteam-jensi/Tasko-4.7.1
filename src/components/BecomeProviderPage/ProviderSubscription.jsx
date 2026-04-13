import React, { useRef } from "react";
import SubscriptionCard from "../Cards/SubscriptionCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules"; // Import Navigation
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar"; // Import Swiper scrollbar CSS
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useRTL } from "@/utils/Helper";
import CustomLink from "../ReUseableComponents/CustomLink";
import { useTranslation } from "../Layout/TranslationContext";

const ProviderSubscription = ({ data }) => {
  const swiperRef = useRef(null);
  const isRTL = useRTL();
  const t = useTranslation();
  // Function to go to the next slide
  const goNext = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  // Function to go to the previous slide
  const goPrev = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  // Original breakpoints for reference
  const originalBreakpoints = {
    320: 1,
    375: 1.1,
    576: 1.5,
    768: 2,
    992: 2.5,
    1200: 3,
    1400: 3.5,
  };

  // Dynamically generate breakpoints so slidesPerView never exceeds planCount
  function getDynamicBreakpoints(planCount) {
    const dynamic = {};
    Object.entries(originalBreakpoints).forEach(([bp, val]) => {
      dynamic[bp] = {
        slidesPerView: Math.min(val, planCount),
      };
    });
    return dynamic;
  }

  const breakpoints = getDynamicBreakpoints(data?.subscriptions?.length || 0);

  // Find the max slidesPerView from breakpoints
  const maxSlidesPerView = Math.max(...Object.values(originalBreakpoints));

  // Enable loop only if there are more plans than the max slides per view
  const enableLoop = data?.subscriptions?.length > maxSlidesPerView;

  const translatedShortHeadline = data?.translated_short_headline ? data?.translated_short_headline : data?.short_headline;
  const translatedTitle = data?.translated_title ? data?.translated_title : data?.title;
  const translatedDescription = data?.translated_description ? data?.translated_description : data?.description;

  return (
    <section id="provider_subscription" className="relative">
      {data?.subscriptions?.length === 1 ? (
        // Layout for single subscription
        <div className="relative primary_bg_color">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mx-auto px-4 lg:px-0 max-w-screen-xl py-8 md:py-20">
            {/* Left Text Section */}
            <div className="flex-1 text-left max-w-lg">
              <span className="background_color text-white flex items-center gap-2 px-3 py-1 rounded-md text-sm md:tag_lines w-fit font-medium mb-4">
                <div className="clip-star w-5 h-5 bg-white" />
                <span className="text uppercase">{translatedShortHeadline}</span>
                <div className="clip-star w-5 h-5 bg-white" />
              </span>
              <h2 className="text-xl md:text-2xl lg:main_headlines font-bold text-white mb-4">
                {translatedTitle}
              </h2>
              <p className="text-white text-sm md:description_text font-normal mb-6">
                {translatedDescription}
              </p>
            
            </div>

            {/* Right Card Section */}
            <div className="flex-1 w-full max-w-md">
              <SubscriptionCard ele={data.subscriptions[0]} />
            </div>
          </div>
        </div>
      ) : (
        // Layout for multiple subscriptions
        <>
          <div className="subscription_details_header relative secondary_bg_color h-[405px]">
            <div className="container mx-auto">
              <div className="flex flex-col lg:flex-row gap-4 items-start justify-start xl:items-center xl:justify-center py-8 md:py-20">
                <div className="sub_titles flex flex-col gap-4">
                  <span className="background_color text-white flex items-center gap-2 px-3 py-1 rounded-md text-sm md:tag_lines w-fit font-medium">
                    <div className="clip-star w-5 h-5 bg-white" />
                    <span className="text uppercase">{translatedShortHeadline}</span>
                    <div className="clip-star w-5 h-5 bg-white" />
                  </span>
                  <h2 className="text-xl md:text-2xl lg:main_headlines font-bold text-white w-full mx-auto">
                    {translatedTitle}
                  </h2>
                </div>
                <div className="sub_desc flex flex-col gap-4">
                  <p className="text-white text-sm md:description_text font-normal">
                    {translatedDescription}
                  </p>
                  <div className="navigation_buttons flex items-center justify-start gap-2">
                    <button
                      onClick={goPrev}
                      className="px-3 py-1 border border-white text-white rounded-full w-[38px] h-[38px] flex items-center justify-center p-5"
                    >
                      <FaArrowLeft size={20} />
                    </button>
                    <button
                      onClick={goNext}
                      className="px-3 py-1 border border-white text-white rounded-full w-[38px] h-[38px] flex items-center justify-center p-5"
                    >
                      <FaArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="subscription_cards card_bg">
            <div className="container mx-auto">
              <div className="sub_cards relative -mt-[40px] py-0 sm:-mt-[80px] lg:py-0 lg:-mt-[80px]">
                <div className="flex justify-center mx-auto h-auto sm:h-[600px]">
                  <Swiper
                    spaceBetween={20} // Space between slides
                    slidesPerView={maxSlidesPerView}
                    breakpoints={breakpoints}
                    dir={isRTL ? "rtl" : "ltr"}
                    key={isRTL}
                    onSwiper={(swiper) => {
                      swiperRef.current = swiper;
                    }}
                    modules={[Navigation, Autoplay]}
                    autoplay={{
                      delay: 2500,
                      disableOnInteraction: false,
                    }}
                    loop={enableLoop}
                    className="custom-swiper"
                  >
                    {data?.subscriptions?.map((plan, index) => (
                      <SwiperSlide key={index}>
                          <SubscriptionCard ele={plan} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default ProviderSubscription;
