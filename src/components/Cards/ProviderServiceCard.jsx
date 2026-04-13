"use client";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";

const ProviderServiceCard = ({ title, description, imageUrl, number }) => {
  return (
    <div className="card_bg rounded-[12px] mx-auto group h-[110px] flex items-center px-3 sm:px-4 gap-3 sm:gap-4">
      {/* Image - 80x80 */}
      <div className="flex-shrink-0">
        <CustomImageTag
          src={imageUrl}
          alt={title}
          className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] object-cover"
          imgClassName="rounded-[8px] object-cover"
        />
      </div>

      {/* Title - Lexend 24px 600 weight */}
      <div className="flex-1 min-w-0">
        <h2
          className="font-semibold text-[16px] sm:text-[20px] md:text-[24px] leading-[20px] sm:leading-[24px] md:leading-[29px] text_color truncate"
          style={{ fontFamily: "Lexend, sans-serif" }}
        >
          {title}
        </h2>
      </div>

      {/* Index - 65x65 */}
      <div className="flex-shrink-0 w-[45px] h-[45px] sm:w-[55px] sm:h-[55px] md:w-[65px] md:h-[65px] flex items-center justify-center">
        <span
          className="font-semibold text-[18px] sm:text-[22px] md:text-[28px] text-[#2121219E]"
          style={{ fontFamily: "Lexend, sans-serif" }}
        >
          {number.toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
};

export default ProviderServiceCard;
