import { useRTL } from "@/utils/Helper";
import React, { useEffect, useState } from "react";

const CategoryLoop = ({ categoryData }) => {
  const isRTL = useRTL();
  const [repeatCount, setRepeatCount] = useState(5);

  // Calculate repeat count based on category length
  useEffect(() => {
    const calculateRepeatCount = () => {
      if (!categoryData || categoryData.length === 0) return 5;

      // If only 1 category, repeat more times
      if (categoryData.length === 1) return 8;
      
      // If 2 categories, repeat 6 times
      if (categoryData.length === 2) return 6;
      
      // If 3 categories, repeat 4 times
      if (categoryData.length === 3) return 4;
      
      // For 4 or more categories, repeat 3 times
      return 3;
    };

    setRepeatCount(calculateRepeatCount());
  }, [categoryData]);

  // Create repeated data array based on calculated repeat count
  const repeatedData = Array(repeatCount).fill(categoryData).flat();

  const renderContent = () =>
    repeatedData.map((ele, index) => (
      <div
        className={`flex items-center gap-3 px-4 ${isRTL ? 'flex-row-reverse' : ''}`}
        key={`${ele?.id}-${index}`}
      >
        <span className="text-md md:text-xl leading-5 font-bold whitespace-nowrap">
          {ele?.translated_name ? ele?.translated_name : ele?.name}
        </span>
        <div className="clip-star w-4 h-4 bg-white dark:bg-black flex-shrink-0" />
      </div>
    ));

  return (
    <div className="overflow-hidden" key={isRTL}>
      <div className={`flex items-center w-max bg-black text-white dark:bg-white dark:text-black p-2 h-[80px] font-bold hover:pause-animation ${
        isRTL ? 'animate-marquee-rtl' : 'animate-marquee'
      }`}>
        {renderContent()}
        {/* Duplicate content for seamless loop */}
        {renderContent()}
      </div>
    </div>
  );
};

export default CategoryLoop;
