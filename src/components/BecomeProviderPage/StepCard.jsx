// components/StepCard.js
const StepCard = ({ data, number }) => {
  const translatedTitle = data?.translated_title ? data?.translated_title : data?.title;
  const translatedDescription = data?.translated_description ? data?.translated_description : data?.description;
  return (
    <div className="step card_bg p-4 md:p-6 rounded-[30px] flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 rtl:md:space-x-reverse md:space-x-6 w-full md:w-auto mx-auto border border-[#D8E0E6] h-auto md:h-[200px]">
      {/* Left: Number */}
      <div
        className="text-4xl md:text-6xl font-bold outlined_text"
        data-text={number.toString().padStart(2, "0")}
      >
        {number.toString().padStart(2, "0")}
      </div>

      {/* Right: Text Content */}
      <div className="border-t md:border-l rtl:md:border-l-0 rtl:md:border-r pt-4 md:pt-0 ltr:md:pl-6 rtl:md:pr-6 md:border-t-0">
        <h3 className="text-lg font-semibold">{translatedTitle}</h3>
        <p className="mt-2 opacity-45 line-clamp-1 md:line-clamp-2">
          {translatedDescription}
        </p>
      </div>
    </div>
  );
};

export default StepCard;
