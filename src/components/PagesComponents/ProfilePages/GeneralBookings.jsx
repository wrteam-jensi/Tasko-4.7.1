"use client";
import React, { useState, useEffect } from "react";
import ProfileLayout from "@/components/Layout/ProfileLayout";
import BookingSecHeader from "./BookingSecHeader";
import GeneralBookingCard from "@/components/Cards/GeneralBookingCard";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";
import GeneralBookingCardSkeleton from "@/components/Skeletons/GeneralBookingCardSkeleton";
import NoDataFound from "@/components/ReUseableComponents/Error/NoDataFound";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { selectBookingStatus } from "@/redux/reducers/helperSlice";
import { useSelector } from "react-redux";
import withAuth from "@/components/Layout/withAuth";
import { useBookings } from "@/hooks/useBookings";

const GeneralBookings = () => {
  const t = useTranslation();
  const bookingStatus = useSelector(selectBookingStatus);
  const [offset, setOffset] = useState(0); // Offset for pagination
  const limit = 8; // Number of bookings per fetch

  // Use React Query hook for bookings - this will cache the data and prevent multiple API calls
  // The hook automatically refetches when bookingStatus changes
  const {
    bookings,
    total,
    isLoading,
    isFetching,
    error,
  } = useBookings({
    status: bookingStatus,
    limit: limit,
    offset: offset,
    customRequestOrders: false, // General bookings, not custom requests
  });

  // Store all loaded bookings for pagination
  const [allBookings, setAllBookings] = useState([]);

  // Update allBookings when bookings data changes
  useEffect(() => {
    if (offset === 0) {
      // Reset to new data when offset is 0 (new filter or initial load)
      setAllBookings(bookings || []);
    } else {
      // Append new data when loading more
      setAllBookings((prev) => {
        // Avoid duplicates by checking if booking already exists
        const existingIds = new Set(prev.map(b => b?.id));
        const newBookings = (bookings || []).filter(b => b?.id && !existingIds.has(b.id));
        return [...prev, ...newBookings];
      });
    }
  }, [bookings, offset]);

  // Reset offset when bookingStatus changes
  useEffect(() => {
    setOffset(0);
    // Don't clear allBookings immediately - let the bookings update handle it
  }, [bookingStatus]);

  const handleLoadMore = () => {
    // Compute the new offset value
    const newOffset = offset + limit;
    setOffset(newOffset); // Update the state for offset - this will trigger a new query
  };

  return (
    <ProfileLayout
      breadcrumbTitle={t("generalBookings")}
      breadcrumbLink="/general-bookings"
      containerClassName="px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-6">
        <div className="page-headline text-xl md:text-2xl sm:text-3xl font-semibold border-b pb-3 md:pb-0 md:border-none">
          <span>{t("bookings")}</span>
        </div>
        <div>
          <BookingSecHeader />
        </div>
        <>
          {/* Grid Section */}
          {isLoading && offset === 0 ? (
            // Skeleton when loading initial data
            <div className="grid grid-cols-1 sm:grid-cols-1 xl:grid-cols-2 gap-6">
              {[...Array(8)].map((_, index) => (
                <GeneralBookingCardSkeleton key={index} />
              ))}
            </div>
          ) : allBookings?.length === 0 && !isLoading && !isFetching ? (
            // No Data Found Message
            <div className="w-full h-[60vh] flex items-center justify-center">
              <NoDataFound
                title={t("noBookings")}
                desc={t("noBookingText")}
              />
            </div>
          ) : (
            // Render Booking Cards
            <>
              <div className="grid grid-cols-1 sm:grid-cols-1 xl:grid-cols-2 gap-6">
                {allBookings?.map((booking, index) => (
                  <GeneralBookingCard data={booking} key={booking?.id || index} />
                ))}
              </div>

              {/* Load More Button */}
              <div className="loadmore my-6 flex items-center justify-center">
                {isFetching && offset > 0 ? (
                  <button className="primary_bg_color primary_text_color py-3 px-8 rounded-xl">
                    <MiniLoader />
                  </button>
                ) : (
                  allBookings.length < total && (
                    <button
                      onClick={handleLoadMore}
                      className="primary_bg_color text-white py-3 px-8 rounded-xl"
                      disabled={isFetching}
                    >
                     {t("loadMore")}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </>
      </div>
    </ProfileLayout>
  );
};

export default withAuth(GeneralBookings);
