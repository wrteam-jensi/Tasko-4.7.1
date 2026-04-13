import React, { useState, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useTranslation } from "@/components/Layout/TranslationContext";

const CustomDateTimePicker = ({ value, onChange, onClose, minDateTime = null, type = 'start' }) => {
  const t = useTranslation();
  // Initialize with value if provided, otherwise null
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [selectedHour, setSelectedHour] = useState(
    value ? dayjs(value).format("hh") : "12"
  );
  const [selectedMinute, setSelectedMinute] = useState(
    value ? dayjs(value).format("mm") : "00"
  );
  const [selectedPeriod, setSelectedPeriod] = useState(
    value ? dayjs(value).format("A") : "PM"
  );

  const timePickerRef = useRef(null);

  // Generate hours (1-12)
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  // Generate minutes (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  // Function to check if a date should be disabled
  const isDateDisabled = (date) => {
    const today = dayjs().startOf('day');
    const dateToCheck = dayjs(date);
    // Always disable past dates
    if (dateToCheck.isBefore(today)) {
      return true;
    }

    // For end date selection, disable dates before minDateTime\
    if (type === 'endDateTime' && minDateTime) {
      const minDate = dayjs(minDateTime);
      // Disable all dates before minDateTime
      return dateToCheck.isBefore(minDate, 'day');
    }

    return false;
  };

  // Function to check if a time is disabled
  const isTimeDisabled = (hour, minute, period) => {
    if (!selectedDate || !minDateTime || type !== 'endDateTime') return false;

    // Convert selected time to 24-hour format
    let hour24 = parseInt(hour);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    // Create datetime objects for comparison
    const selectedDateTime = dayjs(selectedDate)
      .hour(hour24)
      .minute(parseInt(minute))
      .second(0);

    const minTime = dayjs(minDateTime);

    // If dates are different, no need to check time
    if (!selectedDateTime.isSame(minTime, 'day')) {
      return selectedDateTime.isBefore(minTime);
    }

    // If same day, compare the full datetime
    return selectedDateTime.isBefore(minTime) || selectedDateTime.isSame(minTime);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleTimeSelection = (type, value) => {
    let isDisabled = false;

    switch (type) {
      case "hour":
        isDisabled = isTimeDisabled(value, selectedMinute, selectedPeriod);
        if (!isDisabled) setSelectedHour(value);
        break;
      case "minute":
        isDisabled = isTimeDisabled(selectedHour, value, selectedPeriod);
        if (!isDisabled) setSelectedMinute(value);
        break;
      case "period":
        isDisabled = isTimeDisabled(selectedHour, selectedMinute, value);
        if (!isDisabled) setSelectedPeriod(value);
        break;
    }
  };

  const handleOkClick = () => {
    if (!selectedDate) {
      toast.error(t("pleaseSelectDate"));
      return;
    }

    // Create the final datetime
    let hour = parseInt(selectedHour);
    if (selectedPeriod === 'PM' && hour !== 12) hour += 12;
    if (selectedPeriod === 'AM' && hour === 12) hour = 0;

    const newDate = dayjs(selectedDate)
      .hour(hour)
      .minute(parseInt(selectedMinute))
      .second(0)
      .toDate();

    // Strict validation against minDateTime
    if (type === 'endDateTime' && minDateTime && dayjs(newDate).isBefore(dayjs(minDateTime))) {
      toast.error(t("pleaseSelectTimeAfterStartTime"));
      return;
    }

    onChange?.(newDate);
    onClose?.();
  };

  const handleNowClick = () => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedHour(dayjs(now).format("hh"));
    setSelectedMinute(dayjs(now).format("mm"));
    setSelectedPeriod(dayjs(now).format("A"));
  };

  return (
    <div className="flex flex-col space-y-4 max-w-full">
      <div className="flex flex-col sm:flex-row items-start gap-3">
        {/* Calendar */}
        <div className="flex-1 border rounded-lg p-2 h-full max-w-[350px] w-full">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            disabled={isDateDisabled}
            className="w-full custom-calendar"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-2",
              caption: "flex justify-center pt-1 relative items-center text-sm",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex justify-between",
              head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
              row: "flex w-full mt-1",
              cell: "text-center text-sm relative p-0",
              day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100",
              day_selected: "primary_bg_color text-primary-foreground hover:primary_bg_color hover:text-primary-foreground rounded-full",
              day_today: "bg-accent text-accent-foreground rounded-full",
              day_outside: "opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
          />
        </div>

        {/* Time Picker */}
        <div className="w-full border rounded-lg p-2" ref={timePickerRef}>
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">{t("selectTime")}</h3>
          </div>
          <div className="flex gap-2 h-[300px] w-full">
            {/* Hours */}
            <div className="flex-1 overflow-y-auto scrollbar-thin border rounded-lg">
              {hours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => handleTimeSelection("hour", hour)}
                  disabled={isTimeDisabled(hour, selectedMinute, selectedPeriod)}
                  className={cn(
                    "w-full py-2 text-sm hover:bg-gray-100 rounded",
                    selectedHour === hour && "primary_bg_color text-white",
                    isTimeDisabled(hour, selectedMinute, selectedPeriod) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {hour}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <div className="flex-1 overflow-y-auto scrollbar-thin border rounded-lg">
              {minutes.map((minute) => (
                <button
                  key={minute}
                  onClick={() => handleTimeSelection("minute", minute)}
                  disabled={isTimeDisabled(selectedHour, minute, selectedPeriod)}
                  className={cn(
                    "w-full py-2 text-sm hover:bg-gray-100 rounded",
                    selectedMinute === minute && "primary_bg_color text-white",
                    isTimeDisabled(selectedHour, minute, selectedPeriod) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {minute}
                </button>
              ))}
            </div>

            {/* AM/PM */}
            <div className="w-14 h-fit border rounded-lg">
              {["AM", "PM"].map((period) => (
                <button
                  key={period}
                  onClick={() => handleTimeSelection("period", period)}
                  disabled={isTimeDisabled(selectedHour, selectedMinute, period)}
                  className={cn(
                    "w-full py-2 text-sm hover:bg-gray-100 rounded",
                    selectedPeriod === period && "primary_bg_color text-white",
                    isTimeDisabled(selectedHour, selectedMinute, period) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button
          variant="outline"
          onClick={handleNowClick}
          className="hover:bg-gray-50 text-sm h-8 hover:text-black"
        >
          {t("now")}
        </Button>
        <Button
          onClick={handleOkClick}
          className="primary_bg_color hover:opacity-90 text-white dark:text-black text-sm h-8"
        >
          {t("ok")}
        </Button>
      </div>
    </div>
  );
};

export default CustomDateTimePicker;
