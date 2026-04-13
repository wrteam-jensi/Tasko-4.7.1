"use client";
import CategoryLoop from "./CategoryLoop";
import HighlightTag from "../ReUseableComponents/HighlightTag";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { useTranslation } from "../Layout/TranslationContext";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import { BsArrowRightCircleFill } from "react-icons/bs";
import CustomLink from "../ReUseableComponents/CustomLink";
import Link from "next/link";

// Utility function to format numbers with K suffix
const formatNumber = (num) => {
  if (num >= 1000) {
    const formattedNum = (num / 1000).toFixed(1);
    // Remove .0 if the decimal is zero
    return `${formattedNum.endsWith('.0') ? formattedNum.slice(0, -2) : formattedNum}k`;
  }
  return num.toString();
};
const ProfessionalServicesSection = ({ data, categoryData, happyCustomers, totalRating, providerPanelLink }) => {

  const translatedTitle = data?.translated_title ? data?.translated_title : data?.title;
  const translatedDescription = data?.translated_description ? data?.translated_description : data?.description;
  const translatedShortHeadline = data?.translated_short_headline ? data?.translated_short_headline : data?.short_headline;

  const t = useTranslation();
  return (
    <>
      <style jsx>{`
        .provider-swiper-container {
          width: 100%;
          height: 100%;
          border-radius: inherit;
          overflow: hidden;
        }

        .provider-swiper-slide {
          width: 100%;
          height: 100%;
          position: relative;
        }

        :global(.provider-services-swiper .swiper-slide) {
          opacity: 0;
          transition: opacity 1.5s ease-in-out;
        }

        :global(.provider-services-swiper .swiper-slide-active) {
          opacity: 1;
        }

        :global(.provider-services-swiper) {
          width: 100%;
          height: 100%;
          border-radius: inherit;
        }

        :global(.provider-services-swiper .swiper-slide img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: inherit;
        }

        .stats-badge {
          animation: floatAnimation 3s ease-in-out infinite;
          transition: all 0.3s ease;
          z-index: 20;
          transform-origin: center center;
        }

        .stats-badge:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .stats-badge.customers {
          animation-delay: 0s;
        }

        .stats-badge.rating {
          animation-delay: 1.5s;
        }

        @keyframes floatAnimation {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
      <section className="relative overflow-hidden light_bg_color">
        <div className="pb-0 pt-8 md:pt-20 relative z-10">
          <div className="container mx-auto flex flex-col justify-between items-center lg:flex-row gap-14">
            {/* Left Section */}
            <div className="text-center lg:text-left flex flex-col">
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <HighlightTag text={translatedShortHeadline} />
              </div>
              <span className="text-2xl md:main_headlines mt-[16px] md:mt-[24px] font-bold text_color">
                {translatedTitle}
              </span>
              <span className="text-sm md:description_text text_color font-normal">
                {translatedDescription}
              </span>
              {providerPanelLink &&
                <Link
                  href={providerPanelLink}
                  target="_blank"
                  className="bg-[#29363F] text-white py-3 px-4 rounded-full flex items-center gap-2 w-fit mt-4 text-base font-medium">
                  {t("getStarted")}
                  <BsArrowRightCircleFill size={20} />
                </Link>
              }

            </div>

            {/* Right Section */}
            <div className="relative w-full flex-shrink-0 lg:w-1/2 flex items-center justify-center">
              <div className="relative w-full max-w-[500px] aspect-providerHero rounded-t-[150px] md:rounded-t-[200px] lg:rounded-t-[250px] sm:right-50% border-r-[2px] border-t-[1px] border_color pr-2 pt-1">
                <div className="absolute top-4 -left-4 sm:-left-10 w-24 h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 clip-star primary_bg_color opacity-30 dark:bg-[#fff] dark:opacity-100" />

                <div className="relative z-[5] w-full h-full dark:card_bg rounded-t-[150px] md:rounded-t-[200px] lg:rounded-t-[250px] overflow-hidden">
                  <Swiper
                    modules={[Autoplay, EffectFade]}
                    effect="fade"
                    autoplay={{
                      delay: 5000,
                      disableOnInteraction: false,
                    }}
                    speed={1500}
                    loop={true}
                    className="provider-services-swiper"
                  >
                    {data?.images?.map((ele, index) => (
                      <SwiperSlide key={index} className="provider-swiper-slide">
                        <CustomImageTag
                          src={ele?.image}
                          alt={`service-${index}`}
                          className="w-full aspect-providerHero object-cover"
                          imgClassName="rounded-t-[150px] md:rounded-t-[200px] lg:rounded-t-[250px]"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                {/* Stats badges */}
                {happyCustomers > 0 && (
                  <div className="stats-badge customers absolute top-20 -right-4 md:top-24 md:-right-8 bg-white dark:secondary_bg_color border border-[#D8E0E6] rounded-[12px] text-left p-2 md:p-4">
                    <p className="text-lg md:text-2xl font-bold mb-2">{formatNumber(happyCustomers)}</p>
                    <p className="text_color opacity-60 font-medium text-sm md:text-base">
                      {t("happyCustomers")}
                    </p>
                  </div>
                )}

                {totalRating > 0 && (
                  <div className="stats-badge rating absolute bottom-12 -left-4 md:-left-10 bg-white dark:secondary_bg_color border border-[#D8E0E6] rounded-[12px] text-left p-4">
                    <p className="text-lg md:text-2xl font-bold mb-2">{totalRating.toFixed(2)} ★</p>
                    <p className="text_color opacity-60 font-medium text-sm md:text-base">
                      {t("overAllRating")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {categoryData?.length > 0 && <CategoryLoop categoryData={categoryData} />}
      </section>
    </>
  );
};

export default ProfessionalServicesSection;
