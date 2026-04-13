import React, { useRef, useState } from "react";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import ReviewCard from "../Cards/ReviewCard";
import { useRTL } from "@/utils/Helper";
import Lightbox from "../ReUseableComponents/CustomLightBox/LightBox";

const Reviews = ({ title, desc, data }) => {
  const swiperRef = useRef(null); 
  const isRTL = useRTL();
  
  // State to manage lightbox - lifted to parent component
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  // Handle image click from ReviewCard - open lightbox with images
  const handleImageClick = (images, index) => {
    if (images && images.length > 0) {
      setLightboxImages(images);
      setInitialImageIndex(index);
      setIsLightboxOpen(true);
    }
  };

  // Handle lightbox close
  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
  };

  const breakpoints = {
    320: {
      slidesPerView: 1,
    },
    375: {
      slidesPerView: 1.2,
    },
    576: {
      slidesPerView: 2,
    },
    768: {
      slidesPerView: 2,
    },
    992: {
      slidesPerView: 2.2,
    },
    1200: {
      slidesPerView: 2.5,
    },
    1400: {
      slidesPerView: 3,
    },
  };

  return (
    <section id="review" className="relative py-8 md:py-20 primary_bg_color !z-[1]">
      <div className="container mx-auto flex flex-col md:flex-row items-center gap-8">
        {/* Left section */}
        <div className="text-white md:w-1/3">
          <h2 className="text-xl md:text-2xl lg:main_headlines  font-bold text-white w-full mx-auto">
            {title}
          </h2>
          <p className="mt-2">{desc}</p>
          {data?.length > 3 && (
            <div className="flex items-center justify-start gap-4 mt-8">
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                className="p-2 bg-transparent text-white border border-white rounded-full"
              >
                <MdOutlineArrowBackIosNew size={20} />
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                className="p-2 bg-transparent text-white border border-white rounded-full"
              >
                <MdOutlineArrowForwardIos size={20} />
              </button>
            </div>
          )}
        </div>
        {/* Right section */}
        <div className="w-full md:w-2/3">
          <Swiper
            spaceBetween={20}
            slidesPerView={1}
            key={isRTL}
            breakpoints={breakpoints}
            dir={isRTL ? "rtl" : "ltr"}
            modules={[Navigation]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            className="custom-swiper"
          >
            {data.map((review, index) => (
              <SwiperSlide key={index} className="h-auto">
                <ReviewCard 
                  review={review} 
                  onImageClick={handleImageClick}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Lightbox Component - Rendered at parent level, outside Swiper */}
      {lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          initialIndex={initialImageIndex}
          isLightboxOpen={isLightboxOpen}
          onClose={handleCloseLightbox}
        />
      )}
    </section>
  );
};

export default Reviews;
