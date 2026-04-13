import { useTranslation } from "@/components/Layout/TranslationContext";
import React from "react";
import CustomImageTag from "../CustomImageTag";
import { somthingWentWrongImage } from "./Images";

const SomethingWentWrong = () => {
  const  t  = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center card_bg text-center p-4">
      {/* Main Content */}
      <div className="max-w-md space-y-6 flex flex-col items-center justify-center">
        {/* Illustration */}
        {somthingWentWrongImage}


        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t("somethingWentWrongTitle")}
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-xl text-gray-600 dark:text-white">
          {t("somethingWentWrongText")}
        </p>

       
      </div>
    </div>
  );
};

export default SomethingWentWrong;