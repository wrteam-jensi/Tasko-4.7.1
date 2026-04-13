"use client";
import React from "react";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { IoMdNotifications } from "react-icons/io";
import { useTranslation } from "../Layout/TranslationContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getNotificationRedirectUrl, isNotificationRedirectable } from "@/utils/notificationRedirect";

const NotificationCard = ({ data }) => {
  const t = useTranslation();
  const router = useRouter();

  // Use the centralized notification redirect utility
  // This handles all notification types including booking, job, blog, etc.
  const getRedirectUrl = (data) => {
    const redirectUrl = getNotificationRedirectUrl(data);

    // Show error messages for specific cases that need additional data
    if (!redirectUrl && data?.type === "provider" && !data?.provider_slug) {
      toast.error(t("providerNotAvailable"));
      return "";
    }

    if (!redirectUrl && data?.type === "category" && !data?.category_slug) {
      toast.error(t("categoryNotAvailable"));
      return "";
    }

    return redirectUrl || "";
  };

  // Check if notification is redirectable using the utility function
  const isRedirectable = isNotificationRedirectable(data);

  // Handle redirect when card is clicked
  const handleRedirect = (data) => {

    const url = getRedirectUrl(data);

    if (!url) {
      return;
    }

    // For external URLs, open in a new tab
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      // For internal navigation, use router
      router.push(url);
    }
  };

  // Function to format the date display
  const formatTimeDisplay = (dateString) => {
    if (!dateString) return '';

    // Parse the server time (assuming it's in UTC)
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Create Date objects for both times in UTC
    const sentDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    const now = new Date();

    // Calculate time difference in milliseconds
    const diffInMs = now.getTime() - sentDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // If less than 1 minute, show "Just now"
    if (diffInMinutes < 1) {
      return t("just_now");
    }
    // If less than 60 minutes, show minutes ago
    else if (diffInMinutes < 60) {
      const minutes = Math.floor(diffInMinutes);
      return `${minutes} ${minutes === 1 ? t("minute_ago") : t("minutes_ago")}`;
    }
    // If less than 24 hours, show hours ago
    else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} ${hours === 1 ? t("hour_ago") : t("hours_ago")}`;
    }
    // If less than 7 days, show days ago
    else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days} ${days === 1 ? t("day_ago") : t("days_ago")}`;
    }
    // Otherwise show the date in full format
    else {
      // Format date with translated month names
      const months = [
        t("january"), t("february"), t("march"), t("april"),
        t("may"), t("june"), t("july"), t("august"),
        t("september"), t("october"), t("november"), t("december")
      ];

      return `${sentDate.getDate()} ${months[sentDate.getMonth()]} ${sentDate.getFullYear()}`;
    }
  };

  return (
    <div
      className={`flex items-start justify-between border-b last:border-b-0 p-4 gap-4 first:rounded-t-xl last:rounded-b-xl
      ${isRedirectable ? "hover:light_bg_color transition-all duration-300 cursor-pointer" : ""}`}
      onClick={() => isRedirectable && handleRedirect(data)}
      role={isRedirectable ? "button" : "none"}
      tabIndex={isRedirectable ? 0 : -1}
      onKeyDown={(e) => {
        if (isRedirectable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleRedirect(data);
        }
      }}
    >
      {/* Image */}
      {data?.image ? (
        <div className="w-16 aspect-square rounded overflow-hidden">
          <CustomImageTag
            src={data?.image}
            alt={data?.title}
            className="w-full h-full object-cover"
            imgClassName="object-cover"
            width={0}
            height={0}
            loading="lazy"
          />
        </div>
      ) :
        <div className="w-16 h-16 rounded overflow-hidden light_bg_color primary_text_color flex items-center justify-center">
          <IoMdNotifications size={40} />
        </div>}
      {/* Notification Content */}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{data?.title}</h3>
          <div className="description_color text-sm whitespace-nowrap">
            {formatTimeDisplay(data?.date_sent)}
          </div>
        </div>
        <p className="text-sm description_color mb-2 text-wrap max-w-[80%]">{data?.message}</p>

      </div>
    </div>
  );
};

export default NotificationCard;
