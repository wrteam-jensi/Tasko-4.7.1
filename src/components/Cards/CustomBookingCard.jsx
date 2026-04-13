import { showPrice, statusColors, statusNames } from "@/utils/Helper";
import dayjs from "dayjs";
import { FaRegCalendarCheck, FaRegClock } from "react-icons/fa";
import { useTranslation } from "../Layout/TranslationContext";

const CustomBookingCard = ({ data }) => {
  const t = useTranslation();

  const service = data?.services[0];
  const statusName = statusNames[data?.status];
  const statusColor = statusColors[data?.status?.toLowerCase()] || "#6b7280";

  const translatedCategoryName = service?.translated_category_name ? service?.translated_category_name : service?.category_name;


  return (
    <div className="border rounded-lg p-4 flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="background_color text-sm font-normal px-2 py-1 rounded-md flex items-center">
            {translatedCategoryName}
          </span>
          <span
            className="ml-auto text-sm font-normal capitalize"
            style={{ color: statusColor }}
          >
             {t(statusName)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium">{service?.service_title}</h3>

        {/* Price */}
        <span className="primary_text_color font-normal">
          {showPrice(data?.final_total)}
        </span>

        {/* Schedule */}
      </div>
      <div className="flex flex-col flex-wrap sm:flex-nowrap items-start justify-between gap-4">
        <div>
          <span>
            {t("scheduleAt")}{" "}
            <span className="primary_text_color">
              {data?.address_id === "0" ? t("store") : t("doorstep")}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between w-full gap-4">
          <div className="flex items-center text-sm gap-4 w-full">
            {data?.date_of_service && (
              <div className="flex items-center gap-1">
                <FaRegCalendarCheck size={18} className="primary_text_color" />{" "}
                {dayjs(data?.date_of_service).format('MM/DD/YYYY')}
              </div>
            )}
            {data?.starting_time && (
              <div className="flex items-center gap-1">
                <FaRegClock size={18} className="primary_text_color" />{" "}
                {dayjs(`1970-01-01T${data?.starting_time}`).format(
                  "hh:mm A"
                )}
              </div>
            )}
          </div>
          {/* OTP Section */}
          {data?.is_otp_enalble === "1" &&
          <div className="flex items-center justify-between w-full sm:justify-end gap-1">
            <span className="description_color text-sm">{t("otp")}</span>
            <div className="px-4 py-2 rounded-md text-sm font-normal background_color">
              {data?.otp}
            </div>
          </div>
          }
        </div>
      </div>
    </div>
  );
};

export default CustomBookingCard;
