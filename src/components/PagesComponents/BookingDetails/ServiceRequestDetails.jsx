"use client";
import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/ReUseableComponents/BreadCrumb";
import SideNavigation from "../ProfilePages/SideNavigation";
import { MdArrowBackIosNew } from "react-icons/md";
import {
  customJobStatusColors,
  customJobStatusNames,
  isMobile,
  miniDevider,
  showPrice
} from "@/utils/Helper";
import { FaClock } from "react-icons/fa";
import { useRouter } from "next/router";
import {
  cancelCustomJobReqApi,
  fetchMyCustomJobBiddersApi,
} from "@/api/apiRoutes";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";
import dayjs from "dayjs";
import NoDataFound from "@/components/ReUseableComponents/Error/NoDataFound";
import { toast } from "sonner";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { setCustomJobData, setTaxValue } from "@/redux/reducers/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import CustomImageTag from "@/components/ReUseableComponents/CustomImageTag";
import ConfirmDialog from "@/components/ReUseableComponents/Dialogs/ConfirmDialog";

const ServiceRequestDetails = () => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const desRef = useRef(null);
  const biddersDesRef = useRef(null);
  const slug = router?.query?.slug;
  const taxConfig = useSelector((state) => state?.settingsData?.settings?.system_tax_settings);
  const showTax = taxConfig?.show_on_checkout === 1 || taxConfig?.show_on_checkout === "1";

  const [serviceData, setServiceData] = useState();
  const [biddersData, setBiddersData] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0); // Offset for pagination
  const limit = 4; // Number of providers per fetch
  const [loading, setLoading] = useState(false); // To manage button loading state
  const [isloadMore, setIsloadMore] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [expandedBidderIds, setExpandedBidderIds] = useState([]); // Track expanded state for each bidder
  const [isServiceDescExpanded, setIsServiceDescExpanded] = useState(false);
  const [isServiceDescOverflowing, setIsServiceDescOverflowing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false); // State for cancel confirmation dialog

  // Add ref for bidder notes
  const bidderRefs = useRef({});

  const fetchDetails = async (append = false, customOffset = offset) => {
    if (append) {
      setIsloadMore(true); // Set Load More button state to loading
    } else {
      setLoading(true); // Set initial fetch to loading
    }
    try {
      const response = await fetchMyCustomJobBiddersApi({
        custom_job_request_id: slug,
        limit: limit,
        offset: customOffset,
      });
      if (response?.error === false) {
        setServiceData(response?.data?.custom_job);
        setBiddersData((prevBookings) =>
          append
            ? [...prevBookings, ...response?.data?.bidders]
            : response?.data?.bidders
        );
        setTotal(response?.total);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false); // Stop initial loading state
      setIsloadMore(false); // Stop Load More button loading stat
    }
  };

  useEffect(() => {
    if (slug && router.isReady) {
      fetchDetails(false, 0);
    }
  }, [slug, router.isReady]);

  // Check if desc section is overflowing
  useEffect(() => {
    if (desRef.current) {
      const element = desRef.current;
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const maxLinesHeight = lineHeight * 2; // Height for 4 lines
      setIsOverflowing(element.scrollHeight > maxLinesHeight);
    }
  }, [desRef, serviceData]);

  // Update the service description overflow check
  useEffect(() => {
    if (desRef.current) {
      const element = desRef.current;
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const maxLinesHeight = lineHeight * 2; // Height for 2 lines
      setIsServiceDescOverflowing(element.scrollHeight > maxLinesHeight);
    }
  }, [serviceData]);

  const statusName = customJobStatusNames[serviceData?.status];
  const statusColor =
    customJobStatusColors[serviceData?.status?.toLowerCase()] || "#6b7280";

  const handleGoback = () => {
    if (window) {
      window?.history?.back();
    }
  };

  useEffect(() => {
    if (biddersDesRef.current) {
      const element = biddersDesRef.current;
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const maxLinesHeight = lineHeight * 2; // Height for 4 lines
      setIsOverflowing(element.scrollHeight > maxLinesHeight);
    }
  }, [biddersDesRef, biddersData]);

  // Show confirmation dialog when cancel button is clicked
  const handleCanceleBooking = (e) => {
    e.preventDefault();
    setShowCancelDialog(true);
  };

  // Actually cancel the booking after user confirms
  const confirmCancelBooking = async () => {
    try {
      const response = await cancelCustomJobReqApi({
        custom_job_request_id: slug,
      });
      if (response?.error === false) {
        toast.success(response?.message);
        setShowCancelDialog(false); // Close dialog
        router.push("/my-services-requests");
      } else {
        toast.error(response?.message);
        setShowCancelDialog(false); // Close dialog on error
      }
    } catch (error) {
      console.log(error);
      setShowCancelDialog(false); // Close dialog on error
    }
  };

  const handleBookNow = (bid) => {

    // If tax is displayed separately on checkout, use counter_price (base price without tax)
    // If tax is not displayed, use final_total (tax already included in price)
    const checkoutPrice = showTax
      ? Number(bid?.counter_price)
      : Number(bid?.final_total);

    // Set custom job data in cart with all necessary provider details
    dispatch(
      setCustomJobData({
        bidId: bid?.id,
        providerId: bid?.partner_id,
        counterPrice: checkoutPrice,
        custom_job_request_id: bid?.custom_job_request_id,
        at_doorstep: bid?.at_doorstep,
        at_store: bid?.at_store,
        is_pay_later_allowed: bid?.is_pay_later_allowed,
        is_online_payment_allowed: bid?.is_online_payment_allowed,
        advance_booking_days: bid?.advance_booking_days,
        providerDetails: {
          name: bid?.provider_name,
          image: bid?.provider_image,
          visiting_charges: Number(bid?.visiting_charges || 0),
          duration: bid?.duration,
        },
      })
    );

    // Set or clear tax value based on tax display setting
    // When showTax is ON: set bid's tax_amount so checkout shows it separately
    // When showTax is OFF: clear any stale tax value since tax is already in final_total
    dispatch(setTaxValue(showTax ? bid?.tax_amount || 0 : 0));

    // Navigate to checkout
    router.push("/checkout");
  };

  // Check if bidder description is overflowing
  const checkBidderDescOverflow = (element) => {
    if (element) {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const maxLinesHeight = lineHeight * 2; // Height for 2 lines
      return element.scrollHeight > maxLinesHeight;
    }
    return false;
  };

  // Toggle bidder description expansion
  const toggleBidderDescription = (bidderId) => {
    setExpandedBidderIds((prev) =>
      prev.includes(bidderId)
        ? prev.filter((id) => id !== bidderId)
        : [...prev, bidderId]
    );
  };

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchDetails(true, newOffset);
  };

  return (
    <Layout>
      <BreadCrumb firstEle={t("bookingDetails")} isMobile={isMobile} />

      <section className="profile_sec md:my-12">
        <div className="container mx-auto">
          {/* Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar */}
            <div className="col-span-1 lg:col-span-3 hidden md:block">
              <SideNavigation />
            </div>

            {/* Main Content */}
            <div className="col-span-1 lg:col-span-9">
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between w-full flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleGoback}
                      className={`background_color p-3 rounded-lg `}
                      title={t("back")}
                    >
                      <MdArrowBackIosNew size={18} />
                    </button>

                    <h1 className="text-lg font-semibold sm:text-2xl lg:text-3xl">
                      {t("myServiceReqDetails")}
                    </h1>
                  </div>
                  {serviceData?.status === "pending" && (
                    <button
                      className="p-1 sm:p-3 border rounded-lg description_color"
                      onClick={(e) => handleCanceleBooking(e)}
                    >
                      {t("cancelBooking")}
                    </button>
                  )}

                </div>
                <Separator />

                {/* Service Details */}
                <div className="relative">
                  <h2 className="text-xl md:text-2xl font-bold sm:text-3xl lg:text-4xl">
                    {serviceData?.service_title}
                  </h2>
                </div>
                <div className="">
                  <h3 className="md:text-lg font-semibold mb-2 capitalize">
                    {t("description")}
                  </h3>
                  <div className="relative">
                    <p
                      ref={desRef}
                      className={`text-sm description_color ${isServiceDescExpanded ? "" : "line-clamp-2"
                        }`}
                    >
                      {serviceData?.service_short_description}
                    </p>
                    {isServiceDescOverflowing && (
                      <button
                        onClick={() =>
                          setIsServiceDescExpanded(!isServiceDescExpanded)
                        }
                        className="primary_text_color text-sm mt-1"
                      >
                        {isServiceDescExpanded ? t("viewLess") : t("viewMore")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Category and OTP */}
                <div className="flex flex-wrap sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex  gap-2 flex-col md:flex-row items-start md:items-center">
                    <span>{t("service")}</span>
                    <span className="light_bg_color primary_text_color px-3 py-1 rounded-md text-sm flex items-center justify-center gap-2">
                      <CustomImageTag src={serviceData?.category_image} alt={serviceData?.category_name}
                        className="w-6 aspect-square rounded-lg"
                        imgClassName="rounded-lg"
                      />
                      <span>
                        {serviceData?.translated_category_name ? serviceData?.translated_category_name : serviceData?.category_name}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{t("status")}</span>
                    <span
                      className="px-3 py-1 rounded-md text-sm capitalize"
                      style={{
                        color: statusColor,
                        backgroundColor: `${statusColor}29`,
                      }}
                    >
                      {t(statusName)}
                    </span>
                  </div>
                </div>

                {/* Budget & Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 light_bg_color p-4 rounded-lg">
                  <div>
                    <p className="description_color text-sm">{t("budget")}</p>
                    <p className="font-medium">
                      {showPrice(serviceData?.min_price)} {t("to")}{" "}
                      {showPrice(serviceData?.max_price)}
                    </p>
                  </div>
                  <div>
                    <p className="description_color text-sm">{t("postedAt")}</p>
                    <p className="font-medium">
                      {dayjs(
                        serviceData?.requested_start_date +
                        " " +
                        serviceData?.requested_start_time
                      ).format("DD-MM-YYYY - hh:mm A")}
                    </p>
                  </div>
                  <div>
                    <p className="description_color text-sm">{t("expireOn")}</p>
                    <p className="font-medium">
                      {dayjs(
                        serviceData?.requested_end_date +
                        " " +
                        serviceData?.requested_end_time
                      ).format("DD-MM-YYYY - hh:mm A")}
                    </p>
                  </div>
                </div>

                {/* Bids Section */}
                <div>
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-lg font-semibold mb-4">
                      {t("providerBids")}
                    </h3>
                    {total > 0 && (
                      <span>
                        {t("bids")}{" "}
                        <span className="primary_text_color">
                          {String(total).padStart(2, "0")}{" "}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {biddersData?.map((bid, index) => (
                      <div
                        className="p-4 card_bg rounded-xl border shadow-sm"
                        key={index}
                      >
                        <div className="flex flex-col gap-3">
                          {/* Company Logo */}
                          <div className="flex items-start gap-3">
                            <Avatar className="h-16 w-16 rounded-[4px]">
                              <AvatarImage
                                src={bid?.provider_image}
                                alt={bid?.provider_name}
                                width={0}
                                height={0}
                              />
                            </Avatar>

                            <div className="flex-1">
                              {/* Company Details */}
                              <h3 className="font-medium">
                                {bid?.provider_name}
                              </h3>
                              <div className="relative">
                                <p
                                  ref={(el) =>
                                    (bidderRefs.current[bid.id] = el)
                                  }
                                  className={`text-sm description_color break-words whitespace-pre-wrap ${expandedBidderIds.includes(bid.id)
                                    ? ""
                                    : "line-clamp-2"
                                    }`}
                                  style={{
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                  }}
                                >
                                  {bid?.note}
                                </p>
                                {bid?.note && bid.note.length > 100 && (
                                  <button
                                    onClick={() =>
                                      toggleBidderDescription(bid.id)
                                    }
                                    className="primary_text_color text-sm mt-1"
                                  >
                                    {expandedBidderIds.includes(bid.id)
                                      ? t("viewLess")
                                      : t("viewMore")}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <hr className="description_color" />
                          {/* Price and Duration */}
                          <div className="flex  justify-between mt-3 flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center">
                            <div className="flex items-center gap-4 lg:max-w-[80%] flex-wrap">
                              <span className="text-lg font-semibold break-all">
                                {showPrice(bid?.final_total)}
                              </span>
                              {miniDevider}
                              <div className="flex items-center">
                                <FaClock
                                  size={18}
                                  className="primary_text_color rtl:ml-1 mr-1"
                                />
                                <span className="text-sm">
                                  {bid?.duration} {t("mins")}
                                </span>
                              </div>
                            </div>
                            {/* Book Now Button */}
                            {serviceData?.status !== "booked" &&
                              serviceData?.status !== "cancelled" && (
                                <button
                                  className="w-full md:w-auto px-4 py-2 text-sm font-medium text-white primary_bg_color rounded-lg focus:outline-none"
                                  onClick={() => handleBookNow(bid)}
                                >
                                  {t("bookNow")}
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {biddersData?.length === 0 && (
                  <div className="w-full h-[60vh] flex items-center justify-center">
                    <NoDataFound
                      title={t("pleaseBePatient")}
                      desc={t("pleaseBePatientText")}
                    />
                  </div>
                )}
                {/* Load More Button */}
                <div className="loadmore my-6 flex items-center justify-center">
                  {isloadMore ? (
                    <button className="primary_bg_color primary_text_color py-3 px-8 rounded-xl">
                      <MiniLoader />
                    </button>
                  ) : (
                    biddersData.length < total && (
                      <button
                        onClick={handleLoadMore}
                        className="primary_bg_color text-white py-3 px-8 rounded-xl"
                        disabled={isloadMore}
                      >
                        {t("loadMore")}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cancel Booking Confirmation Dialog */}
      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={confirmCancelBooking}
        title="cancelBooking"
        description="areYouSureYouWantToCancelThisBooking"
        confirmText="confirm"
        cancelText="cancel"
      />
    </Layout>
  );
};

export default ServiceRequestDetails;
