import React from "react";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { useTranslation } from "../Layout/TranslationContext";

const OfferCard = ({
  offer,
  isApplicable,
  isApplied,
  handleApply,
  handleRemove,
}) => {

  const translatedOfferMessage = offer?.translated_message || offer?.message;

  const t = useTranslation();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GB"); // Format: DD/MM/YYYY
  };

  const offerDetails = [
    translatedOfferMessage && {
      text: translatedOfferMessage,
    },
    offer?.minimum_order_amount > 0 && {
      text: `${t("offerIsApplicableOnMinimumBookingValueOf")} $${offer.minimum_order_amount}`,
    },
    offer?.max_discount_amount > 0 && {
      text: `${t("maximumInstantDiscountOf")} $${offer.max_discount_amount}`,
    },
    offer?.start_date &&
      offer?.end_date && {
        text: `${t("offerValidFromTo")} ${formatDate(offer.start_date)} ${t("to")} ${formatDate(
          offer.end_date
        )}`,
      },
    offer?.no_of_repeat_usage > 1 && {
      text: `${t("offerValidMaxTimesDuringCampaignPeriod")} ${offer.no_of_repeat_usage} ${t("timesDuringCampaignPeriod")}`,
    },
    offer?.no_of_repeat_usage === 1 && {
      text: `${t("offerValidOncePerCustomerDuringCampaignPeriod")}`,
    },
  ].filter(Boolean); // Remove any undefined or false values


  return (
    <div
      className={`border rounded-lg p-4 w-full flex items-start gap-4 card_bg hover:border_color custom-shadow transition-all duration-150 ${
        isApplied ? "border_color" : ""
      }`}
    >
      {/* Left: Image */}
      <div className="relative aspect-square w-16 flex-shrink-0">
        <CustomImageTag
          src={offer.image}
          alt={offer?.promo_code}
          className="w-full h-full rounded-lg"
          imgClassName="rounded-lg"
        />
      </div>

      {/* Right: Content */}
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-2">
          {/* Title */}
          <h3 className="primary_color font-bold text-lg">
            {offer?.promo_code}
          </h3>

          {/* Apply or Applied Button */}
          {isApplicable && (
            <div className="transition-all duration-150">
              {!isApplied ? (
                <button
                  onClick={() => handleApply(offer)}
                  className="light_bg_color primary_text_color text-base font-normal px-4 py-1 rounded-md dark:bg-white"
                >
                  {t("apply")}
                </button>
              ) : (
                <button
                  onClick={handleRemove}
                  className="light_bg_color primary_text_color text-base font-normal px-4 py-1 rounded-md dark:bg-white"
                >
                  {t("remove")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="relative">
          <p className="description_color">{translatedOfferMessage}</p>
          <ul className="pl-5 text-sm mt-2 description_color">
            {offerDetails.map((detail, index) => (
              <li key={index}> - {detail.text}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OfferCard;
