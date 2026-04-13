"use client";
import React, { useState, useEffect } from "react";
import ProfileLayout from "@/components/Layout/ProfileLayout";
import NotificationCard from "@/components/Cards/NotificationCard";
import { userNotifications } from "@/api/apiRoutes";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";
import { useTranslation } from "@/components/Layout/TranslationContext";
import withAuth from "@/components/Layout/withAuth";
import NoDataFound from "@/components/ReUseableComponents/Error/NoDataFound";
import { Skeleton } from "@/components/ui/skeleton";

const Notifications = () => {
  const t = useTranslation();

  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isloadMore, setIsloadMore] = useState(false);

  const fetchNotifications = async (append = false, customOffset = offset) => {
    if (append) {
      setIsloadMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await userNotifications({
        limit: limit,
        offset: customOffset,
      });
      if (response?.error === false) {
        setNotifications((prev) =>
          append ? [...prev, ...response?.data] : response?.data
        );
        setTotal(response?.total);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsloadMore(false);
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    await fetchNotifications(true, newOffset);
  };

  useEffect(() => {
    fetchNotifications(false, 0);
  }, []);

  const notificationSkeletonCard = (
    <div className="flex items-center justify-between border-b last:border-b-0 pb-4 gap-4 bg-light_gray">
      <div className="w-16 h-16 rounded overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="w-16">
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );

  return (
    <ProfileLayout
      breadcrumbTitle={t("notifications")}
      breadcrumbLink="/notifications"
    >
      <div className="flex flex-col gap-6">
                <div className="page-headline text-xl border-b pb-3 md:pb-0 md:border-none md:text-2xl sm:text-3xl font-semibold">
                  <span>{t("notifications")}</span>
                </div>

                {/* Data Loading State */}
                {loading ? (
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index}>{notificationSkeletonCard}</div>
                    ))}
                  </div>
                ) : notifications?.length === 0 ? (
                  <div className="w-full h-[60vh] flex items-center justify-center">
                    <NoDataFound
                      title={t("noNotificationsFound")}
                      desc={t("noNotificationsFoundText")}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col border rounded-xl">
                    {notifications.map((notification, index) => (
                      <NotificationCard key={index} data={notification} />
                    ))}
                  </div>
                )}

                {/* Load More Button */}
                {!loading && notifications?.length > 0 && notifications?.length < total && (
                  <div className="loadmore my-6 flex items-center justify-center">
                    {isloadMore ? (
                      <button className="primary_bg_color primary_text_color py-3 px-8 rounded-xl">
                        <MiniLoader />
                      </button>
                    ) : (
                      <button
                        onClick={handleLoadMore}
                        className="light_bg_color primary_text_color py-3 px-8 rounded-xl"
                        disabled={isloadMore}
                      >
                        {t("loadMore")}
                      </button>
                    )}
                  </div>
                )}
      </div>
    </ProfileLayout>
  );
};

export default withAuth(Notifications);
