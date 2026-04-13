import React, { useState } from "react";
import { X } from "lucide-react";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  selectCartItems,
  selectTotalItems,
  selectCartTotalPrice,
  clearCart,
  removeItemFromCart,
  selectCartProvider,
  setTaxValue,
} from "@/redux/reducers/cartSlice";
import { removeCartApi } from "@/api/apiRoutes";
import { MdClose } from "react-icons/md";
import { showPrice, useRTL } from "@/utils/Helper";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { toast } from "sonner";
import { useRouter } from "next/router";
import CustomImageTag from "../CustomImageTag";
import ConfirmDialog from "./ConfirmDialog";

const CartDropdown = ({ isVisible, onOpenChange }) => {
  const t = useTranslation();
  const isRtl = useRTL();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const currentCartProviderData = useSelector(selectCartProvider);
  const totalItems = useSelector(selectTotalItems);
  const totalPrice = useSelector(selectCartTotalPrice);
  const [showClearCartDialog, setShowClearCartDialog] = React.useState(false);

  const router = useRouter();

  const handleRemoveItem = async (itemId) => {
    try {
      // Remove the item completely from the cart
      const response = await removeCartApi({ itemId: itemId });
      if (response?.error === false) {
        dispatch(removeItemFromCart(itemId)); // Directly remove the item from Redux
        dispatch(setTaxValue(response?.data?.tax_value));
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      console.log(error);

    }
  };
  const handleClearCart = async () => {
    try {
      // Remove the item completely from the cart
      const response = await removeCartApi({
        provider_id: currentCartProviderData?.provider_id,
      });
      if (response?.error === false) {
        dispatch(clearCart());
        dispatch(setTaxValue(response?.data?.tax_value));
        setShowClearCartDialog(false);
        toast.success(t("cartClearedSuccessfully"));
      } else {
        toast.error(response?.message);
        setShowClearCartDialog(false);
      }
    } catch (error) {
      console.log(error);
      setShowClearCartDialog(false);
    }
  };

  // Format price to handle both string and number inputs
  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return Number.isFinite(numPrice) ? numPrice.toFixed(2) : "0.00";
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    router.push("/cart");
  };

  return (
    <>
      <DropdownMenu open={isVisible} onOpenChange={onOpenChange} modal={false}>
        <DropdownMenuTrigger asChild>
          <div
            className="text-white primary_bg_color h-[36px] w-[36px] rounded-[8px] p-2 flex items-center justify-center relative cursor-pointer"
            onMouseEnter={() => onOpenChange(true)}
            onMouseLeave={() => onOpenChange(false)}
          >
            <FaShoppingCart
              size={18}
              className={`${isRtl ? "transform scale-x-[-1]" : ""}`}
            />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {totalItems}
              </span>
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          key={isRtl}
          className={`w-80 p-4 cart-dropdown ${isRtl ? 'right-auto left-0' : 'left-auto right-0'}`}
          align="start"
          sideOffset={5}
          onMouseEnter={() => onOpenChange(true)}
          onMouseLeave={() => onOpenChange(false)}
          forceMount
        >
          <DropdownMenuLabel className="text-lg font-semibold">
            {t("serviceInCart")}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="max-h-64 overflow-y-auto py-2">
            {cartItems.length === 0 ? (
              <div className="text-center py-4 description_color">
                {t("yourCartEmpty")}
              </div>
            ) : (
              cartItems.map((item) => {
                const translatedTitle = item?.translated_title ? item?.translated_title : item?.title;
                return (
                  <DropdownMenuItem
                    key={item?.id}
                    className="flex items-center justify-between p-2"
                  >
                    <div className="flex items-center gap-2">
                      <CustomImageTag
                        src={item?.image_of_the_service}
                        alt={item?.title}
                        className="w-12 aspect-square rounded-md object-cover min-w-12"
                        imgClassName="rounded-md"
                      />
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{translatedTitle}</p>
                        <p className="text-sm description_color">
                          {showPrice(
                            formatPrice(
                              item?.discounted_price > 0
                                ? item?.price_with_tax
                                : item?.original_price_with_tax || 0 // Fallback to 0 if price is undefined
                            )
                          )}{" "}
                          x{item?.qty || 0}{" "}
                          {/* Fallback to 0 if qty is undefined */}
                        </p>
                      </div>
                    </div>
                    <button
                      className=""
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveItem(item?.id); // Remove the entire item
                      }}
                    >
                      <MdClose size={16} />
                    </button>
                  </DropdownMenuItem>
                )
              })
            )}
          </div>

          {cartItems.length > 0 && (
            <>
              <DropdownMenuSeparator />

              <div className="pt-2">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">{t("subTotal")}</span>
                  <span className="font-semibold">{showPrice(totalPrice)}</span>
                </div>

                <div className="flex justify-between gap-2">
                  <button
                    className="w-1/2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 hover:text-black transition-all duration-300"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowClearCartDialog(true);
                    }}
                  >
                    {t("clearCart")}
                  </button>
                  <button
                    onClick={(e) => { handleCheckout(e) }}
                    className="w-1/2 flex items-center justify-center cursor-pointer px-4 py-2 text-sm transition-all duration-300 background_color rounded-md hover:primary_bg_color hover:text-white"
                  >
                    {t("checkout")}
                  </button>
                </div>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showClearCartDialog}
        onOpenChange={setShowClearCartDialog}
        onConfirm={handleClearCart}
        title="clearCart"
        description="areYouSureYouWantToClearCart"
        confirmText="confirm"
        cancelText="cancel"
        variant="destructive"
      />
    </>
  );
};

export default CartDropdown;
