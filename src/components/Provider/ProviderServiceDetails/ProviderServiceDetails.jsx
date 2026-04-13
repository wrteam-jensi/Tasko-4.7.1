"use client";
import { useState, useEffect, useRef } from "react";
import Layout from "../../Layout/Layout";
import BreadCrumb from "../../ReUseableComponents/BreadCrumb";
import { FaClock, FaStar } from "react-icons/fa6";
import { FaMinus, FaPlus, FaTrash, FaUserFriends } from "react-icons/fa";
import { IoIosDocument } from "react-icons/io";
import FaqAccordion from "../../ReUseableComponents/FaqAccordion.jsx";
import Rating from "../Rating.jsx";
import { Progress } from "@/components/ui/progress";
import { useIsLogin, showPrice } from "@/utils/Helper";
import CustomImageTag from "@/components/ReUseableComponents/CustomImageTag";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  allServices,
  getRatings,
  ManageCartApi,
  removeCartApi,
} from "@/api/apiRoutes";
import Lightbox from "@/components/ReUseableComponents/CustomLightBox/LightBox";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";
import ProviderServiceDetailsSkeleton from "@/components/Skeletons/ProviderServiceDetailsSkeleton";
import { toast } from "sonner";
import {
  removeItemFromCart,
  setCartData,
  setTaxValue,
  selectCartProvider,
} from "@/redux/reducers/cartSlice";
import ConfirmDialog from "@/components/ReUseableComponents/Dialogs/ConfirmDialog";
import { useTranslation } from "@/components/Layout/TranslationContext";
import NoDataFound from "@/components/ReUseableComponents/Error/NoDataFound";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { buildLanguageAwareKey } from "@/lib/react-query-client";
import ProviderReviewCard from "../ProviderReviewCard";
import { logClarityEvent } from "@/utils/clarityEvents";
import { SERVICE_EVENTS, CART_EVENTS } from "@/constants/clarityEventNames";
import {
  selectServiceReviewsLoadMap,
  setServiceReviewsLoad,
  openLoginModal,
} from "@/redux/reducers/helperSlice";

const ProviderServiceDetails = () => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const slug = router.query.slug;
  let providerId, serviceId;
  if (Array.isArray(slug) && slug.length >= 2) {
    [providerId, serviceId] = slug.slice(-2);
  }

  const textRef = useRef(null);
  const locationData = useSelector((state) => state?.location);
  const serviceReviewsLoadMap = useSelector(selectServiceReviewsLoadMap);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const limit = 5;
  const reviewLoadKey =
    providerId && serviceId ? `${providerId}::${serviceId}` : null;
  const storedReviewCount = reviewLoadKey
    ? serviceReviewsLoadMap?.[reviewLoadKey] || 0
    : 0;
  const [targetReviewCount, setTargetReviewCount] = useState(limit);

  // Service Details Query
  const {
    data: serviceData = {},
    isLoading: isLoadingService,
    isError: isErrorService,
  } = useQuery({
    queryKey: buildLanguageAwareKey([
      "serviceDetails",
      locationData?.lat,
      locationData?.lng,
      serviceId,
      providerId,
    ]),
    queryFn: async () => {
      const response = await allServices({
        latitude: locationData?.lat,
        longitude: locationData?.lng,
        slug: serviceId,
        provider_slug: providerId,
      });
      if (response?.error === false) {
        return response?.data[0];
      }
      throw new Error(response.message || "Failed to fetch service details");
    },
    enabled: !!serviceId && !!providerId && router.isReady,
  });

  // Reviews Infinite Query
  const {
    data: reviewsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingReviews,
  } = useInfiniteQuery({
    queryKey: buildLanguageAwareKey(["serviceReviews", providerId, serviceId]),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await getRatings({
        limit,
        offset: pageParam,
        provider_slug: providerId,
        slug: serviceId,
      });
      if (response?.error === false) {
        return {
          data: response.data,
          total: response.total,
          nextPage:
            response.data.length === limit ? pageParam + limit : undefined,
        };
      }
      throw new Error(response.message || "Failed to fetch reviews");
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!providerId && !!serviceId,
  });

  useEffect(() => {
    if (serviceData?.id) {
      // Keep analytics aligned with the mobile app whenever a detail page is viewed.
      logClarityEvent(SERVICE_EVENTS.SERVICE_DETAIL_VIEWED, {
        service_id: serviceData?.id,
        provider_id: serviceData?.partner_id || providerId,
      });
    }
  }, [serviceData?.id, serviceData?.partner_id, providerId]);

  // Extract reviews from the nested structure
  const reviews = reviewsData?.pages?.flatMap((page) => page.data) || [];
  const totalReviews = reviewsData?.pages?.[0]?.total || 0;

  useEffect(() => {
    if (!reviewLoadKey) return;
    if (storedReviewCount > limit) {
      setTargetReviewCount(storedReviewCount);
    } else {
      setTargetReviewCount(limit);
    }
  }, [reviewLoadKey, storedReviewCount]);

  useEffect(() => {
    if (!reviewLoadKey) return;

    const cappedTarget = totalReviews
      ? Math.min(targetReviewCount, totalReviews)
      : targetReviewCount;

    if (reviews.length < cappedTarget && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
      return;
    }

    if (
      reviews.length > 0 &&
      reviews.length >= cappedTarget &&
      storedReviewCount !== reviews.length
    ) {
      dispatch(
        setServiceReviewsLoad({
          key: reviewLoadKey,
          loadedCount: reviews.length,
        })
      );
    }
  }, [
    reviews.length,
    targetReviewCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    reviewLoadKey,
    dispatch,
    storedReviewCount,
    totalReviews,
  ]);

  const handleLoadMoreReviews = () => {
    setTargetReviewCount((prev) => prev + limit);
  };

  useEffect(() => {
    if (textRef.current) {
      const { scrollHeight, offsetHeight } = textRef.current;
      setIsOverflowing(scrollHeight > offsetHeight);
    }
  }, [serviceData?.description]);

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const rating = serviceData?.average_rating;
  const totalRating = serviceData?.total_ratings;

  const ratingData = [
    { rating: 5, count: serviceData?.rating_5 || 0 },
    { rating: 4, count: serviceData?.rating_4 || 0 },
    { rating: 3, count: serviceData?.rating_3 || 0 },
    { rating: 2, count: serviceData?.rating_2 || 0 },
    { rating: 1, count: serviceData?.rating_1 || 0 },
  ];

  const isLoggedIn = useIsLogin(); // Reactive hook - automatically updates when login state changes

  // Get initial quantities from Redux
  const cart = useSelector((state) => state.cart.items);
  const currentCartProvider = useSelector(selectCartProvider);
  const [qty, setQuantities] = useState({});
  const [animationClass, setAnimationClasses] = useState({});
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);

  // Sync state with Redux on component mount
  useEffect(() => {
    const initialQuantities = {};
    cart.forEach((item) => {
      if (item.id && item.qty) {
        initialQuantities[item.id] = item.qty;
      }
    });
    setQuantities(initialQuantities);
  }, [cart]);

  const handleAddQuantity = async (id) => {
    try {
      const currentQuantity = parseInt(qty[id], 10);

      if (currentQuantity >= serviceData?.max_quantity_allowed) {
        toast.error(t("maxQtyReached"));
        return;
      }

      const newQuantity = currentQuantity + 1;

      const response = await ManageCartApi({
        id,
        qty: newQuantity,
      });

      if (response.error === false) {
        setAnimationClasses((prev) => ({ ...prev, [id]: "slide-in" }));
        setQuantities((prevQuantities) => ({
          ...prevQuantities,
          [id]: newQuantity,
        }));

        const cartData = response;
        const structuredCartItems = cartData?.data.map((item) => ({
          ...item,
          ...item.servic_details,
        }));

        dispatch(
          setCartData({
            provider: cartData,
            items: structuredCartItems || [],
          })
        );
        dispatch(setTaxValue(cartData?.tax_value));

        toast.success(t("serviceUpdatedSuccessFullyToCart"));
        logClarityEvent(CART_EVENTS.CART_ITEM_ADDED, {
          service_id: id,
          provider_id: cartData?.provider_id || serviceData?.partner_id,
          quantity: newQuantity,
          entrypoint: "service_detail_quantity",
        });

        setTimeout(() => {
          setAnimationClasses((prev) => ({ ...prev, [id]: "" }));
        }, 300);
      } else {
        toast.error(response?.message);
      }
    } catch (error) {
      console.error("Error while adding quantity:", error);
      toast.error("Failed to add quantity");
    }
  };

  const handleRemoveQuantity = async (id) => {
    try {
      const currentQty = qty[id];

      if (currentQty > 1) {
        const response = await ManageCartApi({ id, qty: currentQty - 1 });

        if (response.error === false) {
          setAnimationClasses((prev) => ({ ...prev, [id]: "slide-out" }));
          setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [id]: currentQty - 1,
          }));

          const cartData = response;
          const structuredCartItems = cartData?.data.map((item) => ({
            ...item,
            ...item.servic_details,
          }));

          dispatch(
            setCartData({
              provider: cartData,
              items: structuredCartItems || [],
            })
          );
          dispatch(setTaxValue(cartData?.tax_value));

          toast.success(t("serviceUpdatedSuccessFullyToCart"));
          logClarityEvent(CART_EVENTS.CART_ITEM_REMOVED, {
            service_id: id,
            provider_id: cartData?.provider_id || serviceData?.partner_id,
            quantity: currentQty - 1,
            entrypoint: "service_detail_quantity",
          });

          setTimeout(() => {
            setAnimationClasses((prev) => ({ ...prev, [id]: "" }));
          }, 300);
        }
      }
    } catch (error) {
      console.error("Error while removing quantity:", error);
      toast.error("Failed to update cart.");
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      const currentQty = Number(qty[id]);
      if (currentQty === 1) {
        const response = await removeCartApi({ itemId: id });

        if (response.error === false) {
          const updatedQuantities = { ...qty };
          delete updatedQuantities[id];
          setQuantities(updatedQuantities);
          dispatch(setTaxValue(response?.data?.tax_value));

          dispatch(removeItemFromCart(id));
          toast.success(t("serviceRemovedSuccessFullyFromCart"));
          logClarityEvent(CART_EVENTS.CART_ITEM_REMOVED, {
            service_id: id,
            provider_id: serviceData?.partner_id,
            quantity: 0,
            entrypoint: "service_detail_remove",
          });
        } else {
          toast.error(response?.message);
        }
      }
    } catch (error) {
      console.error("Error while removing quantity:", error);
      toast.error("Failed to update cart.");
    }
  };

  const proceedAddToCart = async (itemToAdd) => {
    try {
      const response = await ManageCartApi({ id: itemToAdd.id, qty: 1 });

      if (response.error === false) {
        setQuantities((prev) => ({ ...prev, [itemToAdd.id]: 1 }));

        const cartData = response;
        const structuredCartItems = cartData?.data.map((item) => ({
          ...item,
          ...item.servic_details,
        }));

        dispatch(
          setCartData({
            provider: cartData,
            items: structuredCartItems || [],
          })
        );
        dispatch(setTaxValue(cartData?.tax_value));

        toast.success(t("serviceAddedSuccessFullyToCart"));
        logClarityEvent(CART_EVENTS.CART_ITEM_ADDED, {
          service_id: itemToAdd?.id,
          provider_id: cartData?.provider_id || serviceData?.partner_id,
          quantity: 1,
          entrypoint: "service_detail_add",
        });
      } else {
        toast.error(response?.message);
      }
    } catch (error) {
      console.error("Error while adding to cart:", error);
      toast.error("Failed to add item to cart");
    } finally {
      setIsConflictDialogOpen(false);
      setPendingCartItem(null);
    }
  };

  const handleAddToCart = async (e, data) => {
    e.preventDefault();

    if (!isLoggedIn) {
      dispatch(openLoginModal());
      return false;
    }

    // Extract provider ID from service data
    // The service data contains user_id which is the provider's user ID
    const itemProviderId = data?.user_id || data?.partner_id || data?.provider_id || providerId;

    if (
      cart.length > 0 &&
      currentCartProvider?.provider_id &&
      itemProviderId &&
      String(currentCartProvider.provider_id) !== String(itemProviderId)
    ) {
      setPendingCartItem(data);
      setIsConflictDialogOpen(true);
      return;
    }

    await proceedAddToCart(data);
  };

  const translatedServiceName =
    serviceData?.translated_title || serviceData?.title;
  const translatedServiceDescription =
    serviceData?.translated_description || serviceData?.description;
  const translatedLongDescription =
    serviceData?.translated_long_description || serviceData?.long_description;
  const translatedFaqs = serviceData?.translated_faqs || serviceData?.faqs;

  const isLoading = isLoadingService || isLoadingReviews;

  if (isLoading) {
    return (
      <Layout>
        <ProviderServiceDetailsSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <BreadCrumb
        firstEle={t("providers")}
        secEle={t("providerDetails")}
        thirdEle={t("serviceDetails")}
        firstEleLink="/providers"
        SecEleLink={`/provider-details/${providerId}`}
        thirdEleLink={`/provider-details/${providerId}/${serviceId}`}
      />
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        {Object.keys(serviceData).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6">
            {/* Left Section */}

            <div className="col-span-12 lg:col-span-4 service-left-section">
              <div className="service_image aspect-service sticky top-40">
                <CustomImageTag
                  src={serviceData?.image_of_the_service}
                  alt={translatedServiceName}
                  className="w-full aspect-service object-cover rounded-xl"
                  imgClassName="rounded-xl"
                />
              </div>
              <div></div>
              <div className="serviceSideBar hidden">
                <div className="flex flex-col">
                  <span className="text-lg lg:text-[28px] font-extrabold">
                    {translatedServiceName}{" "}
                  </span>
                  <div className="mt-4">
                    <p
                      className={`text-sm description_color leading-relaxed transition-opacity duration-300 ${isExpanded ? "opacity-100" : "line-clamp-2 opacity-80"
                        }`}
                    >
                      {translatedServiceDescription}
                    </p>
                    {isOverflowing && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="font-medium underline text-sm mt-1"
                      >
                        {isExpanded ? t("showLess") : t("readMore")}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 mt-7">
                    {serviceData?.total_ratings > 0 && (
                      <>
                        <span className="flex items-center gap-1">
                          <FaStar className="rating_icon_color" />
                          <span className="ml-1 text-sm font-bold">
                            {rating} {`(${serviceData?.total_ratings})`}
                          </span>
                        </span>
                        <span className="border border-gray-500 h-3"></span>
                      </>
                    )}
                    {serviceData?.number_of_members_required > 0 && (
                      <>
                        <span className="flex items-center gap-1">
                          <FaUserFriends className="mr-1 primary_text_color" />
                          <span className="ml-1 text-sm flex items-center gap-1">
                            <span>
                              {" "}
                              {serviceData?.number_of_members_required}
                            </span>{" "}
                            <span className="hidden lg:block">
                              {" "}
                              {t("persons")}
                            </span>
                          </span>
                        </span>
                        <span className="border border-gray-500 h-3"></span>
                      </>
                    )}
                    {serviceData?.duration && (
                      <span className="flex items-center gap-1 pl-2">
                        <FaClock className="mr-1 primary_text_color" />
                        <span className="ml-1 text-sm flex items-center gap-1">
                          <span> {serviceData?.duration}</span>{" "}
                          <span className="hidden lg:block">
                            {" "}
                            {t("minutes")}
                          </span>
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-8 mt-7">
                    {serviceData?.discounted_price > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-base sm:text-[28px] font-semibold">
                          {showPrice(serviceData?.price_with_tax)}
                        </span>
                        <span className="text-xs sm:text-lg primary_text_color line-through">
                          {showPrice(serviceData?.original_price_with_tax)}
                        </span>
                      </div>
                    ) : (
                      <span className="primary_text_color text-base sm:text-[28px] font-semibold">
                        {showPrice(serviceData?.price_with_tax)}
                      </span>
                    )}
                    {serviceData?.id && qty[serviceData.id] > 0 ? (
                      <button className="px-4 py-2 mt-2 text-xs sm:text-sm font-medium light_bg_color primary_text_color rounded-md overflow-hidden w-full xl:w-fit">
                        <span className="flex items-center justify-between gap-6">
                          {qty[serviceData.id] > 1 ? (
                            <span
                              onClick={() =>
                                handleRemoveQuantity(serviceData.id)
                              }
                            >
                              <FaMinus />
                            </span>
                          ) : (
                            <span
                              onClick={() => handleRemoveItem(serviceData.id)}
                            >
                              <FaTrash size={16} />
                            </span>
                          )}
                          <span
                            className={`relative ${animationClass[serviceData.id]
                              } transition-transform duration-300`}
                          >
                            {qty[serviceData.id]}
                          </span>
                          <span
                            onClick={() => handleAddQuantity(serviceData.id)}
                          >
                            <FaPlus />
                          </span>
                        </span>
                      </button>
                    ) : (
                      <button
                        className="w-full xl:w-fit px-4 py-2 mt-2 text-xs sm:text-sm font-medium light_bg_color primary_text_color rounded-md"
                        onClick={(e) => handleAddToCart(e, serviceData)}
                        disabled={Number(serviceData?.is_Available_at_location) === 0}
                      >
                        {t("addToCart")}
                      </button>
                    )}
                  </div>
                  <hr className="text-gray-300 my-7" />
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="col-span-12 lg:col-span-8">
              {/* service details */}
              <div className="flex flex-col service-details-main-summary">
                <span className="text-lg lg:text-[28px] font-extrabold">
                  {translatedServiceName}{" "}
                </span>
                <div className="mt-4">
                  <p
                    className={`text-sm description_color leading-relaxed transition-opacity duration-300 ${isExpanded ? "opacity-100" : "line-clamp-2 opacity-80"
                      }`}
                  >
                    {translatedServiceDescription}
                  </p>
                  {isOverflowing && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="font-medium underline text-sm mt-1"
                    >
                      {isExpanded ? t("showLess") : t("readMore")}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 sm:gap-6 mt-7">
                  {serviceData?.total_ratings > 0 && (
                    <>
                      <span className="flex items-center gap-1">
                        <FaStar className="rating_icon_color" />
                        <span className="ml-1 text-sm font-bold">
                          {rating} {`(${serviceData?.total_ratings})`}
                        </span>
                      </span>
                      <span className="border border-gray-500 h-3"></span>
                    </>
                  )}
                  {serviceData?.number_of_members_required > 0 && (
                    <>
                      <span className="flex items-center gap-1">
                        <FaUserFriends className="mr-1 primary_text_color" />
                        <span className="ml-1 text-sm flex items-center gap-1">
                          <span>
                            {" "}
                            {serviceData?.number_of_members_required}
                          </span>{" "}
                          <span className="hidden lg:block">
                            {" "}
                            {t("persons")}
                          </span>
                        </span>
                      </span>
                      <span className="border border-gray-500 h-3"></span>
                    </>
                  )}
                  {serviceData?.duration && (
                    <span className="flex items-center gap-1 pl-2">
                      <FaClock className="mr-1 primary_text_color" />
                      <span className="ml-1 text-sm flex items-center gap-1">
                        <span> {serviceData?.duration}</span>{" "}
                        <span className="hidden lg:block"> {t("minutes")}</span>
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-8 mt-7">
                  {serviceData?.discounted_price > 0 ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-base sm:text-[28px] font-semibold">
                        {showPrice(serviceData?.price_with_tax)}
                      </span>
                      <span className="text-xs sm:text-lg primary_text_color line-through">
                        {showPrice(serviceData?.original_price_with_tax)}
                      </span>
                    </div>
                  ) : (
                    <span className="primary_text_color text-base sm:text-[28px] font-semibold">
                      {showPrice(serviceData?.price_with_tax)}
                    </span>
                  )}
                  {serviceData?.id && qty[serviceData.id] > 0 ? (
                    <button className="px-4 py-2 mt-2 text-xs sm:text-sm font-medium light_bg_color primary_text_color rounded-md overflow-hidden w-full xl:w-fit">
                      <span className="flex items-center justify-between gap-6">
                        {qty[serviceData.id] > 1 ? (
                          <span
                            onClick={() => handleRemoveQuantity(serviceData.id)}
                          >
                            <FaMinus />
                          </span>
                        ) : (
                          <span
                            onClick={() => handleRemoveItem(serviceData.id)}
                          >
                            <FaTrash size={16} />
                          </span>
                        )}
                        <span
                          className={`relative ${animationClass[serviceData.id]
                            } transition-transform duration-300`}
                        >
                          {qty[serviceData.id]}
                        </span>
                        <span onClick={() => handleAddQuantity(serviceData.id)}>
                          <FaPlus />
                        </span>
                      </span>
                    </button>
                  ) : (
                    <button
                      className="w-full xl:w-fit px-4 py-2 mt-2 text-xs sm:text-sm font-medium light_bg_color primary_text_color rounded-md
                      disabled:opacity-50"
                      onClick={(e) => handleAddToCart(e, serviceData)}
                      disabled={Number(serviceData?.is_Available_at_location) === 0}
                    >
                      {t("addToCart")}
                    </button>
                  )}
                </div>
                <hr className="text-gray-300 my-7" />
              </div>

              {/* About Service */}
              {serviceData?.long_description && (
                <div className="flex flex-col">
                  <span className="text-lg lg:text-2xl font-extrabold">
                    {t("aboutService")}{" "}
                  </span>
                  <div className="mt-4">
                    <p
                      className="text-sm description_color"
                      dangerouslySetInnerHTML={{
                        __html: translatedLongDescription || "",
                      }}
                    ></p>
                  </div>
                </div>
              )}

              {/* Gallery Section */}
              {serviceData?.other_images?.length > 0 && (
                <div className="flex flex-col">
                  <span className="text-lg lg:text-2xl font-extrabold my-7">
                    {t("gallery")}{" "}
                  </span>

                  <div className="photos grid grid-cols-3 md:grid-cols-6 gap-4">
                    {serviceData?.other_images
                      .slice(0, 6)
                      .map((image, index) => (
                        <div
                          className="photo cursor-pointer"
                          key={index}
                          onClick={() => openLightbox(index)}
                        >
                          <div className="relative rounded-md overflow-hidden">
                            <CustomImageTag
                              src={image}
                              alt={translatedServiceName}
                              imgClassName="w-full aspect-service-other object-cover"
                            />
                            {index === 5 &&
                              serviceData?.other_images.length > 6 && (
                                <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center">
                                  <span className="text-md font-bold text-white">
                                    +{serviceData?.other_images.length - 6}{" "}
                                    {t("more")}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                  </div>
                  {isLightboxOpen && (
                    <Lightbox
                      isLightboxOpen={isLightboxOpen}
                      images={serviceData.other_images}
                      initialIndex={currentImageIndex}
                      onClose={closeLightbox}
                    />
                  )}
                </div>
              )}

              {/* Brochure/Files */}
              {serviceData?.files?.length > 0 && (
                <div className="flex flex-col">
                  <span className="text-lg lg:text-2xl font-extrabold my-7">
                    {t("brochureAndFiles")}{" "}
                  </span>
                  <div className="flex flex-row flex-wrap items-center gap-4">
                    {serviceData?.files?.map((file, index) => {
                      const fileName = file
                        .split("/")
                        .pop()
                        .split(".")
                        .slice(0, -1)
                        .join(".");

                      return (
                        <a
                          key={index}
                          href={file}
                          download
                          target="_blank"
                          className="relative flex items-center border rounded-[8px] p-4 gap-4 overflow-hidden group cursor-pointer no-underline"
                        >
                          <div className="flex items-center gap-4 transition-opacity duration-300 group-hover:opacity-0">
                            <IoIosDocument
                              size={22}
                              className="primary_text_color"
                            />
                            <span className="text-base font-medium">
                              {fileName}
                            </span>
                          </div>

                          <div className="absolute inset-0 primary_bg_color flex justify-center items-center text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {t("download")}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FAQs Section */}
              {translatedFaqs?.length > 0 && (
                <>
                  <div className="flex flex-col">
                    <span className="text-lg lg:text-2xl font-extrabold my-7">
                      {t("faqs")}{" "}
                    </span>
                    <div className="faqs w-full flex flex-col gap-4">
                      {translatedFaqs?.map((faq, index) => (
                        <FaqAccordion faq={faq} key={index} />
                      ))}
                    </div>
                  </div>
                  <hr className="text-gray-300 my-7" />
                </>
              )}

              {/* Reviews Section */}
              <div className="service-reviews mt-4">
                <span className="text-2xl font-semibold">
                  {t("ratingAndReviews")}
                </span>
                <div className="grid grid-cols-12 border rounded-md mt-6 px-[18px] py-4 gap-4">
                  <div className="col-span-12 md:col-span-3">
                    <div className="flex flex-col items-center justify-center w-full h-full light_bg_color rounded-md px-4 py-6">
                      <span className="text-[28px] font-medium primary_text_color">
                        {rating}
                      </span>
                      <Rating rating={rating} />
                      <span className="mt-2 text-base description_color">
                        {totalRating} {t("ratings")}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-9">
                    {ratingData.map((item) => {
                      const progressPercentage =
                        totalRating > 0
                          ? Math.round((item.count / totalRating) * 100)
                          : 0;

                      return (
                        <div className="rating_progress mb-2" key={item.rating}>
                          <div className="flex gap-4 items-center">
                            <span>{item.rating}</span>
                            <Progress
                              value={progressPercentage}
                              className="progress flex-1 h-2 mx-2 rounded-lg"
                              style={{ fill: "#4caf50" }}
                            />
                            <span>{progressPercentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-8 mt-6">
                  {reviews.map((review) => (
                    <ProviderReviewCard
                      review={review}
                      key={review.id}
                      isLightboxOpen={isLightboxOpen}
                      currentImageIndex={currentImageIndex}
                      openLightbox={openLightbox}
                      closeLightbox={closeLightbox}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                <div className="flex items-center justify-center mt-6">
                  {isFetchingNextPage ? (
                    <button className="primary_bg_color primary_text_color py-3 px-8 rounded-xl">
                      <MiniLoader />
                    </button>
                  ) : (
                    hasNextPage && (
                      <button
                        onClick={handleLoadMoreReviews}
                        className="light_bg_color primary_text_color py-3 px-8 rounded-xl"
                        disabled={isFetchingNextPage}
                      >
                        {t("loadMore")}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-[60vh] flex items-center justify-center">
            <NoDataFound
              title={t("noServiceFound")}
              desc={t("noServiceFoundText")}
            />
          </div>
        )}
      </section>
      <ConfirmDialog
        open={isConflictDialogOpen}
        onOpenChange={setIsConflictDialogOpen}
        onConfirm={() => proceedAddToCart(pendingCartItem)}
        title={t("startNewCart")}
        description={
          t("cartConflictDescription")}
        confirmText={t("continue")}
        cancelText={t("cancel")}
      />
    </Layout>
  );
};

export default ProviderServiceDetails;
