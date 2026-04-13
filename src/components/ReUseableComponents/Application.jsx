import React from "react";
import { useTranslation } from "../Layout/TranslationContext";
import { useSelector } from "react-redux";
import CustomLink from "./CustomLink";
import Link from "next/link";

const Application = ({isReview}) => {
  const t = useTranslation();
  const settings = useSelector((state) => state?.settingsData?.settings);
  const appSettings = settings.app_settings;

  const appStoreLink = appSettings?.provider_appstore_url;
  const playStoreLink = appSettings?.provider_playstore_url;
  
  const leftSideShap = (
    <div className="absolute top-0 -left-2 hidden lg:block">
      <svg
        width="130"
        height="278"
        viewBox="0 0 130 278"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shape"
      >
        <path d="M114.299 145.245C141.192 186.781 127.68 248.55 112.866 278H58.6272H-1.57839V139.5V9.22939e-05C-7.02701 -2.80303e-05 -1.57839 3.81494e-06 -1.57839 3.81494e-06V9.22939e-05C1.28044 0.000155427 7.13928 0.000260452 18.3592 0.00043395C43.3496 0.000820383 95.6623 9.67204e-05 119.078 2.62628e-06C120.287 -2.23131e-06 77.8895 40.5894 42.6185 75.8604C14.4789 104 88.1225 104.814 114.299 145.245Z" />
      </svg>
    </div>
  );
  const rightSideShap = (
    <div className="absolute top-0  -right-2 hidden lg:block">
      <svg
        width="129"
        height="278"
        viewBox="0 0 129 278"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shape"
      >
        <path d="M15.3197 132.755C-11.4321 91.2194 2.00906 29.4498 16.7456 0H70.7005H130.591V138.5V278C136.011 278 130.591 278 130.591 278V278C127.747 278 121.919 278 110.758 278C85.8982 277.999 33.8592 278 10.566 278C9.3635 278 51.5391 237.411 86.6255 202.14C114.618 174 41.3596 173.186 15.3197 132.755Z" />
      </svg>
    </div>
  );

  const playStore = (
    <svg
      width="33"
      height="32"
      viewBox="0 0 33 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="store_icons"
    >
      <path d="M17.772 15.4879L21.7147 11.5453L8.98 4.38793C8.136 3.93193 7.34533 3.86793 6.65199 4.3666L17.772 15.4879ZM22.3867 20.1039L26.4853 17.7986C27.2853 17.3506 27.724 16.7159 27.724 16.0119C27.724 15.3093 27.2853 14.6733 26.4867 14.2253L22.776 12.1413L18.5987 16.3173L22.3867 20.1039ZM5.96666 5.33593C5.88133 5.5986 5.83333 5.89193 5.83333 6.21327V25.8199C5.83333 26.3279 5.94533 26.7653 6.14799 27.1133L16.944 16.3159L5.96666 5.33593ZM17.772 17.1426L7.03599 27.8799C7.24133 27.9586 7.46266 27.9999 7.69599 27.9999C8.11199 27.9999 8.54533 27.8773 8.98666 27.6319L21.3267 20.7026L17.772 17.1426Z" />
    </svg>
  );
  const apple = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="store_icons"
    >
      <path d="M26.22 22.4146C25.8508 23.2753 25.3946 24.096 24.8587 24.864C24.1427 25.8866 23.5547 26.5933 23.104 26.9866C22.404 27.6293 21.652 27.9599 20.848 27.9786C20.272 27.9786 19.576 27.8146 18.7653 27.4813C17.952 27.1493 17.2053 26.9866 16.5213 26.9866C15.8053 26.9866 15.0373 27.1493 14.2147 27.4813C13.3933 27.8146 12.7293 27.9893 12.2213 28.0053C11.452 28.0386 10.6827 27.6999 9.916 26.9866C9.42667 26.5599 8.81467 25.8266 8.08 24.7893C7.29333 23.6839 6.64667 22.3973 6.14 20.9346C5.59733 19.352 5.32533 17.8213 5.32533 16.3386C5.32533 14.6413 5.692 13.176 6.42667 11.9493C6.98233 10.9859 7.77673 10.1819 8.73333 9.61462C9.67662 9.04884 10.7534 8.7442 11.8533 8.73195C12.4667 8.73195 13.2707 8.92128 14.2667 9.29462C15.2627 9.66795 15.9027 9.85728 16.1813 9.85728C16.392 9.85728 17.1 9.63462 18.3053 9.19328C19.4427 8.78395 20.4027 8.61462 21.1893 8.68128C23.3227 8.85328 24.924 9.69328 25.9893 11.208C24.0827 12.3639 23.14 13.9813 23.1587 16.0573C23.1747 17.6746 23.7627 19.02 24.9147 20.088C25.424 20.5753 26.0182 20.9653 26.668 21.2386C26.5267 21.648 26.3773 22.0386 26.22 22.4146ZM21.3307 3.17328C21.3307 4.43995 20.8667 5.62395 19.9453 6.71862C18.8307 8.01995 17.484 8.77328 16.024 8.65462C16.0049 8.49534 15.9956 8.33504 15.996 8.17462C15.996 6.95728 16.524 5.65595 17.4667 4.59062C17.936 4.05195 18.5333 3.60262 19.2573 3.24528C19.98 2.89328 20.6627 2.69862 21.3053 2.66528C21.3227 2.83595 21.3307 3.00528 21.3307 3.17328Z" />
    </svg>
  );

  return (
    <div className={`${isReview ? "-mt-[100px]" : "my-10"} transition-all ease-in-out duration-300`}>
      <div className="relative bg-[#000] overflow-hidden rounded-[30px] py-14 px-4 md:px-8 lg:px-12 border-none">
        {leftSideShap}
        <div className="flex flex-col items-center justify-center gap-4 mx-auto text-center">
          <span className="text-xl xl:text-[40px] leading-[32px] xl:leading-[48px] font-bold text-white w-full xl:w-[50%]">
            {t("exprienceTheMagicOfThe")} {""}
            {process.env.NEXT_PUBLIC_APP_NAME}
            {""} {t("providerApp")}
          </span>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={playStoreLink}
              target="_blank"
              className="flex w-auto items-center justify-center px-2 py-2 gap-2 bg-[#FFFFFF3D] hover:bg-white transition-all ease-in-out duration-300 hover:primary_text_color text-white font-bold text-sm lg:text-[20px] rounded-md icon"
            >
              {playStore}
              <span>{t("googlePlay")}</span>
            </Link>
            <Link
              href={appStoreLink}
              target="_blank"
              className="flex w-auto items-center justify-center px-2 py-2 gap-2 bg-[#FFFFFF3D] hover:bg-white transition-all ease-in-out duration-300 hover:primary_text_color text-white font-bold text-sm lg:text-[20px] rounded-md icon"
            >
              {apple}
              <span>{t("appStore")}</span>
            </Link>
          </div>
        </div>
        {rightSideShap}
      </div>
    </div>
  );
};

export default Application;
