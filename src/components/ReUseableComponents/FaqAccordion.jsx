import React, { useState } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";

const FaqAccordion = ({ faq }) => {
  const [openItem, setOpenItem] = useState(null);

  const toggleFAQ = (index) => {
    setOpenItem((prev) => (prev === index ? null : index));
  };

  const translatedQuestion = faq?.translated_question ? faq?.translated_question : faq?.question;
  const translatedAnswer = faq?.translated_answer ? faq?.translated_answer : faq?.answer;
  return (
    <div key={faq?.id} className="w-full">
      {/* Question Container */}
      <div
        className="accordion w-full card_bg border border-gray-200 rounded-lg cursor-pointer"
        onClick={() => toggleFAQ(faq?.id)}
      >
        <div
          className={`accordion_header flex items-center justify-between gap-4 p-5 rounded-t-lg transition-colors duration-300 ease-in-out ${openItem === faq?.id
            ? "bg-[#29363F] text-white rounded-t-lg"
            : "bg-transparent"
            }`}
        >
          <div className="w-full ">
            <span className={`text-base font-normal ${openItem !== faq?.id ? "line-clamp-1" : ""}`}>{translatedQuestion}</span>
          </div>
          {/* Toggle Icon */}
          {openItem === faq?.id ? (
            <FaMinus size={18} className="text-white" />
          ) : (
            <FaPlus size={18} className="text-black dark:text-white" />
          )}
        </div>
        {/* Answer Container */}  
        <div
          className={`overflow-hidden transition-max-height duration-300 ease-in-out ${openItem === faq?.id ? "max-h-fit" : "max-h-0"
            }`}
        >
          <div className="p-5 description_text opacity-45 font-normal">
            {translatedAnswer}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqAccordion;
