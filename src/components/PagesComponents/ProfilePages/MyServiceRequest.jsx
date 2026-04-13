import React, { useState, useEffect } from "react";
import ProfileLayout from "@/components/Layout/ProfileLayout";
import MyServiceRequestCard from "@/components/Cards/MyServiceRequestCard";
import { fetchMyCustomJobRequestsApi } from "@/api/apiRoutes";
import NoDataFound from "@/components/ReUseableComponents/Error/NoDataFound";
import MyServiceRequestCardSkeleton from "@/components/Skeletons/MyServiceRequestCardSkeleton";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";
import { FaPlus } from "react-icons/fa";
import AddCustomServiceDialog from "@/components/ReUseableComponents/Dialogs/AddCustomServiceDialog";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { isMobile } from "@/utils/Helper";
const MyServiceRequest = () => {
  const t = useTranslation();

  const [bookigs, setBookigs] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0); // Offset for pagination
  const limit = 8; // Number of providers per fetch
  const [loading, setLoading] = useState(false); // To manage button loading state
  const [isloadMore, setIsloadMore] = useState(false);
  const [open, setOpen] = React.useState(false);

  const fetchBookings = async (append = false, customOffset = offset) => {
    if (append) {
      setIsloadMore(true); // Set Load More button state to loading
    } else {
      setLoading(true); // Set initial fetch to loading
    }
    try {
      const response = await fetchMyCustomJobRequestsApi({
        offset: customOffset,
        limit: limit,
      });
      if (response?.error === false) {
        setBookigs((prevBookings) =>
          append ? [...prevBookings, ...response?.data] : response?.data
        );
        setTotal(response?.total);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false); // Stop initial loading state
      setIsloadMore(false); // Stop Load More button loading state
    }
  };

  const handleLoadMore = async () => {
    // Compute the new offset value
    const newOffset = offset + limit;
    setOffset(newOffset); // Update the state for offset

    // Pass the computed offset directly to fetchAllProviders
    await fetchBookings(true, newOffset); // Ensure the correct offset is used
  };

  useEffect(() => {
    fetchBookings(false, 0);
  }, []);

  const handleAddNewService = (e) => {
    e.preventDefault();
    setOpen(true);
  };

  return (
    <ProfileLayout
      breadcrumbTitle={t("myServiceRequests")}
      breadcrumbLink="/my-services-requests"
      containerClassName="px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between w-full max-[350px]:flex-wrap max-[350px]:gap-2">
          <div className="page-headline max-[350px]:text-base text-lg md:text-2xl sm:text-3xl font-semibold">
            <span>{t("myServiceRequests")}</span>
          </div>
          <div>
            <button
              className="flex items-center justify-center gap-2 primary_bg_color rounded-lg text-white py-2 px-2 md:px-3 text-sm md:text-base"
              onClick={(e) => handleAddNewService(e)}
            >
              {" "}
              <span>
                <FaPlus />
              </span>
              <span>{t("addService")}</span>
            </button>
          </div>
        </div>
        <>
          {/* Grid Section */}
          {loading ? (
            // Skeleton when loading
            <div className="grid grid-cols-1 sm:grid-cols-1 xl:grid-cols-2 gap-6">
              {[...Array(8)].map((_, index) => (
                <MyServiceRequestCardSkeleton key={index} />
              ))}
            </div>
          ) : bookigs?.length === 0 ? (
            // No Data Found Message
            <div className="w-full h-[60vh] flex items-center justify-center">
              <NoDataFound
                title={t("noMyServiceRequests")}
                desc={t("noMyServiceRequestsText")}
              />
            </div>
          ) : (
            // Render Booking Cards
            <>
              <div className="grid grid-cols-1 sm:grid-cols-1 xl:grid-cols-2 gap-6">
                {bookigs?.map((booking, index) => (
                  <MyServiceRequestCard data={booking} key={index} />
                ))}
              </div>

              {/* Load More Button */}
              <div className="loadmore my-6 flex items-center justify-center">
                {isloadMore ? (
                  <button className="primary_bg_color primary_text_color py-3 px-8 rounded-xl">
                    <MiniLoader />
                  </button>
                ) : (
                  bookigs.length < total && (
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
            </>
          )}
        </>
        {open && (
          <AddCustomServiceDialog open={open} close={() => setOpen(false)} fetchBookings={fetchBookings} />
        )}
      </div>
    </ProfileLayout>
  );
};

export default MyServiceRequest;
