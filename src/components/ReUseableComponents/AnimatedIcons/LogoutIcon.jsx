import React, { useState } from "react";
import { IoLogOutOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import CustomImageTag from "../CustomImageTag";
import { useTranslation } from "@/components/Layout/TranslationContext";
const LogoutIcon = () => {
  const [squish, setSquish] = useState(false);
  const t = useTranslation(); 
  // Handle the blob's proximity and trigger squish effect
  const handleBlobProximity = () => {
    setSquish(true);
    setTimeout(() => setSquish(false), 500); // Reset squish effect
  };

  return (
    <div className="relative w-24 h-24 bg-lightblue rounded-full overflow-hidden flex justify-center items-center">
      {/* Blob Animation */}
      <motion.div
        className="absolute w-full h-full"
        animate={{
          x: [0, 60, -60, 40, 0], // Blob moves in random directions
          y: [0, -30, 50, -50, 0],
          scale: squish ? [1, 0.8, 1.2, 1] : [1, 1, 1, 1], // Squish effect
        }}
        transition={{
          duration: 3, // Total duration of the loop
          ease: "easeInOut",
          repeat: Infinity, // Infinite loop
        }}
        onUpdate={(latest) => {
          // Detect proximity between blob and icon
          const distance = Math.sqrt(latest.x ** 2 + latest.y ** 2);
          if (distance < 80) { // If within proximity, trigger squish
            handleBlobProximity();
          }
        }}
      >
        <CustomImageTag
          src="https://images.unsplash.com/photo-1583524505974-6facd53f4597?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80"
          alt={t("blobImage")}
          className="w-full h-full object-cover absolute"
          imgClassName="object-cover"
        />
      </motion.div>

      {/* Centered Icon */}
      <div className="z-10">
        <IoLogOutOutline className="w-10 h-10 primary_text_color" />
      </div>
    </div>
  );
};

export default LogoutIcon;
