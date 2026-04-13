"use client";
import React from "react";
import { useSelector } from "react-redux";

import stripe from "../../assets/stripe.png";
import paypal from "../../assets/paypal.png";
import paystack from "../../assets/paystack.png";
import flutterwave from "../../assets/flutterwave.png";
import razorpay from "../../assets/razorpay.png";
import xendit from "../../assets/xendit.png";
import cod from "../../assets/cod.png";
import card from "../../assets/card.png";
import cashfree from "../../assets/cashfree.png";

import Layout from "../Layout/Layout";
import BreadCrumb from "../ReUseableComponents/BreadCrumb";
import SelectDateAndTimeDrawer from "../ReUseableComponents/Drawers/SelectDateAndTimeDrawer";
import AddressDrawer from "../ReUseableComponents/Drawers/AddressDrawer";
import OfferModal from "../ReUseableComponents/Offer/OfferModal";
import StripePayment from "./PaymentGateways/StripePayment";
import withAuth from "../Layout/withAuth";
import { useTranslation } from "../Layout/TranslationContext";
import { loadStripeApiKey } from "@/utils/Helper";
import { loadStripe } from "@stripe/stripe-js";
import { useCheckoutLogic } from "./useCheckoutLogic";
import { selectCustomJobData } from "@/redux/reducers/cartSlice";

// Extracted sub-components
import ServiceTypeSelector from "./components/ServiceTypeSelector";
import AddressSection from "./components/AddressSection";
import ScheduleSection from "./components/ScheduleSection";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
import OffersSection from "./components/OffersSection";
import OrderSummary from "./components/OrderSummary";

// ---------------------------------------------------------------------------
// Module-level constants
// ---------------------------------------------------------------------------

// Stripe is initialised once at module level (intentional — avoids recreation on re-render)
const stripePromise = loadStripe(loadStripeApiKey());

/** Map of payment method type → imported asset */
const PAYMENT_METHOD_ICONS = {
  stripe,
  paypal,
  paystack,
  flutterwave,
  razorpay,
  xendit,
  cashfree,
  cod,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const Checkout = () => {
  const t = useTranslation();
  const customJobData = useSelector(selectCustomJobData);

  const {
    // State
    serviceType,
    paymentOption,
    note,
    setNote,
    activeNotes,
    scheduleDrawerOpen,
    setScheduleDrawerOpen,
    addressDrawerOpen,
    setAddressDrawerOpen,
    defaultAddress,
    setDefaultAddress,
    addresses,
    setAddresses,
    offers,
    offersModalOpen,
    setOffersModalOpen,
    isProcessingCheckout,
    clientKey,
    orderID,
    stripeModalOpen,
    setStripeModalOpen,
    // Derived
    amount,
    enabledPaymentMethods,
    onlinePaymentMethodsCount,
    availableOnHome,
    availableOnStore,
    isCustomJob,
    isRepayment,
    showTax,
    taxValue,
    promocodeDiscount,
    appliedCoupon,
    currentCartProviderData,
    dilveryDetails,
    calculateFinalAmount,
    // Handlers
    handleServiceType,
    handleActiveNotes,
    handleSaveNotes,
    handleClearNotes,
    handlePaymentOption,
    handleApply,
    handleRemove,
    handleCheckout,
  } = useCheckoutLogic();

  const hasAppliedCoupon = appliedCoupon && Object.keys(appliedCoupon).length > 0;

  return (
    <Layout>
      <BreadCrumb
        firstEle={t("cart")}
        firstEleLink="/cart"
        secEle={t("checkout")}
        SecEleLink="/checkout"
      />

      <section className="check-out my-12 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left Column ─────────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-8">
            <span className="text-3xl font-semibold">{t("checkout")}</span>

            <div className="mt-6 border rounded-[18px] p-6">

              {/* Service Type */}
              <ServiceTypeSelector
                availableOnHome={availableOnHome}
                availableOnStore={availableOnStore}
                serviceType={serviceType}
                onSelect={handleServiceType}
              />

              {/* Address (home delivery only) */}
              {serviceType === "home" && (
                <AddressSection
                  defaultAddress={defaultAddress}
                  addresses={addresses}
                  onOpenDrawer={() => setAddressDrawerOpen(true)}
                />
              )}

              {/* Schedule + Notes */}
              <ScheduleSection
                dilveryDetails={dilveryDetails}
                note={note}
                setNote={setNote}
                activeNotes={activeNotes}
                onOpenScheduleDrawer={() => setScheduleDrawerOpen(true)}
                onToggleNotes={handleActiveNotes}
                onSaveNotes={handleSaveNotes}
                onClearNotes={handleClearNotes}
              />

              {/* Payment Methods */}
              <PaymentMethodSelector
                enabledMethods={enabledPaymentMethods}
                onlineCount={onlinePaymentMethodsCount}
                paymentOption={paymentOption}
                icons={PAYMENT_METHOD_ICONS}
                cardIcon={card}
                codIcon={cod}
                onSelect={handlePaymentOption}
                t={t}
                noMethodsLabel={t("noPaymentMethodsAvailable")}
              />
            </div>
          </div>

          {/* ── Right Column (Summary) ────────────────────────────── */}
          <div className="col-span-12 lg:col-span-4">
            <span className="text-3xl font-semibold">{t("summery")}</span>

            {/* Promo / Offers */}
            <OffersSection
              isCustomJob={isCustomJob}
              offers={offers}
              appliedCoupon={appliedCoupon}
              hasAppliedCoupon={hasAppliedCoupon}
              onOpenOffersModal={() => setOffersModalOpen(true)}
              onApply={handleApply}
              onRemove={handleRemove}
            />

            {/* Price Breakdown + Checkout Button */}
            <OrderSummary
              isCustomJob={isCustomJob}
              showTax={showTax}
              taxValue={taxValue}
              promocodeDiscount={promocodeDiscount}
              serviceType={serviceType}
              currentCartProviderData={currentCartProviderData}
              calculateFinalAmount={calculateFinalAmount}
              isProcessingCheckout={isProcessingCheckout}
              paymentOption={paymentOption}
              isRepayment={isRepayment}
              onCheckout={handleCheckout}
              t={t}
            />
          </div>
        </div>
      </section>

      {/* ── Drawers & Modals ─────────────────────────────────────────── */}
      {scheduleDrawerOpen && (
        <SelectDateAndTimeDrawer
          dilveryDetails={dilveryDetails}
          open={scheduleDrawerOpen}
          providerId={currentCartProviderData?.provider_id}
          customJobId={customJobData?.custom_job_request_id}
          onClose={() => setScheduleDrawerOpen(false)}
        />
      )}

      {addressDrawerOpen && (
        <AddressDrawer
          addresses={addresses}
          setAddresses={setAddresses}
          open={addressDrawerOpen}
          onClose={() => setAddressDrawerOpen(false)}
          defaultAddress={defaultAddress}
          setDefaultAddress={setDefaultAddress}
          onUpdateAddress={() => { }}
        />
      )}

      {offersModalOpen && (
        <OfferModal
          offers={offers}
          open={offersModalOpen}
          close={() => setOffersModalOpen(false)}
          handleApply={handleApply}
          handleRemove={handleRemove}
          isApplied={(offer) => appliedCoupon?.id === offer.id}
        />
      )}

      {dilveryDetails?.dilevryPymentMethod === "stripe" && (
        <StripePayment
          t={t}
          clientKey={clientKey}
          amount={amount}
          orderID={orderID}
          open={stripeModalOpen}
          setOpen={setStripeModalOpen}
          setIsProcessingCheckout={() => { }}
        />
      )}
    </Layout>
  );
};

export default withAuth(Checkout);
