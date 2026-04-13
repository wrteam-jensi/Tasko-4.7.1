import React, { useState, useEffect } from "react";
import Layout from "../Layout/Layout";
import BreadCrumb from "../ReUseableComponents/BreadCrumb";
import CartItemCard from "./CartItemCard";
import CartSkeleton from "./CartSkeleton";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCartItems,
  selectCartProvider,
  selectTaxValue,
} from "@/redux/reducers/cartSlice";
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import { useRouter } from "next/router";
import { showPrice, useIsLogin } from "@/utils/Helper";
import { useTranslation } from "../Layout/TranslationContext";
import withAuth from "../Layout/withAuth";
import { clearReorder } from "@/redux/reducers/reorderSlice";
import { logClarityEvent } from "@/utils/clarityEvents";
import { CART_EVENTS } from "@/constants/clarityEventNames";
import { useCart } from "@/hooks/useCart";

const Cart = () => {
  const t = useTranslation();

  const router = useRouter();
  const dispatch = useDispatch();
  const isLoggedIn = useIsLogin();

  // Fetch cart data from API - this will update Redux automatically
  const { isLoading: isLoadingCart, isFetching: isFetchingCart } = useCart({
    enabled: isLoggedIn,
  });

  const cartItems = useSelector(selectCartItems);
  const currentCartProviderData = useSelector(selectCartProvider);
  const taxConfig = useSelector((state) => state?.settingsData?.settings?.system_tax_settings);
  const showTax = taxConfig?.show_on_checkout === 1 || taxConfig?.show_on_checkout === "1";
  const taxValue = useSelector(selectTaxValue);


  const handleCheckout = () => {
    dispatch(clearReorder());
    logClarityEvent(CART_EVENTS.CART_CHECKOUT_TAPPED, {
      cart_size: cartItems.length,
      provider_id: currentCartProviderData?.provider_id,
    });
    router.push("/checkout");
  };

  useEffect(() => {
    if (cartItems.length > 0) {
      logClarityEvent(CART_EVENTS.CART_VIEWED, {
        cart_size: cartItems.length,
        provider_id: currentCartProviderData?.provider_id,
      });
    }
  }, [cartItems.length, currentCartProviderData?.provider_id]);

  const translatedCompanyName = currentCartProviderData?.translated_company_name
    ? currentCartProviderData?.translated_company_name
    : currentCartProviderData?.company_name;

  return (
    <Layout>
      <BreadCrumb firstEle={t("cart")} firstEleLink="/cart" />
      <section className="cart-page my-12 container mx-auto ">
        {isLoadingCart || (isFetchingCart && cartItems.length === 0) ? (
          <CartSkeleton />
        ) : cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Services Section */}
            <div className="col-span-12 lg:col-span-8">
              <h2 className="text-2xl lg:text-3xl font-semibold">
                {translatedCompanyName} {""}{" "}
                {cartItems?.length === 1 ? t("service") : t("services")}
              </h2>
              <div className="cart_data mt-6 space-y-4">
                {cartItems.map((ele, index) => (
                  <div key={index}>
                    <CartItemCard data={ele} />
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <span className="text-3xl font-semibold">{t("summery")}</span>
              <div className="mt-6">
                {/* Charges Breakdown */}
                <div className="border light_bg_color p-5 rounded-xl">
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center text-base">
                      <span>{t("subTotal")}</span>
                      <span className="font-semibold">
                        {showTax
                          ? showPrice(currentCartProviderData?.sub_total_without_tax || currentCartProviderData?.sub_total)
                          : showPrice(currentCartProviderData?.sub_total)}
                      </span>
                    </div>
                    {showTax && taxValue !== "" && Number(taxValue) > 0 && (
                      <div className="flex justify-between items-center text-base">
                        <span>{t("tax")}</span>
                        <span className="font-semibold">
                          +{showPrice(Number(taxValue))}
                        </span>
                      </div>
                    )}
                  </div>
                  <hr className="border-gray-300 my-6" />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>{t("finalPrice")}</span>
                    <span>
                      {showPrice(currentCartProviderData?.overall_amount)}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full primary_bg_color mt-6 text-white py-2 rounded-xl font-medium text-sm transition hover:bg-black"
                  >
                    {t("checkout")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1">
            <div className="w-full h-[60vh] flex items-center justify-center">
              <NoDataFound
                title={t("yourCartempty")}
                desc={t("yourCartemptyText")}
              />
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default withAuth(Cart);
