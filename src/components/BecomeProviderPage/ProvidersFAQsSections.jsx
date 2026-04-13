import React, { useState } from "react";
import FaqAccordion from "../ReUseableComponents/FaqAccordion";
import CommanCenterText from "../ReUseableComponents/CommanCenterText";
import { useTranslation } from "../Layout/TranslationContext";

const ProvidersFAQsSections = ({ data }) => {
  const t = useTranslation();

  const [visibleFaqs, setVisibleFaqs] = useState(5); // Initially show 5 FAQs


  const loadMore = () => {
    setVisibleFaqs((prevVisibleFaqs) => prevVisibleFaqs + 5); // Show 5 more FAQs on each click
  };

  const translatedShortHeadline = data?.translated_short_headline ? data?.translated_short_headline : data?.short_headline;
  const translatedTitle = data?.translated_title ? data?.translated_title : data?.title;
  const translatedDescription = data?.translated_description ? data?.translated_description : data?.description;

  const translatedFaqs = data?.translated_faqs ? data?.translated_faqs : data?.faqs;

  return (
    <section className="provider_faqs card_bg py-8 md:py-20 lg:p-[80px]">
      <div className="container mx-auto">
        <CommanCenterText
          highlightedText={translatedShortHeadline}
          title={translatedTitle}
          description={translatedDescription}
        />
        <div className="faqs_list flex flex-col justify-center gap-5 max-w-3xl mx-auto mt-5">
          {translatedFaqs?.slice(0, visibleFaqs).map((faq, index) => (

            <div key={index} className="fade-in">
              <FaqAccordion faq={faq} />
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {visibleFaqs < translatedFaqs?.length && (
          <div className="flex justify-center mt-8">
            <button
              className="px-6 py-2 bg-[#2D2C2F] text-white font-semibold rounded-lg hover:primary_bg_color transition-colors duration-300"
              onClick={loadMore}
            >
              {t("loadMore")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProvidersFAQsSections;
