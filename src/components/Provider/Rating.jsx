import React from "react";
import { IoIosStar, IoIosStarHalf, IoIosStarOutline } from "react-icons/io";

const Rating = ({ rating }) => {
  // Ensure rating is a valid number and default to 0 if invalid
  const validRating = isNaN(rating) || rating < 0 ? 0 : rating;

  // Get the number of full stars
  const fullStars = Math.floor(validRating);
  // Check if there's a half star
  const hasHalfStar = validRating % 1 !== 0;
  // Calculate the number of empty stars
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);


  return (
    <div className="mt-1 flex items-center justify-center flex-wrap">
      {/* Render full stars */}
      {Array(fullStars)
        .fill()
        .map((_, index) => (
          <IoIosStar
            key={`full-${index}`}
            className="text-[#FF9900]"
            size={26}
          />
        ))}

      {/* Render half star if applicable */}
      {hasHalfStar && <IoIosStarHalf className="text-[#FF9900]" size={26} />}

      {/* Render empty stars */}
      {Array(emptyStars)
        .fill()
        .map((_, index) => (
          <IoIosStarOutline
            key={`empty-${index}`}
            className="text-[#FF9900]"
            size={26}
          />
        ))}
    </div>
  );
};

export default Rating;
