import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { BsPlayCircleFill } from "react-icons/bs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CustomImageTag from "../CustomImageTag";

import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

const Lightbox = ({ images, initialIndex = 0, onClose, isLightboxOpen }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);

  // Update current index when initialIndex changes (when lightbox opens with specific image)
  useEffect(() => {
    if (isLightboxOpen) {
      setCurrentIndex(initialIndex || 0);
    }
  }, [initialIndex, isLightboxOpen]);

  // Keyboard navigation - must be before early return
  useEffect(() => {
    if (!isLightboxOpen || !images || images.length === 0) return;

    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      }
      if (event.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, images, onClose]);

  // Handle case where images might be undefined or empty
  if (!images || images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  const isVideo = (item) => {
    // If item is an object, use src, otherwise use item itself
    const url = typeof item === "string" ? item : item?.src;
    if (!url || typeof url !== "string") return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i);
  };



  return (
    <Dialog open={isLightboxOpen} onOpenChange={onClose}>
      {/* Dialog Content */}
      <DialogContent className="flex flex-col items-center bg-transparent border-none text-white p-4 max-w-7xl mx-auto rounded-lg shadow-none z-[9999]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-xl rtl:left-2 rtl:right-auto z-10 p-2"
          aria-label="Close"
        >
          <MdClose size={24} />
        </button>

        {/* Main Image/Video Section */}
        <div className="flex items-center justify-center w-full mb-4 h-[70vh] relative">
          {images?.length > 1 && (
            <button
              className="absolute left-0 text-white text-3xl p-2 z-20"
              onClick={handlePrev}
              aria-label="Previous"
            >
              <FaArrowLeft />
            </button>
          )}
          <div className="flex items-center justify-center mx-auto max-w-[90vw] md:max-w-[70vw] max-h-[80vh] md:max-h-[70vh] w-full h-full">
            {isVideo(images[currentIndex]) ? (
              <div className="w-full h-full flex items-center justify-center">
                <video
                  key={typeof images[currentIndex] === 'string' ? images[currentIndex] : images[currentIndex]?.src}
                  src={typeof images[currentIndex] === 'string' ? images[currentIndex] : images[currentIndex]?.src}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[70vh] object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <CustomImageTag
                src={typeof images[currentIndex] === 'string' ? images[currentIndex] : images[currentIndex]?.src}
                alt={images[currentIndex]?.alt || `Image ${currentIndex}`}
                className="w-full h-full object-contain mx-4 max-w-[60vh] md:max-w-[30vw] max-h-[80vh] md:max-h-[60vh] rounded-[18px]"
                imgClassName="rounded-[18px]"
              />
            )}
          </div>
          {images?.length > 1 && (
            <button
              className="absolute right-0 text-white text-3xl p-2 z-20"
              onClick={handleNext}
              aria-label="Next"
            >
              <FaArrowRight />
            </button>
          )}
        </div>

        {/* Footer Thumbnails */}
        <div className="flex items-center overflow-x-auto mt-4 gap-1 justify-center relative z-50 w-3/4">
          {images?.map((image, index) => (
            <div
              key={index}
              onClick={() => handleThumbnailClick(index)}
              style={{ pointerEvents: "auto" }}
              className="relative"
            >
              {isVideo(image) ? (
                <div className={`w-16 aspect-square object-cover cursor-pointer ${index === currentIndex
                  ? "border-2 border_color"
                  : "border border-gray-300"
                  } rounded-md bg-black/50 flex items-center justify-center`}>
                  <BsPlayCircleFill size={20} className="text-white" />
                </div>
              ) : (
                <CustomImageTag
                  src={typeof image === 'string' ? image : image?.src}
                  alt={image?.alt || `Thumbnail ${index}`}
                  className={`w-16 aspect-square object-cover cursor-pointer ${index === currentIndex
                    ? "border-2 border_color"
                    : "border border-gray-300"
                    } rounded-md`}
                />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Lightbox;
