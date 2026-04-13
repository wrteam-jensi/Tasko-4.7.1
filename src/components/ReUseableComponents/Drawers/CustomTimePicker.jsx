import { miniDevider } from "@/utils/Helper";
import React, { useState } from "react";
import { IoTimeOutline } from "react-icons/io5";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useTranslation } from "@/components/Layout/TranslationContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Extend dayjs to use custom parsing
dayjs.extend(customParseFormat);

// Custom CSS for scrollbar
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const CustomTimePicker = ({ value, onChange, setSelectedTimeSlot }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState("00");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("PM");
  const [tempSelection, setTempSelection] = useState({ hour: "00", minute: "00", period: "PM" });
  const t = useTranslation();

  // Generate hours (1-12)
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  // Generate minutes (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  const handleTimeSelection = (type, value) => {
    if (type === "hour") setTempSelection(prev => ({ ...prev, hour: value }));
    if (type === "minute") setTempSelection(prev => ({ ...prev, minute: value }));
    if (type === "period") setTempSelection(prev => ({ ...prev, period: value }));
  };

  const handleOk = () => {
    setSelectedHour(tempSelection.hour);
    setSelectedMinute(tempSelection.minute);
    setSelectedPeriod(tempSelection.period);

    // Convert 12-hour format to 24-hour format
    let hour24 = parseInt(tempSelection.hour);
    if (tempSelection.period === "PM" && hour24 !== 12) hour24 += 12;
    if (tempSelection.period === "AM" && hour24 === 12) hour24 = 0;

    // Format the time string in 24-hour format
    const formattedTime = `${String(hour24).padStart(2, "0")}:${tempSelection.minute}-00`;

    onChange?.(formattedTime);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelection({ hour: selectedHour, minute: selectedMinute, period: selectedPeriod });
    setIsOpen(false);
  };

  // Format the display value
  const displayValue = value ? dayjs(value, "HH:mm-00").format("hh:mm A") : t("addTime");

  return (
    <>
      <style>{scrollbarStyles}</style>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={() => {
              setSelectedTimeSlot(null);
              setTempSelection({ hour: selectedHour, minute: selectedMinute, period: selectedPeriod });
            }}
            className="w-full flex items-center gap-2 p-2 rounded-md"
          >
            <IoTimeOutline size={24} />
            <span>{miniDevider}</span>
            <span>{displayValue}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-4" align="start">
          <div className="space-y-4">
            <div className="font-medium">{t("selectTime")}</div>
            <div className="flex rounded-lg border shadow-sm">
              {/* Hours */}
              <div
                className="w-20 h-48 overflow-y-auto border-r custom-scrollbar"
                style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {hours.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => handleTimeSelection("hour", hour)}
                    className={`w-full p-2 text-center hover:bg-blue-100 ${tempSelection.hour === hour ? "primary_bg_color text-white" : ""
                      }`}
                  >
                    {hour}
                  </button>
                ))}
              </div>

              {/* Minutes */}
              <div
                className="w-20 h-48 overflow-y-auto border-r custom-scrollbar"
                style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    onClick={() => handleTimeSelection("minute", minute)}
                    className={`w-full p-2 text-center hover:bg-blue-100 ${tempSelection.minute === minute ? "primary_bg_color text-white" : ""
                      }`}
                  >
                    {minute}
                  </button>
                ))}
              </div>

              {/* AM/PM */}
              <div className="w-20">
                <button
                  onClick={() => handleTimeSelection("period", "AM")}
                  className={`w-full p-2 text-center hover:bg-blue-100 ${tempSelection.period === "AM" ? "primary_bg_color text-white" : ""
                    }`}
                >
                  {t("am")}
                </button>
                <button
                  onClick={() => handleTimeSelection("period", "PM")}
                  className={`w-full p-2 text-center hover:bg-blue-100 ${tempSelection.period === "PM" ? "primary_bg_color text-white" : ""
                    }`}
                >
                  {t("pm")}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleOk}
                className="px-4 py-2 text-sm text-white primary_bg_color rounded-md hover:opacity-90 transition-colors"
              >
                {t("ok")}
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default CustomTimePicker;
