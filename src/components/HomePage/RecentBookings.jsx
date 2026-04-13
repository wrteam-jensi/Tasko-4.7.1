import React from "react";
import CommanHeadline from "../ReUseableComponents/CommanHeadline";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay, FreeMode } from "swiper/modules";
import RecentBookingCard from "../Cards/RecentBookingCard";
import { useTranslation } from "../Layout/TranslationContext";
import { useRTL } from "@/utils/Helper";

const RecentBookings = ({ data }) => {
  const isRTL = useRTL();
  const breakpoints = {
    320: {
      slidesPerView: 1,
    },
    375: {
      slidesPerView: 1,
    },
    576: {
      slidesPerView: 1.5,
    },
    768: {
      slidesPerView: 1.8,
    },
    992: {
      slidesPerView: 2,
    },
    1200: {
      slidesPerView: 2,
    },
    1400: {
      slidesPerView: 2,
    },
    1600: {
      slidesPerView: 2.5,
    },
  };

  const translatedTitle = data?.translated_title ? data?.translated_title : data?.title;
  const translatedDescription = data?.translated_description ? data?.translated_description : data?.description;

  return (
    <div className="py-8 light_bg_color">
      <div className="container mx-auto px-4 md:px-8">
        <CommanHeadline
          headline={translatedTitle}
          subHeadline={translatedDescription}
          link={""}
        />
        <div>
          <Swiper
          dir={isRTL ? "rtl" : "ltr"}
            modules={[Autoplay, FreeMode]} // Include FreeMode module
            spaceBetween={30}
            loop={true}
            key={isRTL}
            autoplay={{ delay: 3000 }} // Autoplay functionality
            freeMode={true} // Enable free mode
            breakpoints={breakpoints} // Add breakpoints here
            className="mySwiper"
          >
            {data?.previous_order?.map((booking) => (
              <SwiperSlide key={booking.id}>
                <RecentBookingCard booking={booking} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default RecentBookings;
