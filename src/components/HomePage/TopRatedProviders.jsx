import { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules"; // Import Scrollbar
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar"; // Import Swiper scrollbar CSS
import { useRTL } from "@/utils/Helper";
import TopRatedProviderCard from "../Cards/TopRatedProviderCard";
import CommanHeadline from "../ReUseableComponents/CommanHeadline";

const TopRatedProviders = ({ data }) => {
  const swiperRef = useRef(null);
  const isRTL = useRTL();
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [shouldLoop, setShouldLoop] = useState(true);
  const [hasValidData, setHasValidData] = useState(false);

  useEffect(() => {
    // Filter providers
    const filtered = data?.partners
    
    setFilteredProviders(filtered);
    setHasValidData(filtered.length > 0);
    
    // Disable loop if we don't have enough providers
    setShouldLoop(filtered.length > 4);
  }, [data]);

  // If no valid data after filtering, don't render the section
  if (!hasValidData) return null;

  const breakpoints = {
    320: {
      slidesPerView: 1,
    },
    375: {
      slidesPerView: 1.3,
    },
    576: {
      slidesPerView: 1.5,
    },
    768: {
      slidesPerView: 2,
    },
    992: {
      slidesPerView: 2.5,
    },
    1200: {
      slidesPerView: 3,
    },
    1400: {
      slidesPerView: 4,
    },
  };

  const translatedHeadline = data?.translated_short_headline ? data?.translated_short_headline : data?.short_headline;
  const translatedTitle = data?.translated_title ? data?.translated_title : data?.title;
  const translatedDescription = data?.translated_description ? data?.translated_description : data?.description;
  
  return (
    <section className="top_providers card_bg py-8">
      <div className="container mx-auto">

        <CommanHeadline 
          headline={translatedTitle}
          subHeadline={translatedDescription}
          link={""}
        />
        <div className="">
          <Swiper
            dir={isRTL ? "rtl" : "ltr"}
            spaceBetween={20}
            slidesPerView={2}
            breakpoints={breakpoints}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            key={isRTL}
            loop={shouldLoop}
            modules={[Autoplay]}
            className="custom-swiper" // Add a custom class for styling
          >
            {filteredProviders.map((provider, index) => (
              <SwiperSlide key={index}>
                <TopRatedProviderCard provider={provider} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default TopRatedProviders;
