import { useRef } from "react";
import HighlightTag from "../ReUseableComponents/HighlightTag";
import { FaArrowLeft, FaArrowRight, FaStar } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules"; // Import Navigation
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar"; // Import Swiper scrollbar CSS
import ProviderReviewCard from "../Cards/ProviderReviewCard";
import { useTranslation } from "../Layout/TranslationContext";
import { useRTL } from "@/utils/Helper";

const ProviderReviews = ({ data, totalRating }) => {
  const swiperRef = useRef(null);
  const t = useTranslation();
  const isRTL = useRTL();
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

  const translatedShortHeadline = data?.translated_short_headline ? data?.translated_short_headline : data?.short_headline;
  const translatedTitle = data?.translated_title ? data?.translated_title : data?.title;
  const translatedDescription = data?.translated_description ? data?.translated_description : data?.description;


  return (
    <>
      <section className="provider_reviews light_bg_color">
        <div className="container mx-auto py-[80px] pb-[140px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
            <div className="review_headings flex flex-col items-start justify-center gap-2">
              <HighlightTag text={translatedShortHeadline} />

              <span className="text-2xl xl:main_headlines  font-bold">
                {translatedTitle}
              </span>
              <span className="text-sm xl:description_text description_color font-normal">
                {translatedDescription}
              </span>
              <div className="flex items-center justify-between w-full mt-[16px]">
                {totalRating > 0 && (
                  <div className="flex flex-col items-start justify-center">
                    <span className="flex items-center gap-2 rating_icon_color font-bold text-xl lg:text-[48px] leading-[56px]">
                      <span> {totalRating} </span>
                      <span>
                        {" "}
                        <FaStar />
                      </span>
                    </span>
                    <span className="text-[16px] lg:text-[28px] leading-[34px] font-medium opacity-45">
                      {t("overAllRating")}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-3">
                  <button
                    className="flex items-center justify-center w-[38px] h-[38px] bg-transparent border border-black dark:border-white rounded-full"
                    onClick={goPrev}
                  >
                    <FaArrowLeft />
                  </button>
                  <button
                    className="flex items-center justify-center w-[38px] h-[38px] bg-transparent border border-black dark:border-white rounded-full"
                    onClick={goNext}
                  >
                    <FaArrowRight />
                  </button>
                </div>
              </div>
            </div>
            <div className="reviews_list">
              <Swiper
                key={isRTL}
                spaceBetween={20} // Space between slides
                slidesPerView={1}
                dir={isRTL ? "rtl" : "ltr"}
                modules={[Navigation, Autoplay]}
                autoplay={{
                  delay: 2500,
                  disableOnInteraction: false,
                }}
                loop={true}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                className="custom-swiper"
              >
                {data?.reviews?.map((review, index) => (
                  <SwiperSlide key={index}>
                    <ProviderReviewCard review={review} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </section>
      
    </>
  );
};

export default ProviderReviews;
