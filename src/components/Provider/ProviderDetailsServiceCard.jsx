"use client";
import { ManageCartApi, removeCartApi } from "@/api/apiRoutes";
import {
  removeFromCart,
  setCartData,
  selectCartProvider,
  setTaxValue,
} from "@/redux/reducers/cartSlice";
import ConfirmDialog from "../ReUseableComponents/Dialogs/ConfirmDialog";
import { useIsLogin, showPrice, useRTL } from "@/utils/Helper";
import { useEffect, useState } from "react";
import {
  FaClock,
  FaMinus,
  FaPlus,
  FaStar,
  FaTrash,
  FaUserFriends,
} from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { useTranslation } from "../Layout/TranslationContext";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import CustomLink from "../ReUseableComponents/CustomLink";
import useIsMobile from "@/hooks/isMobile";
import { useRouter } from "next/navigation";
import { openLoginModal } from "@/redux/reducers/helperSlice";

const ProviderDetailsServiceCard = ({ slug, provider, data, compnayName, isDisabled }) => {

  const router = useRouter();
  const t = useTranslation();
  const isLoggedIn = useIsLogin(); // Reactive hook - automatically updates when login state changes
  const dispatch = useDispatch();
  const isRTL = useRTL();
  const isMobile = useIsMobile();

  // Get initial quantities from Redux
  const cart = useSelector((state) => state.cart.items);
  const [qty, setQuantities] = useState({});
  const [animationClass, setAnimationClasses] = useState({});

  // Sync state with Redux on component mount
  useEffect(() => {
    const initialQuantities = {};
    cart?.forEach((item) => {
      if (item.id && item.qty) {
        initialQuantities[item.id] = item.qty;
      }
    });
    setQuantities(initialQuantities);
  }, [cart]);

  const handleAddQuantity = async (id) => {
    try {
      const currentQuantity = parseInt(qty[id], 10);

      // Check if the current quantity is greater than the maximum allowed
      if (currentQuantity >= data?.max_quantity_allowed) {
        toast.error(t("maxQtyReached"));
        return;
      }

      const newQuantity = currentQuantity + 1;

      // Call API to update the cart
      const response = await ManageCartApi({
        id,
        qty: newQuantity,
      });

      if (response.error === false) {
        // Update local state
        setAnimationClasses((prev) => ({ ...prev, [id]: "slide-in" }));
        setQuantities((prevQuantities) => ({
          ...prevQuantities,
          [id]: newQuantity,
        }));

        // Update Redux state
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

        // Reset animation
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
        // If quantity is greater than 1, decrement it
        const response = await ManageCartApi({ id, qty: currentQty - 1 });

        if (response.error === false) {
          // Update local state
          setAnimationClasses((prev) => ({ ...prev, [id]: "slide-out" }));
          setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [id]: currentQty - 1,
          }));

          // Update Redux state
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
          // Reset animation
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
        // If quantity is 1, remove the item from the cart
        const response = await removeCartApi({ itemId: id });

        if (response.error === false) {
          // Update local state
          const updatedQuantities = { ...qty };
          delete updatedQuantities[id];
          setQuantities(updatedQuantities);
          dispatch(setTaxValue(response?.data?.tax_value));

          // Update Redux state
          dispatch(removeFromCart(id));
          toast.success(t("serviceRemovedSuccessFullyFromCart"));
        } else {
          toast.error(response?.message);
        }
      }
    } catch (error) {
      console.error("Error while removing quantity:", error);
      toast.error("Failed to update cart.");
    }
  };

  const currentCartProvider = useSelector(selectCartProvider);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);

  const proceedAddToCart = async (itemToAdd) => {
    try {
      // Call API to add the item to the cart
      const response = await ManageCartApi({ id: itemToAdd.id, qty: 1 });

      if (response.error === false) {
        // Update local state
        setQuantities((prev) => ({ ...prev, [itemToAdd.id]: 1 }));

        // Update Redux state
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
    // This is what gets stored as provider_id in the cart
    const itemProviderId = data?.user_id || data?.partner_id || provider?.id;

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

  const translatedServiceName = data?.translated_title
    ? data?.translated_title
    : data?.title;
  const translatedServiceDescription = data?.translated_description
    ? data?.translated_description
    : data?.description;

  return (
    <>
      <div
        onClick={() => {
          if (isMobile) {
            router.push(`/provider-details/${slug}/${data?.slug}`);
          }
        }}
        className={`flex flex-row items-center px-4 py-4 gap-2 card_bg border rounded-lg shadow-sm
      ${isMobile ? "cursor-pointer" : ""}
    `}
      >
        <div className="relative ">
          <CustomImageTag
            src={data?.image_of_the_service}
            alt={translatedServiceName}
            className="object-cover w-24 sm:w-32 aspect-service rounded-lg"
            imgClassName="rounded-lg"
          />
        </div>

        <div className={`flex-1 w-full ${isRTL ? "md:mr-4" : "md:ml-4"}`}>
          <h2
            className={`text-base sm:text-lg font-semibold line-clamp-1 ${isRTL ? "text-right" : "text-left"
              }`}
          >
            {translatedServiceName}
          </h2>
          <p
            className={`text-xs sm:text-sm description_color line-clamp-2 ${isRTL ? "text-right" : "text-left"
              }`}
          >
            {translatedServiceDescription}
          </p>
          <div
            className={`flex flex-wrap ${isRTL ? "items-end" : "items-start"
              } justify-between mt-2`}
          >
            <div
              className={`flex flex-col ${isRTL ? "items-end" : "items-start"
                } text-xs sm:text-sm description_color space-y-2 w-full`}
            >
              <div
                className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""
                  }`}
              >
                <span
                  className={`flex items-center ${isRTL ? "flex-row-reverse" : ""
                    }`}
                >
                  <FaUserFriends
                    className={`${isRTL ? "ml-1" : "mr-1"} primary_text_color`}
                  />
                  {data?.number_of_members_required}
                </span>
                <span
                  className={`flex items-center ${isRTL ? "flex-row-reverse" : ""
                    }`}
                >
                  <FaClock
                    className={`${isRTL ? "ml-1" : "mr-1"} primary_text_color`}
                  />
                  {data?.duration}
                </span>
                {data?.rating > 0 && (
                  <div
                    className={`flex items-center ${isRTL ? "flex-row-reverse" : ""
                      }`}
                  >
                    <FaStar className="rating_icon_color" />
                    <span
                      className={`${isRTL ? "mr-1" : "ml-1"} text-sm font-bold`}
                    >
                      {parseFloat(data?.rating).toFixed(1)}{" "}
                      {/* Convert to number and display 2 decimal places */}
                    </span>
                  </div>
                )}
              </div>
              <div
                className={`flex flex-col justify-between items-center w-full gap-2 ${isRTL ? "md:flex-row-reverse" : "md:flex-row"
                  }`}
              >
                <div
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between w-full xl:w-fit gap-2 ${isRTL ? "flex-row-reverse" : ""
                    }`}
                >
                  {data?.discounted_price > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-bold">
                        {showPrice(data?.price_with_tax)}
                      </span>
                      <span className="text-xs sm:text-sm description_color line-through">
                        {showPrice(data?.original_price_with_tax)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base sm:text-lg font-bold">
                      {showPrice(data?.price_with_tax)}
                    </span>
                  )}
                  {!isMobile ? (
                    <CustomLink
                      href={`/provider-details/${slug}/${data?.slug}`}
                      title={`${compnayName}/${data?.slug}`}
                    >
                      <span
                        className={`group text-base font-normal primary_text_color transition-all duration-500 w-full flex items-center ${isRTL ? "flex-row-reverse" : ""
                          } justify-between md:justify-start gap-2`}
                      >
                        <span className="group-hover:underline">
                          {t("viewMore")}
                        </span>
                        <span className="relative hidden md:inline-block overflow-hidden">
                          <FaArrowRightLong
                            size={16}
                            className={`${isRTL ? "rotate-180" : ""
                              } translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-transform duration-300 ease-out`}
                          />
                        </span>
                      </span>
                    </CustomLink>
                  ) : data?.id && qty[data.id] > 0 ? (
                    <button className="px-3 py-2 w-full sm:w-fit text-xs font-medium light_bg_color primary_text_color rounded-md overflow-hidden">
                      <span
                        className={`flex items-center justify-between gap-6 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        {qty[data.id] > 1 ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveQuantity(data.id);
                            }}
                          >
                            <FaMinus />
                          </span>
                        ) : (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(data.id);
                            }}
                          >
                            <FaTrash size={16} />
                          </span>
                        )}
                        <span
                          className={`relative ${animationClass[data.id]
                            } transition-transform duration-300`}
                        >
                          {qty[data.id]}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddQuantity(data.id);
                          }}
                        >
                          <FaPlus />
                        </span>
                      </span>
                    </button>
                  ) : (
                    <button
                      className="sm:w-fit w-full px-3 py-2 text-xs font-medium light_bg_color primary_text_color rounded-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(e, data);
                      }}
                      disabled={isDisabled}
                    >
                      {t("addToCart")}
                    </button>
                  )}
                </div>

                {!isMobile ? (
                  data?.id && qty[data.id] > 0 ? (
                    <button className="px-4 py-2 mt-2 text-xs sm:text-sm font-medium light_bg_color primary_text_color rounded-md overflow-hidden w-full xl:w-fit">
                      <span
                        className={`flex items-center justify-between gap-6 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        {qty[data.id] > 1 ? (
                          <span onClick={() => handleRemoveQuantity(data.id)}>
                            <FaMinus />
                          </span>
                        ) : (
                          <span onClick={() => handleRemoveItem(data.id)}>
                            <FaTrash size={16} />
                          </span>
                        )}
                        <span
                          className={`relative ${animationClass[data.id]
                            } transition-transform duration-300`}
                        >
                          {qty[data.id]}
                        </span>
                        <span onClick={() => handleAddQuantity(data.id)}>
                          <FaPlus />
                        </span>
                      </span>
                    </button>
                  ) : (
                    <button
                      className="w-full xl:w-fit px-4 py-2 mt-2 text-xs sm:text-sm font-medium light_bg_color primary_text_color rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => handleAddToCart(e, data)}
                      disabled={isDisabled}
                    >
                      {t("addToCart")}
                    </button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
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
    </>
  );
};

export default ProviderDetailsServiceCard;
