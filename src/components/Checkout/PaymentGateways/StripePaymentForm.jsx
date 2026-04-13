import React, { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { addTransactionsApi } from "@/api/apiRoutes";
import { selectReorderMode } from "@/redux/reducers/reorderSlice";

const StripePaymentForm = ({ orderID, open, setOpen, t, isAdditionalCharge }) => {

  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const isReorderMode = useSelector(selectReorderMode);

  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [isAddressReady, setIsAddressReady] = useState(false);

  const isFormReady = isPaymentReady && isAddressReady;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      console.error("Stripe has not loaded yet.");
      setLoading(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(`Payment failed: ${error.message}`);
        setLoading(false);

        // Handle failed payment
        const response = await addTransactionsApi({
          order_id: orderID,
          status: "cancelled",
          is_additional_charge: isAdditionalCharge ? 1 : "",
          payment_method: "stripe"
        });

        if (response.error === false) {
          setOpen(false); // Close the modal
          router.push(`/payment-status?order_id=${orderID}&status=failed`);
        } else {
          toast.error(
            response.message || "Failed to update transaction status."
          );
        }
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment Successful!");

        // Handle successful payment
        const response = await addTransactionsApi({
          order_id: orderID,
          status: "success",
          is_reorder: isReorderMode ? "1" : "",
          is_additional_charge: isAdditionalCharge ? 1 : "",
          payment_method: "stripe"
        });

        if (response.error === false) {
          setOpen(false); // Close the modal
          router.push(`/payment-status?order_id=${orderID}&status=successful`);
        } else {
          toast.error(
            response.message || "Failed to update transaction status."
          );
        }
      }
    } catch (error) {
      console.error("Error during payment confirmation:", error);
      toast.error("An error occurred during payment.");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Address Element */}
      <div className="mb-6">
        <AddressElement
          options={{
            mode: "billing", // Collect billing address
          }}
          onChange={(event) => {
            setIsAddressReady(event.complete);
          }}
        />
      </div>

      {/* Payment Element */}
      <div className="mb-6">
        <PaymentElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
          onChange={(event) => {
            setIsPaymentReady(event.complete);
          }}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || loading || !isFormReady}
        className={`w-full p-3 text-white mt-3 rounded-lg ${!stripe || loading || !isFormReady ? "bg-gray-400 cursor-not-allowed" : "primary_bg_color"}`}
      >
        {loading ? t("processing") : t("pay")}
      </button>
    </form>
  );
};

export default StripePaymentForm;
