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
      slidesPerView: 1.2,
      spaceBetween: 15,
    },
    576: {
      slidesPerView: 2.2,
      spaceBetween: 20,
    },
    768: {
      slidesPerView: 3.2,
      spaceBetween: 20,
    },
    992: {
      slidesPerView: 4.2,
      spaceBetween: 20,
    },
    1200: {
      slidesPerView: 5.2,
      spaceBetween: 20,
    },
    1440: {
      slidesPerView: 5.8,
      spaceBetween: 20,
    },
    1600: {
      slidesPerView: 6.2,
      spaceBetween: 20,
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
            slidesPerView={1.1} 
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
              <SwiperSlide key={provider.id} className="h-auto flex">
                <CustomLink
                  href={`/provider-details/${provider?.slug}`}
                  title={provider?.name}
                  className="block w-full h-full"
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
