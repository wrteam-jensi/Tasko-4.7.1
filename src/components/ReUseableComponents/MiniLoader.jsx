import React from "react";
import animationData from "../../assets/lottie/mini_loader.json";
import Lottie from "lottie-react"; // For animations

const MiniLoader = ({ chatPage }) => {
  return (
    <Lottie
      animationData={animationData}
      style={{ height: 30, width: chatPage ? 30 : 108 }}
      loop
      autoplay
    />
  );
};

export default MiniLoader;
