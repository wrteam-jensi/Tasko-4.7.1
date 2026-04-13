import React from "react";
import CommanHeadline from "../ReUseableComponents/CommanHeadline";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay, FreeMode, Pagination } from "swiper/modules";
import NearbyProviderCard from "../Cards/NearbyProviderCard";
import { useRTL } from "@/utils/Helper";
import CustomLink from "../ReUseableComponents/CustomLink";

const NearbyProviders = ({ data }) => {
  
  const isRTL = useRTL();
  const breakpoints = {
    320: {
      slidesPerView: 1,
    },
    375: {
      slidesPerView: 1.2,
    },
    576: {
      slidesPerView: 1.5,
    },
    768: {
      slidesPerView: 1.5,
    },
    992: {
      slidesPerView: 1.8,
    },
    1200: {
      slidesPerView: 1.8,
    },
    1400: {
      slidesPerView: 2.7,
    },
    1600: {
      slidesPerView: 3.5,
    },
  };

  const translatedTitle = data?.translated_title ? data?.translated_title : data?.title;
  const translatedDescription = data?.translated_description ? data?.translated_description : data?.description;

  return (
    <div className="categories py-[32px] nearByProviders">
      <div className="container mx-auto">
        <CommanHeadline
          headline={translatedTitle}
          subHeadline={translatedDescription}
          link={""}
        />

        <div>
          <Swiper
            modules={[Autoplay, FreeMode,Pagination]} // Include FreeMode module
            spaceBetween={20}
            loop={true}
            key={isRTL}
            slidesPerView={3.5} // Set to 3.5
            dir={isRTL ? "rtl" : "ltr"}
            autoplay={{ delay: 3000 }} // Autoplay functionality
            freeMode={true} // Enable free mode
            breakpoints={breakpoints} // Add breakpoints here
            navigation
            pagination={{
              clickable: true,
            }}
            className="mySwiper"
          >
            {data?.partners?.map((provider) => (
              <SwiperSlide key={provider.id}>
                <CustomLink
                  href={`/provider-details/${provider?.slug}`}
                  title={provider?.name}
                >
                  <NearbyProviderCard provider={provider} />
                </CustomLink>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default NearbyProviders;
