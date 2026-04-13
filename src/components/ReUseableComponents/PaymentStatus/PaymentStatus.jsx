"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Lottie from "lottie-react";
import successAnimation from "../../../../public/animations/success.json";
import failedAnimation from "../../../../public/animations/failure.json";
import pendingAnimation from "../../../../public/animations/pending.json";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, clearCheckoutData } from "@/redux/reducers/cartSlice";
import { clearReorder } from "@/redux/reducers/reorderSlice";
import { trackPaymentComplete } from "@/redux/reducers/paymentSlice";

const PaymentStatus = () => {
  const t = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { status, payment_status, order_id, st } = router.query;
  const isReorderMode = useSelector(state => state.reorder.isReOrder);
  const [loopCount, setLoopCount] = useState(0);

  // Helper function to normalize and check payment status
  // Handles arrays (when duplicate query params exist), case-insensitive matching, and multiple success indicators
  const normalizeStatus = (value) => {
    if (!value) return null;
    // Handle array case (duplicate query parameters)
    const normalized = Array.isArray(value) ? value[value.length - 1] : value;
    return String(normalized).toLowerCase().trim();
  };

  // Check multiple success indicators from PayPal and other payment gateways
  // PayPal sends: payment_status=success, payment_status=Completed, st=Completed
  const normalizedStatus = normalizeStatus(status);
  const normalizedPaymentStatus = normalizeStatus(payment_status);
  const normalizedSt = normalizeStatus(st);

  // Success conditions: check all possible success indicators
  const isSuccess =
    normalizedStatus === "successful" ||
    normalizedStatus === "success" ||
    normalizedPaymentStatus === 'completed' ||
    normalizedPaymentStatus === 'success' ||
    normalizedSt === 'completed' ||
    normalizedSt === 'success';

  // Pending conditions
  const isPending =
    normalizedStatus === "pending" ||
    normalizedPaymentStatus === 'pending' ||
    normalizedSt === 'pending';

  // Clear any pending redirect-based payment flag left on Checkout page
  useEffect(() => {
    try {
      localStorage.removeItem('edemand_pending_payment');
    } catch (_) { }
  }, []);

  // Handle back button press - redirect to home on success or pending
  useEffect(() => {
    if (isSuccess || isPending) {
      window.history.pushState({ paymentStatusPage: true }, '');

      const handleBackButton = () => {
        router.push('/');
        // Note: data is also cleared on mount via the effect above
        dispatch(clearCheckoutData());
        dispatch(trackPaymentComplete());
        if (isReorderMode) {
          dispatch(clearReorder());
        } else {
          dispatch(clearCart());
        }
      };

      window.addEventListener('popstate', handleBackButton);

      return () => {
        window.removeEventListener('popstate', handleBackButton);
      };
    }
  }, [dispatch, isReorderMode, router, isSuccess, isPending]);

  // Automatically clear data as soon as success or pending status is confirmed
  useEffect(() => {
    if (isSuccess || isPending) {
      dispatch(clearCheckoutData());
      dispatch(trackPaymentComplete());
      if (isReorderMode) {
        dispatch(clearReorder());
      } else {
        dispatch(clearCart());
      }
    }
  }, [isSuccess, isPending, dispatch, isReorderMode]);

  // Handle navigation to home - clear data on success or pending
  const handleGoHome = () => {
    if (isSuccess || isPending) {
      dispatch(clearCheckoutData());
      dispatch(trackPaymentComplete());
      if (isReorderMode) {
        dispatch(clearReorder());
      } else {
        dispatch(clearCart());
      }
    }
    router.push("/");
  };

  // Handle navigation to order details - clear data on success or pending
  const handleGoToOrderDetails = () => {
    if (order_id) {
      if (isSuccess || isPending) {
        dispatch(clearCheckoutData());
        dispatch(trackPaymentComplete());
        if (isReorderMode) {
          dispatch(clearReorder());
        } else {
          dispatch(clearCart());
        }
      }
      router.push(`/booking/inv-${order_id}`);
    }
  };

  // Handle re-payment attempt
  const handleRetryPayment = () => {
    router.push(`/checkout?isRepayment=1`);
  };

  // Helper to determine title
  const getStatusTitle = () => {
    if (isSuccess) return t("paymentSuccess");
    if (isPending) return t("paymentPending");
    return t("paymentFailed");
  };

  // Helper to determine description
  const getStatusDescription = () => {
    if (isSuccess) return t("paymentSuccessText");
    if (isPending) return t("paymentPendingText");
    return t("paymentFailedText");
  };

  // Helper to determine animation
  const getAnimation = () => {
    if (isSuccess) return successAnimation;
    if (isPending) return pendingAnimation;
    return failedAnimation;
  };

  return (
    <div className="flex items-center justify-center min-h-screen light_bg_color">
      <div className="card_bg p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Lottie
            animationData={getAnimation()}
            loop={loopCount < 1}
            onLoopComplete={() => setLoopCount((prev) => prev + 1)}
            style={{ width: 250, height: 250 }}
          />
        </div>

        <h1 className="text-2xl font-bold mb-4">
          {getStatusTitle()}
        </h1>

        <p className="description_color mb-8">
          {getStatusDescription()}
        </p>

        <div className="flex flex-col space-y-4">
          {/* Show retry payment button only on failure */}
          {!isSuccess && !isPending && (
            <button
              onClick={handleRetryPayment}
              className="w-full primary_bg_color p-3 rounded-lg text-white"
            >
              {t("retryPayment")}
            </button>
          )}

          <button
            onClick={handleGoToOrderDetails}
            className="w-full primary_bg_color p-3 rounded-lg text-white"
          >
            {t("viewBookingDetails")}
          </button>

          <button
            onClick={handleGoHome}
            className="w-full light_bg_color p-3 rounded-lg primary_text_color"
          >
            {t("goHome")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
