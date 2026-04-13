"use client";
import { RiMailSendLine } from "react-icons/ri";
import { LuClock } from "react-icons/lu";
import { PiPhoneCall } from "react-icons/pi";
import { IoLocationOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { useTranslation } from "./TranslationContext";
import CustomLink from "../ReUseableComponents/CustomLink";
import Link from "next/link";

const Footer = () => {
  const t = useTranslation();
  const settingsData = useSelector((state) => state?.settingsData);

  const websettings = settingsData?.settings?.web_settings;
  const general_settings = settingsData?.settings?.general_settings;

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


  const translatedFooterDescription = websettings?.translated_footer_description ? websettings?.translated_footer_description : websettings?.footer_description;
  const translatedCopyrightDetails = general_settings?.translated_copyright_details ? general_settings?.translated_copyright_details : general_settings?.copyright_details;
  const translatedAddress = general_settings?.translated_address ? general_settings?.translated_address : general_settings?.address;
  const translatedWebTitle = websettings?.translated_web_title ? websettings?.translated_web_title : websettings?.web_title;

  return (
    websettings &&
    general_settings && (
      <footer className="secondary_bg_color text-white py-10 pb-0">
        <div className={`container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-[80px]`}>
          {/* eDemand Info */}
          <div>
            <CustomLink href="/" preserveLanguage={false}>
              <div className="w-16 md:w-[160px] h-auto">
                <CustomImageTag
                  src={websettings?.footer_logo}
                  alt="eDemand Logo"
                  className="w-full aspect-logo object-cover"
                />
              </div>
            </CustomLink>
            {translatedFooterDescription &&
              <p className="mt-4 text-base font-extralight">
                {translatedFooterDescription}
              </p>
            }
            <div className="flex flex-wrap items-center gap-4 mt-4">
              {/* <div className="grid grid-cols-4 gap-4 mt-4"> */}
              {websettings?.social_media.map((social, index) => (
                <Link
                  target="_blank"
                  key={index}
                  href={social?.url}
                  className="text-white rounded-full h-[30px] w-[30px] flex items-center justify-center bg-[#FFFFFF1F] hover:primary_bg_color transition-colors duration-300"
                >
                  <CustomImageTag
                    src={social.file}
                    alt="account"
                    className="aspect-square w-[30px]"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("quickLinks")}</h3>
            <ul className="space-y-2">
              <li className="text-base font-extralight">
                <CustomLink
                  href="/about-us"
                  preserveLanguage={false}
                  className="text-white hover:border-b border_color transition-all duration-100"
                >
                  {t("aboutUs")}
                </CustomLink>
              </li>
              <li className="text-base font-extralight">
                <CustomLink
                  href="/contact-us"
                  preserveLanguage={false}
                  className="text-white hover:border-b border_color transition-all duration-100"
                >
                  {t("contactUs")}
                </CustomLink>
              </li>
              <li className="text-base font-extralight">
                <CustomLink
                  href="/faqs"
                  preserveLanguage={false}
                  className="text-white hover:border-b border_color transition-all duration-100"
                >
                  {t("faqs")}
                </CustomLink>
              </li>
              <li className="text-base font-extralight">
                <CustomLink
                  href="/blogs"
                  preserveLanguage={false}
                  className="text-white hover:border-b border_color transition-all duration-100"
                >
                  {t("blogs")}
                </CustomLink>
              </li>
              <li className="text-base font-extralight">
                <CustomLink
                  href="/sitemap"
                  preserveLanguage={false}
                  className="text-white hover:border-b border_color transition-all duration-100"
                >
                  {t("sitemap") || "Sitemap"}
                </CustomLink>
              </li>
              <li className="text-base font-extralight">
                <CustomLink
                  href="/terms-and-conditions"
                  preserveLanguage={false}
                  className="text-white hover:border-b border_color transition-all duration-100"
                >
                  {t("termsAndcondition")}
                </CustomLink>
              </li>
              <li className="text-base font-extralight">
                <CustomLink
                  href="/privacy-policy"
                  preserveLanguage={false}
                  className="text-white hover:border-b border_color transition-all duration-100"
                >
                  {t("privacyPolicy")}
                </CustomLink>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          {general_settings?.support_email ||
            general_settings?.phone ||
            general_settings?.support_hours ||
            general_settings?.address ? (
            <div>
              <h3 className="font-semibold mb-4">{t("contactInfo")}</h3>
              <ul className="space-y-2 text-white">
                {general_settings?.support_email && (
                  <Link
                    href={`mailto:${general_settings?.support_email}`}
                    target="_blank"
                  >
                    <li className="flex items-center gap-2 mb-4">
                      <RiMailSendLine size={22} className="min-w-[10%]" />
                      <span className="w-full text-base font-extralight">
                        {general_settings?.support_email}
                      </span>
                    </li>
                  </Link>
                )}
                {general_settings?.phone && (
                  <Link
                    href={`tel:${general_settings?.phone}`}
                    target="_blank"
                  >
                    <li className="flex items-center gap-2 mb-4">
                      <PiPhoneCall size={22} className="min-w-[10%]" />
                      <span className="w-full text-base font-extralight">
                        {general_settings?.phone}
                      </span>
                    </li>
                  </Link>
                )}
                {general_settings?.support_hours && (
                  <li className="flex items-center gap-2 mb-4">
                    <LuClock size={22} className="min-w-[10%]" />
                    <span className="w-full text-base font-extralight">
                      {general_settings?.support_hours}
                    </span>
                  </li>
                )}
                {translatedAddress && (
                  <li className="flex items-center gap-2 mb-4">
                    <IoLocationOutline size={22} className="min-w-[10%]" />
                    <span className="w-full text-base font-extralight">
                      {translatedAddress}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          ) : null}

          {/* Download App */}
          {websettings?.app_section_status === "1" || websettings?.app_section_status === 1 ? (
            <div>
              <h3 className="font-semibold mb-4">
                {t("downloadCustomerApps")}
              </h3>
              <p className="text-base mb-4 font-extralight">
                {translatedWebTitle}
              </p>
              <div className="flex items-center justify-center flex-col lg:flex-row gap-4">
                <Link
                  href={websettings?.playstore_url}
                  target="_blank"
                  className="flex items-center justify-center gap-1 bg-[#FFFFFF3D] hover:bg-white transition-all ease-in-out duration-300 hover:primary_text_color text-white font-bold text-sm w-full rounded-md icon px-0 py-3"
                >
                  {playStore}
                  <span>{t("googlePlay")}</span>
                </Link>
                <Link
                  href={websettings?.applestore_url}
                  target="_blank"
                  className="flex items-center justify-center gap-1 bg-[#FFFFFF3D] hover:bg-white transition-all ease-in-out duration-300 hover:primary_text_color text-white font-bold text-sm w-full rounded-md icon px-0 py-3"
                >
                  {apple}
                  <span>{t("appStore")}</span>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
        {translatedCopyrightDetails &&
          <div className="border-t border-gray-700 py-6 text-center">
            <p className="font-extralight text-md">
              {translatedCopyrightDetails}
            </p>
          </div>
        }
      </footer>
    )
  );
};

export default Footer;
