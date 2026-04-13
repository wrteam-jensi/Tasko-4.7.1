"use client";
import ProfileLayout from "@/components/Layout/ProfileLayout";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { getTransactionApi } from "@/api/apiRoutes";
import { toast } from "sonner";
import { isMobile, paymentModes, showPrice, useRTL } from "@/utils/Helper";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import withAuth from "@/components/Layout/withAuth";
import NoDataFound from "@/components/ReUseableComponents/Error/NoDataFound";
import BreadCrumb from "@/components/ReUseableComponents/BreadCrumb";
import PaymentHistoryTableSkeleton from "@/components/Skeletons/PaymentHistoryTableSkeleton";

const PaymentHistory = () => {
  const t = useTranslation();
  const isRtl = useRTL();
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true); // Add loading state
  const entriesPerPage = 10;

  const fetchTransactions = async () => {
    setLoading(true); // Set loading to true when starting fetch
    try {
      const response = await getTransactionApi({
        limit: entriesPerPage,
        offset: (currentPage - 1) * entriesPerPage,
      });

      setTransactions(response.data);
      setTotalTransactions(response.total); // Assuming the API returns total count
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    } finally {
      setLoading(false); // Set loading to false when fetch completes
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  const formatDate = (dateString) => {
    // Treat the date string as local time by removing 'Z'
    let raw = String(dateString).trim().replace(/Z$/i, '');
    // Remove any timezone offset to ensure local time is used
    raw = raw.replace(/[+-]\d{2}:\d{2}$/, '').trim();
    
    // Ensure 'T' is between date and time for cross-browser compatibility (e.g. Safari)
    raw = raw.replace(' ', 'T');
    
    const date = new Date(raw);

    // Get translated month names
    const months = [
      t("january"), t("february"), t("march"), t("april"),
      t("may"), t("june"), t("july"), t("august"),
      t("september"), t("october"), t("november"), t("december")
    ];

    // Get hours in 12-hour format
    let hours = date.getHours();
    const ampm = hours >= 12 ? t("pm") : t("am");
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    // Get minutes with leading zero
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // Format: "17 September 2025, 06:54 AM"
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes} ${ampm}`;
  };

  const totalPages = Math.ceil(totalTransactions / entriesPerPage);

  // State to handle page transition animation
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handlePageChange = (page) => {
    setIsTransitioning(true); // Trigger the transition effect

    // Simulate page change and transition
    setTimeout(() => {
      setCurrentPage(page);
      setIsTransitioning(false); // End transition after page change
    }, 500); // Match the CSS transition duration
  };

  const getStatusStyle = (status) => {
    const successStatuses = ["success", "succeeded", "completed"];
    const pendingStatuses = ["pending", "processed"];
    const cancelledStatuses = ["cancelled", "failed"];

    const isSuccess = successStatuses.includes(status);
    const isPending = pendingStatuses.includes(status);
    const isCancelled = cancelledStatuses.includes(status);

    return {
      text: `px-6 py-4 text-center font-medium capitalize ${isSuccess
        ? "text-green-600"
        : isPending
          ? "text-yellow-600"
          : isCancelled
            ? "text-red-600"
            : ""
        }`,
      badge: `px-3 py-1 rounded-full text-sm capitalize ${isSuccess
        ? "bg-green-100"
        : isPending
          ? "bg-yellow-100"
          : isCancelled
            ? "bg-red-100"
            : ""
        }`,
    };
  };


  return (
    <ProfileLayout
      breadcrumbTitle={t("paymentHistory")}
      breadcrumbLink="/payment-history"
    >
      <div className="flex flex-col gap-6">
        <div className="page-headline text-xl md:text-2xl sm:text-3xl font-semibold border-b pb-3 md:pb-0 md:border-none">
          <span>{t("paymentHistory")}</span>
        </div>

        {/* Payment History Table */}
        <div className="overflow-x-auto rounded-xl shadow-sm border">
          {loading ? (
            // Show skeleton loader while data is being fetched
            <PaymentHistoryTableSkeleton rows={entriesPerPage} />
          ) : transactions.length === 0 ? (
            // Show "No Data Found" only when loading is complete and there's no data
            <div className="w-full h-[60vh] flex items-center justify-center p-8">
              <NoDataFound
                title={t("noPaymentHistoryFound")}
                desc={t("noPaymentHistoryText")}
              />
            </div>
          ) : (
            <>
              {/* Desktop Table - hidden on mobile */}
              <div className="hidden md:block">
                <Table className="w-full">
                  {/* Table Header */}
                  <TableHeader className="primary_bg_color text-white hover:!text-white">
                    <TableRow className="text-white hover:!bg-transparent border-none">
                      <TableHead
                        className={`px-6 py-4 font-semibold text-center text-white first:${isRtl ? "rounded-tr-xl" : "rounded-tl-xl"
                          }`}
                      >
                        {t("orderId")}
                      </TableHead>
                      <TableHead
                        className={`px-6 py-4 font-semibold text-center text-white first:${isRtl ? "rounded-tr-xl" : "rounded-tl-xl"
                          }`}
                      >
                        {t("transactionId")}
                      </TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-center text-white">
                        {t("paymentMethod")}
                      </TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-center text-white">
                        {t("transationDate")}
                      </TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-center text-white">
                        {t("amount")}
                      </TableHead>
                      <TableHead
                        className={`px-6 py-4 font-semibold text-center text-white last:${isRtl ? "rounded-tl-xl" : "rounded-tr-xl"
                          }`}
                      >
                        {t("status")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody>
                    {transactions.map((row, index) => (
                      <TableRow
                        key={row.order_id}
                        className={`${"card_bg transition-colors"} ${index === transactions.length - 1
                          ? "last-row"
                          : "border-b"
                          }`}
                      >
                        <TableCell className="px-6 py-4 text-start">
                          {row.order_id}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          {row.txn_id ? row.txn_id : "-"}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex justify-start">
                            {paymentModes.map((paymentMode) => {
                              if (paymentMode.method === row.type) {
                                return (
                                  <div
                                    key={paymentMode.method}
                                    className="flex items-center gap-3"
                                  >
                                    <Avatar className="h-[40px] w-[40px] rounded-[4px]" imgClassName="rounded-[8px]">
                                      <AvatarImage
                                        src={paymentMode.icon}
                                        alt={paymentMode.method}
                                        width={40}
                                        height={40}
                                      />
                                    </Avatar>
                                    <span className="text-sm font-medium capitalize">
                                      {t(paymentMode.method)}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          {formatDate(row.transaction_date)}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center font-medium">
                          {showPrice(row.amount)}
                        </TableCell>
                        <TableCell
                          className={
                            getStatusStyle(row.status.toLowerCase()).text
                          }
                        >
                          <span
                            className={
                              getStatusStyle(row.status.toLowerCase()).badge
                            }
                          >
                            {t(row.status.toLowerCase())}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Layout - visible only on mobile */}
              <div className="flex flex-col gap-3 p-3 md:hidden">
                {transactions.map((row) => (
                  <div
                    key={row.order_id}
                    className="card_bg rounded-lg border p-4 flex flex-col gap-3"
                  >
                    {/* Order ID & Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        #{row.order_id}
                      </span>
                      <span
                        className={
                          getStatusStyle(row.status.toLowerCase()).badge
                        }
                      >
                        {t(row.status.toLowerCase())}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm description_color">{t("amount")}</span>
                      <span className="text-sm font-medium">
                        {showPrice(row.amount)}
                      </span>
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm description_color">{t("paymentMethod")}</span>
                      <div className="flex items-center gap-2">
                        {paymentModes.map((paymentMode) => {
                          if (paymentMode.method === row.type) {
                            return (
                              <div
                                key={paymentMode.method}
                                className="flex items-center gap-2"
                              >
                                <Avatar className="h-[24px] w-[24px] rounded-[4px]">
                                  <AvatarImage
                                    src={paymentMode.icon}
                                    alt={paymentMode.method}
                                    width={24}
                                    height={24}
                                  />
                                </Avatar>
                                <span className="text-sm capitalize">
                                  {t(paymentMode.method)}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>

                    {/* Transaction ID */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm description_color">{t("transactionId")}</span>
                      <span className="text-sm truncate max-w-[150px]">
                        {row.txn_id ? row.txn_id : "-"}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-xs description_color">
                        {formatDate(row.transaction_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination - Only show when not loading and there are transactions */}
          <div>
            {!loading && transactions.length > 0 ? (
              <Pagination className="flex flex-wrap justify-center gap-2 w-full mt-4 border-t p-3">
                {/* Previous Button */}
                <PaginationPrevious
                  disabled={currentPage === 1}
                  onClick={() =>
                    handlePageChange(Math.max(currentPage - 1, 1))
                  }
                  className={`${currentPage === 1
                    ? "cursor-not-allowed text-gray-400"
                    : "cursor-pointer primary_text_color"
                    } px-4 py-2 rounded-full hover:light_bg_color hover:primary_text_color transition flex items-center gap-2`}
                >
                  {t("previous")}
                </PaginationPrevious>

                {/* Pagination Items */}
                <PaginationContent className="flex items-center justify-center gap-2">
                  {currentPage > 3 && (
                    <PaginationItem
                      key={1}
                      active={currentPage === 1}
                      className={`${currentPage === 1
                        ? "primary_bg_color text-white"
                        : "text-gray-600"
                        } flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-200 transition-all page-transition`}
                    >
                      <PaginationLink
                        onClick={() => handlePageChange(1)}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {currentPage > 4 && <PaginationEllipsis />}

                  {Array.from({ length: totalPages }, (_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 &&
                        page <= currentPage + 2)
                    ) {
                      return (
                        <PaginationItem
                          key={page}
                          active={currentPage === page}
                          className={`${currentPage === page
                            ? "primary_bg_color text-white"
                            : "text-gray-600"
                            } flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-200 transition-all page-transition`}
                        >
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  {currentPage < totalPages - 3 && (
                    <PaginationEllipsis />
                  )}

                  {currentPage < totalPages - 2 && (
                    <PaginationItem
                      key={totalPages}
                      active={currentPage === totalPages}
                      className={`${currentPage === totalPages
                        ? "primary_bg_color text-white"
                        : "text-gray-600"
                        } flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-200 transition-all page-transition`}
                    >
                      <PaginationLink
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </PaginationContent>

                {/* Next Button */}
                <PaginationNext
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    handlePageChange(
                      Math.min(currentPage + 1, totalPages)
                    )
                  }
                  className={`${currentPage === totalPages
                    ? "cursor-not-allowed text-gray-400"
                    : "cursor-pointer primary_text_color"
                    } px-4 py-2 rounded-full hover:light_bg_color hover:primary_text_color transition flex items-center gap-2`}
                >
                  {t("next")}
                </PaginationNext>
              </Pagination>
            ) : null}
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default withAuth(PaymentHistory);
