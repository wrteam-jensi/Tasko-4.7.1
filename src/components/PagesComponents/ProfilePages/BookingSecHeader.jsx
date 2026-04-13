"use client"
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/router";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { useDispatch, useSelector } from "react-redux";
import { selectBookingStatus, setBookingStatus } from "@/redux/reducers/helperSlice";
import { IoFilterOutline } from "react-icons/io5";
import CustomLink from "@/components/ReUseableComponents/CustomLink";

const BookingSecHeader = () => {
  const router = useRouter();
  const t = useTranslation();
  const bookingStatus = useSelector(selectBookingStatus);
  const [status, setStatus] = useState(bookingStatus);

  const dispatch = useDispatch();
  const handleStatusChange = (value) => {
    setStatus(value);
    dispatch(setBookingStatus(value));
  };

  const [filter, setFilter] = useState(false)

  return (
    <div className={`filter flex flex-wrap items-center justify-between gap-4  md:p-4 md:light_bg_color rounded-xl ${filter ? 'h-32' : 'max-[430px]:h-16 h-14'} md:h-full transition-all duration-300 overflow-hidden`}>
      <div className="flex gap-3 max-[330px]:w-[78%] w-[80%] md:w-max">
        <CustomLink
          href="/general-bookings"
          title={t("generalBookings")}
          className={`card_bg p-2 md:p-3 text-sm border md:border-none w-full md:w-max text-center rounded-lg transition-all duration-300 ${router.pathname === "/general-bookings"
              ? "primary_bg_color text-white"
              : ""
            }`}
        >
          {t("generalBookings")}
        </CustomLink>
        <CustomLink
          href="/requested-bookings"
          title={t("requestedBookings")}
          className={`card_bg p-2 md:p-3 text-sm border md:border-none w-full md:w-max text-center rounded-lg transition-all duration-300 ${router.pathname === "/requested-bookings"
              ? "primary_bg_color text-white"
              : ""
            }`}
        >
          {t("requestedBookings")}
        </CustomLink>
      </div>
      <div className="hidden filter_dropdown md:flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <span className="description_color text-sm sm:text-base">
          {t("status")}
        </span>
        <Select onValueChange={handleStatusChange} value={status}>
          <SelectTrigger className="w-full sm:w-[180px] px-4 py-2 rounded-md border-none focus:outline-none focus:ring-0 focus:ring-transparent">
            <SelectValue placeholder={t("selectStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="awaiting">{t("awaiting")}</SelectItem>
            <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
            <SelectItem value="started">{t("started")}</SelectItem>
            <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
            <SelectItem value="rescheduled">{t("rescheduled")}</SelectItem>
            <SelectItem value="booking_ended">{t("booking_ended")}</SelectItem>
            <SelectItem value="completed">{t("completed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>


      <div className="light_bg_color primary_text_color p-2 rounded-lg cursor-pointer md:hidden" 
      onClick={() => setFilter(!filter)}
      >
        <IoFilterOutline size={26} />
      </div>

      <div className="filter_dropdown flex flex-row items-center gap-2 p-2 rounded-2xl md:hidden light_bg_color sm:gap-3 w-full sm:w-auto">
        <span className="description_color text-sm sm:text-base">
          {t("status")}
        </span>
        <Select onValueChange={handleStatusChange} value={status}>
          <SelectTrigger className="w-full sm:w-[180px] px-4 py-2 rounded-md border-none focus:outline-none focus:ring-0 focus:ring-transparent">
            <SelectValue placeholder={t("selectStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="awaiting">{t("awaiting")}</SelectItem>
            <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
            <SelectItem value="started">{t("started")}</SelectItem>
            <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
            <SelectItem value="rescheduled">{t("rescheduled")}</SelectItem>
            <SelectItem value="booking_ended">{t("booking_ended")}</SelectItem>
            <SelectItem value="completed">{t("completed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BookingSecHeader;
