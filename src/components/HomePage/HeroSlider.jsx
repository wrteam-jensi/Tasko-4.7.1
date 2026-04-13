"use client";
import React, { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IoLocationOutline, IoSearchOutline } from "react-icons/io5";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { convertToSlug, useRTL } from "@/utils/Helper";
import { FiChevronRight } from "react-icons/fi";
import { logClarityEvent } from "@/utils/clarityEvents";
import { HOME_EVENTS } from "@/constants/clarityEventNames";

import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import LocationModal from "../ReUseableComponents/LocationModal";
import { toast } from "sonner";
import { useTranslation } from "../Layout/TranslationContext";

const CustomNavigation = ({ onPrev, onNext }) => (
  <>
    <button
      onClick={onPrev}
      className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white z-10 p-2 rounded-full focus:outline-none hover:bg-opacity-75 transition-all"
      aria-label="Previous slide"
    >
      <ChevronLeft className="w-6 h-6 text-black" />
    </button>
    <button
      onClick={onNext}
      className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white z-10 p-2 rounded-full focus:outline-none hover:bg-opacity-75 transition-all"
      aria-label="Next slide"
    >
      <ChevronRight className="w-6 h-6 text-black" />
    </button>
  </>
);

const CustomPagination = ({ totalSlides, currentSlide, goToSlide, isRTL, isPaused }) => {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    setProgress(0);
    setOpacity(0);

    const duration = 3000;
    const totalSteps = 100;
    const stepDuration = duration / totalSteps;

    const animateProgress = () => {
      let currentStep = 0;

      const interval = setInterval(() => {
        if (isPaused) {
          return;
        }

        if (currentStep < totalSteps) {
          const newProgress = (currentStep / totalSteps) * 100;
          const newOpacity = newProgress / 100;

          setProgress(newProgress);
          setOpacity(newOpacity);

          currentStep += 1;
        } else {
          setProgress(100);
          setOpacity(1);
          clearInterval(interval);
        }
      }, stepDuration);

      return interval;
    };

    animationRef.current = animateProgress();

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [currentSlide, isPaused]);

  return (
    <div className="absolute bottom-24 md:bottom-24 left-1/2 transform -translate-x-1/2 flex z-10 bg-white dark:bg-[#212121] p-2 rounded-full">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          onClick={() => goToSlide(index)}
          className={`rounded-full transition-all relative overflow-hidden light_bg_color border border-[#ebf4ff] ${index === currentSlide ? "w-6 h-3" : "w-3 h-3"
            } ${isRTL ? "ml-2" : "mr-2"} last:m-0`}
          aria-label={`Go to slide ${index + 1}`}
        >
          {index === currentSlide && (
            <div
              className="absolute bottom-0 primary_bg_color border border_color"
              style={{
                [isRTL ? "right" : "left"]: "0",
                width: `${progress}%`,
                height: "12px",
                opacity: opacity,
                transition: "width 0.1s ease-in-out, opacity 0.1s ease-in-out",
                transform: isRTL ? "scaleX(-1)" : "none"
              }}
            ></div>
          )}
        </button>
      ))}
    </div>
  );
};

const HeroSlider = ({ sliderData }) => {
  const t = useTranslation();
  const isRTL = useRTL();
  const locationData = useSelector((state) => state.location);
  const swiperRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const handleClose = () => setIsModalOpen(false);

  const handleSlideChange = (swiper) => {
    let newIndex = swiper.realIndex; // `realIndex` gives the actual slide index in loop mode
    setCurrentSlide(newIndex);
  };

  const router = useRouter();

  const handleRouteSlider = (e, slide) => {
    e.preventDefault();

    // Track banner taps so product can measure which hero cards convert.
    logClarityEvent(HOME_EVENTS.HOME_BANNER_TAPPED, {
      slide_id: slide?.id,
      slide_type: slide?.original_type,
    });

    switch (slide?.original_type) {
      case "url":
        if (slide?.url) {
          // If the slide type is "url", open the specified URL in a new tab
          window.open(slide?.url, "_blank");
        } else {
          console.warn("Missing URL:", slide);
        }
        break;

      case "provider":
        // For "provider", open the provider route
        const providerRoute = `/provider-details/${slide?.provider_slug}`;
        router.push(providerRoute);
        break;

      case "Category":
      case "Sub Category":
        // Handle both main categories and subcategories
        let categoryRoute = '/service';

        // If parent_category_slugs array exists and has items, use them to build the path
        if (slide?.parent_category_slugs && slide?.parent_category_slugs.length > 0) {
          // Add all parent category slugs in order
          categoryRoute += `/${slide.parent_category_slugs.join('/')}`;
          // Add the current category slug at the end
          categoryRoute += `/${slide.category_slug}`;
        } else {
          // If no parent categories, just use the category slug
          categoryRoute += `/${slide.category_slug}`;
        }

        router.push(categoryRoute);
        break;

      default:
        console.warn("Invalid slide type or missing data:", slide);
        break;
    }
  };

  const handleSearchServiceOrProvider = () => {
    if (!searchQuery.trim()) {
      // Show a toast error when search query is empty
      toast.error(t("pleaseTypeServiceOrProviderName"));
      return; // Exit the function
    }

    const slug = convertToSlug(searchQuery); // Convert the search query to a slug

    // Navigate to the search page
    router.push(`/search/${slug}`);
    logClarityEvent(HOME_EVENTS.SERVICE_SEARCH_SUBMITTED, {
      query_length: searchQuery.trim().length,
    });
  };

  useEffect(() => {
    const swiperInstance = swiperRef.current;

    const stopAutoplay = () => {
      swiperInstance?.autoplay?.stop();
      setIsPaused(true);
    };

    const startAutoplay = () => {
      swiperInstance?.autoplay?.start();
      setIsPaused(false);
    };

    if (swiperInstance && swiperInstance.el) {
      swiperInstance.el.addEventListener("mouseenter", stopAutoplay);
      swiperInstance.el.addEventListener("mouseleave", startAutoplay);

      return () => {
        if (swiperInstance.el) {
          swiperInstance.el.removeEventListener("mouseenter", stopAutoplay);
          swiperInstance.el.removeEventListener("mouseleave", startAutoplay);
        }
      };
    }
  }, []);
  const isSliderData = sliderData && sliderData?.length > 0
  return (
    <div className={`relative ${isSliderData ? "md:pb-16" : ""} heroSliderSection`}>
      <div className={`relative w-full group ${isSliderData
        ? "aspect-slider"
        : "h-full my-10"
        }`}>
        {isSliderData ? (
          <>
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              dir={isRTL ? "rtl" : "ltr"}
              key={isRTL}
              loop={true}
              onSlideChange={handleSlideChange}
              navigation={{
                prevEl: ".swiper-button-prev",
                nextEl: ".swiper-button-next",
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
                waitForTransition: true,
              }}
              pagination={{ clickable: true }}
              className="h-full w-full"
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                swiper.autoplay.start();
              }}
            >
              {sliderData.map((slide, index) => (
                <SwiperSlide
                  key={slide?.id}
                  onClick={(e) => handleRouteSlider(e, slide)}
                >
                  <CustomImageTag
                    alt={t("sliderImage")}
                    src={slide?.slider_web_image}
                    className="w-full h-full object-contain"
                    imgClassName="object-contain"
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            {sliderData?.length > 1 && (
              <>
                {/* Custom navigation buttons */}
                <div className="hidden sm:hidden md:group-hover:block opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <CustomNavigation
                    onPrev={() => swiperRef.current?.slidePrev()}
                    onNext={() => swiperRef.current?.slideNext()}
                  />
                </div>


                {/* Custom pagination */}
                <div className="!hidden md:!block">
                  <CustomPagination
                    totalSlides={sliderData?.length}
                    currentSlide={currentSlide}
                    goToSlide={(index) => swiperRef.current?.slideTo(index)}
                    isRTL={isRTL}
                    isPaused={isPaused}
                  />
                </div>
              </>
            )}
          </>
        ) : null}


        {/* Location and Search Section - Always visible for users to change location */}
        <div className={`light_bg_color ${isSliderData ? "pt-6 -mt-6 sm:mt-0 md:pt-0 md:bg-transparent" : "py-4 mt-0"} searchLocation`}>
          <div className="container md:mx-auto">
            <div className={`md:card_bg rounded-xl py-4 md:p-4 relative ${isSliderData ? " md:-mt-8" : "mt-0"} left-0 right-0 mx-auto z-10 max-w-full lg:max-w-4xl flex flex-row items-center justify-between md:border border-[#2121212e] gap-4`}>
              {/* Location Section */}
              <div className="card_bg p-3 rounded-[6px] md:rounded-none md:p-0 location flex items-center w-max md:w-1/2 text-center md:text-left" onClick={() => setIsModalOpen(true)}>
                <div className="flex flex-1 items-center justify-between  w-full">
                  <IoLocationOutline size={24} className="primary_text_color max-w-6 w-full" />
                  <input
                    readOnly
                    className="hidden md:block ml-2 focus:outline-none w-full text-sm sm:text-base !bg-transparent"
                    placeholder={t("enterLocation")}
                    value={locationData?.locationAddress}
                  />
                  <div
                    className={`hidden md:flex flex-1 items-center w-full ${isRTL ? "rotate-180" : "rotate-0"}`}
                  >
                    {""} <FiChevronRight size={24} />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block divider h-6 w-px bg-gray-300"></div>

              {/* Search Input */}
              <div className="card_bg p-3 rounded-[12px] shadow-[0px_6px_16px_0px_rgba(0,0,0,0.04)] border-[0.5px] md:shadow-none md:border-none md:rounded-none md:p-0 md:bg-transparent searchProvider w-full md:w-1/2 flex items-center gap-2">
                <IoSearchOutline size={24} className="description_color" />

                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} // Corrected here
                  type="text"
                  placeholder={t("searchService")}
                  className="bg-transparent border-none focus:outline-none w-full description_color"
                />
              </div>

              {/* Search Button */}
              <div
                className="absolute top-[26px] right-2 rtl:left-2 rtl:right-auto md:relative md:top-0 md:right-0 search w-max md:w-auto text-center md:text-end"
                onClick={handleSearchServiceOrProvider}
              >
                <button className="primary_bg_color text-white rounded-md text-xs sm:text-base px-2 py-1 sm:px-3 md:px-6 md:py-2 w-full md:w-auto transition">
                  {t("search")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <LocationModal open={isModalOpen} onClose={handleClose} />
      )}
    </div>
  );
};

export default HeroSlider;
