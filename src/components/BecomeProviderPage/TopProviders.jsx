import React, { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Scrollbar } from "swiper/modules"; // Import Scrollbar
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar"; // Import Swiper scrollbar CSS
import ProviderCard from "../Cards/ProviderCard";
import CommanCenterText from "../ReUseableComponents/CommanCenterText";
import { useRTL } from "@/utils/Helper";

const TopProviders = ({ data }) => {
  const swiperRef = useRef(null);
  const isRTL = useRTL();
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [shouldLoop, setShouldLoop] = useState(true);
  const [hasValidData, setHasValidData] = useState(false);
  const [dynamicBreakpoints, setDynamicBreakpoints] = useState({});

  useEffect(() => {
    // Filter providers
    const filtered = data?.providers?.filter(
      (provider) => provider?.total_rating > 0 && provider?.services?.length > 0
    ) || [];
    
    setFilteredProviders(filtered);
    setHasValidData(filtered.length > 0);
    
    // Disable loop if we don't have enough providers
    setShouldLoop(filtered.length > 3);

    // Adjust breakpoints based on number of slides
    const adjustedBreakpoints = {
      320: {
        slidesPerView: Math.min(1, filtered.length),
      },
      375: {
        slidesPerView: Math.min(1, filtered.length),
      },
      576: {
        slidesPerView: Math.min(1.3, filtered.length),
      },
      768: {
        slidesPerView: Math.min(1.5, filtered.length),
      },
      992: {
        slidesPerView: Math.min(2, filtered.length),
      },
      1200: {
        slidesPerView: Math.min(2.5, filtered.length),
      },
      1400: {
        slidesPerView: Math.min(3, filtered.length),
      },
    };

    setDynamicBreakpoints(adjustedBreakpoints);
  }, [data]);

  const translatedShortHeadline = data?.translated_short_headline ? data?.translated_short_headline : data?.short_headline;
  const translatedTitle = data?.translated_title ? data?.translated_title : data?.title;
  const translatedDescription = data?.translated_description ? data?.translated_description : data?.description;

  // If no valid data after filtering, don't render the section
  if (!hasValidData) return null;

  // Render grid view for 2 or fewer providers
  if (filteredProviders.length <= 3) {
    return (
      <section className="top_providers card_bg py-8">
        <div className="container mx-auto">
          <CommanCenterText
            highlightedText={translatedShortHeadline}
            title={translatedTitle}
            description={translatedDescription}
          />
          <div className="provider_list grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            {filteredProviders.map((provider, index) => (
              <div key={index} className="flex justify-center">
                <ProviderCard provider={provider} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Render swiper for more than 2 providers
  return (
    <section className="top_providers card_bg py-8">
      <div className="container mx-auto">
        <CommanCenterText
          highlightedText={translatedShortHeadline}
          title={translatedTitle}
          description={translatedDescription}
        />
        <div className="provider_list flex justify-center mt-5">
          <Swiper
            dir={isRTL ? "rtl" : "ltr"}
            spaceBetween={20}
            slidesPerView={Math.min(2, filteredProviders.length)}
            breakpoints={dynamicBreakpoints}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            key={isRTL}
            loop={shouldLoop}
            modules={[Scrollbar, Autoplay]}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            scrollbar={{
              hide: false,
              draggable: true,
              dragSize: 100, // Adjust the size of the drag handle
            }}
            className="custom-swiper" // Add a custom class for styling
          >
            {filteredProviders.map((provider, index) => (
              <SwiperSlide key={index}>
                <ProviderCard provider={provider} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default TopProviders;
