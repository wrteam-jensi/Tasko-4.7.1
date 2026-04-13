"use client";
import { useEffect, useState } from "react";
import {
  changeOrderStatusApi,
  checkSlotsApi,
  getAvailableSlotApi,
} from "@/api/apiRoutes";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils"; // Assuming you have this utility function
import dayjs from "dayjs";
import { FaCheck, FaInfoCircle } from "react-icons/fa";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCartProvider,
  setDilveryDetails,
} from "@/redux/reducers/cartSlice";
import CustomTimePicker from "./CustomTimePicker";
import { useRouter } from "next/router";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { selectReorderMode } from "@/redux/reducers/reorderSlice";
import { Skeleton } from "@/components/ui/skeleton";
import { logClarityEvent } from "@/utils/clarityEvents";
import { BOOKING_EVENTS } from "@/constants/clarityEventNames";

const SelectDateAndTimeDrawer = ({
  dilveryDetails,
  providerId,
  open,
  onClose,
  isRechedule,
  orderID,
  customJobId,
  advance_booking_days
}) => {
  const t = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();

  // Get reorder state
  const isReorderMode = useSelector(selectReorderMode);
  const reorderState = useSelector((state) => state.reorder);

  // Use reorder data if in reorder mode, otherwise use cart data
  const currentCartProviderData = useSelector((state) =>
    isReorderMode ? reorderState?.provider : selectCartProvider(state)
  );

  const bookingDays = currentCartProviderData?.advance_booking_days || advance_booking_days;


  const [selectedDate, setSelectedDate] = useState(
    dilveryDetails?.dilveryDate
      ? dayjs(dilveryDetails?.dilveryDate) // Ensure it's a dayjs object
      : dayjs() // Default to today's date
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    dilveryDetails?.dilveryDate ? dilveryDetails?.dilveryTime : null
  );
  const [selectedTimeSlotMessage, setSelectedTimeSlotMessage] = useState(
    dilveryDetails?.dilveryTimeMessage || null
  );
  const [customTime, setCustomTime] = useState(null);
  const [isCustomTimeSelected, setIsCustomTimeSelected] = useState(false);
  const [timeSlots, setTimeSlotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  useEffect(() => {
    if (open) {
      logClarityEvent(BOOKING_EVENTS.TIMESLOT_PICKER_OPENED, {
        provider_id: providerId,
        custom_job_id: customJobId,
      });
    }
  }, [open, providerId, customJobId]);

  // Set the default selected date when the component mounts (optional)
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(dayjs()); // Set to today's date if not already set
    }
  }, []);

  const handleTimeSlotSelect = (timeSlot) => {

    setSelectedTimeSlot(timeSlot.time);
    setSelectedTimeSlotMessage(timeSlot.message || null);
    setIsCustomTimeSelected(false); // Mark as predefined slot selection
    logClarityEvent(BOOKING_EVENTS.TIMESLOT_SLOT_SELECTED, {
      provider_id: providerId,
      slot: timeSlot.time,
      has_message: Boolean(timeSlot.message),
    });
  };

  useEffect(() => {
    if (customTime && isCustomTimeSelected) {
      setSelectedTimeSlot(customTime);
      setSelectedTimeSlotMessage(null); // Clear message when custom time is used
    }
  }, [customTime, isCustomTimeSelected]);

  // Debug effect to log state changes
  useEffect(() => {
  }, [selectedTimeSlot, selectedTimeSlotMessage]);

  const fetchTimeSlots = async () => {
    const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");
    setIsLoading(true);
    try {
      const response = await getAvailableSlotApi({
        partner_id: providerId,
        selectedDate: formattedDate,
        custom_job_request_id: customJobId ? customJobId : "",
      });

      if (response?.error === false) {
        setTimeSlotes(response?.data?.all_slots);
      } else {
        // Handle error case
        setTimeSlotes([]);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setTimeSlotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate]);

  const handleClose = () => {
    onClose();
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setSelectedTimeSlotMessage(null);
    setCustomTime(null);
    setIsCustomTimeSelected(false);
  };

  const changeOrderStatus = async () => {
    try {
      const response = await changeOrderStatusApi({
        order_id: orderID,
        status: "rescheduled",
        date: dayjs(selectedDate).format("YYYY-MM-DD"),
        time: selectedTimeSlot,
      });
      if (response?.error === false) {
        toast.success(response?.message);
        logClarityEvent(BOOKING_EVENTS.BOOKING_RESCHEDULED, {
          order_id: orderID,
          date: dayjs(selectedDate).format("YYYY-MM-DD"),
          time: selectedTimeSlot,
        });
        onClose();
        router.push(`/booking/inv-${orderID}`);
      } else {
        toast.error(response?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSchedule = async () => {
    if (!selectedDate && !selectedTimeSlot) {
      toast.error(t("pleaseSelectDateAndTimeSlot"));
      logClarityEvent(BOOKING_EVENTS.TIMESLOT_VALIDATION_FAILED, {
        reason: "missing_date_and_time",
      });
    } else if (!selectedDate) {
      toast.error(t("pleaseSelectDate"));
      logClarityEvent(BOOKING_EVENTS.TIMESLOT_VALIDATION_FAILED, {
        reason: "missing_date",
      });
    } else if (!selectedTimeSlot) {
      toast.error(t("pleaseSelectTimeSlot"));
      logClarityEvent(BOOKING_EVENTS.TIMESLOT_VALIDATION_FAILED, {
        reason: "missing_time",
      });
    } else {
      try {
        const response = await checkSlotsApi({
          partner_id: providerId,
          date: dayjs(selectedDate).format("YYYY-MM-DD"),
          time: selectedTimeSlot,
          custom_job_request_id: customJobId ? customJobId : "",
          order_id: isReorderMode
            ? reorderState.orderId
            : orderID
              ? orderID
              : "",
          // is_reorder: isReorderMode ? 1 : "",
        });
        if (response?.error === false) {
          if (!isRechedule) {

            dispatch(
              setDilveryDetails({
                ...dilveryDetails, // Keep the existing delivery details
                dilveryDate: selectedDate,
                dilveryTime: selectedTimeSlot,
                dilveryTimeMessage: selectedTimeSlotMessage, // Store the message
              })
            );
            onClose(); // Close the drawer if both date and time are selected
          } else {
            changeOrderStatus();
          }
        } else {
          toast.error(response?.message);
        }
      } catch (error) {
        console.error("Error setting delivery details:", error);
      }
    }
  };

  // Create a TimeSlotSkeleton component
  const TimeSlotSkeleton = () => (
    <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 mb-2">
      {[...Array(18)].map((_, index) => (
        <Skeleton key={index} className="w-full h-12 rounded-lg" />
      ))}
    </div>
  );

  return (
    <Drawer open={open} onClose={handleClose} modal>
      <DrawerContent
        className={cn(
          "max-w-full md:max-w-[90%] lg:max-w-[85%] xl:max-w-7xl mx-auto rounded-tr-[18px] rounded-tl-[18px]",
          "overflow-y-auto",
          "transition-all duration-300",
          "after:!content-none"
        )}
      >
        <DrawerTitle className="hidden"></DrawerTitle>
        <div className="select_date flex flex-col lg:flex-row gap-6 py-4 px-4 md:p-6 lg:p-8">
          {/* Left side: Calendar */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{t("schedule")}</h2>
            <div className="schedule_cal w-full border rounded-xl md:rounded-2xl p-2 md:p-3">
              <Calendar
                mode="single"
                selected={selectedDate.toDate()} // Convert dayjs object to Date for the Calendar
                onSelect={(date) => setSelectedDate(dayjs(date))} // Use dayjs to set selectedDate
                showOutsideDays={true}
                disabled={{
                  before: new Date(), // Disable past dates
                  after: dayjs().add(bookingDays - 1, "day").toDate(), // Disable dates beyond booking days
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Right side: Time Slots */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
              {t("selectTimeSlot")}
            </h2>
            <div className="flex flex-col gap-4 md:gap-5 flex-grow">
              {isLoading ? (
                // Show skeleton while loading
                <>
                  <TimeSlotSkeleton />
                  <div className="p-2 md:p-3 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-12"></div>
                </>
              ) : timeSlots?.length > 0 ? (
                <>
                  <div className="time_slots grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 mb-2 max-h-[300px] md:max-h-[350px] overflow-y-auto pr-1">
                    {timeSlots?.map((timeSlot) => (
                      <button
                        key={timeSlot.time}
                        className={cn(
                          "px-3 py-2 md:px-4 md:py-3 flex flex-col gap-1 rounded-lg border card_bg",
                          selectedTimeSlot === timeSlot.time
                            ? "primary_text_color border_color selected_shadow"
                            : "description_color",
                          timeSlot.is_available === 0 &&
                          "opacity-50 cursor-not-allowed !background_color"
                        )}
                        onClick={() => {

                          if (timeSlot.is_available === 1) {
                            handleTimeSlotSelect(timeSlot);
                          }
                        }}
                        disabled={timeSlot.is_available === 0}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm md:text-base font-normal">
                            {dayjs(
                              new Date(`1970-01-01T${timeSlot.time}`)
                            ).format("h:mm A")}
                          </span>
                          {selectedTimeSlot === timeSlot.time && (
                            <span className="primary_text_color">
                              <FaCheck size={14} />
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Display selected time slot message if available */}
                  {selectedTimeSlotMessage && (
                    <span className="w-full text-center text-sm bg-[#FFEEC5] p-2 rounded-md text-[#B39651] dark:bg-[#FFDA7F] mt-1 flex items-center justify-center gap-1">
                      <FaInfoCircle size={16} />
                      {selectedTimeSlotMessage}
                    </span>
                  )}

                  <div className="p-2 md:p-3 flex items-center justify-between w-full light_bg_color border_color primary_text_color rounded-lg">
                    <CustomTimePicker
                      value={customTime}
                      setSelectedTimeSlot={(time) => {
                        setSelectedTimeSlot(dayjs(time).format("HH:mm:00"));
                        setSelectedTimeSlotMessage(null); // Clear message when custom time is selected
                        setIsCustomTimeSelected(true); // Mark as custom time selection
                        logClarityEvent(BOOKING_EVENTS.TIMESLOT_CUSTOM_TIME_ENTERED, {
                          provider_id: providerId,
                          custom_time: dayjs(time).format("HH:mm:00"),
                        });
                      }}
                      onChange={(time) => {
                        const formattedTime = dayjs(time).format("HH:mm:00");
                        setCustomTime(time);
                        setIsCustomTimeSelected(true); // Mark as custom time selection
                      }}
                    />
                  </div>
                  <div className="continue flex items-center mt-auto">
                    <button
                      className={cn(
                        "rounded-lg p-3 w-full",
                        !selectedTimeSlot
                          ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                          : "primary_bg_color text-white"
                      )}
                      onClick={handleSchedule}
                      disabled={!selectedTimeSlot}
                    >
                      {t("continue")}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center min-h-[400px] md:min-h-[450px]">

                  <p className="text-center text-lg font-medium description_color mb-2">
                    {t("providerIsClosed")}
                  </p>

                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SelectDateAndTimeDrawer;
