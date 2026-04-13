import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePaymentForm from "./StripePaymentForm"; // Import the StripePaymentForm component
import { loadStripeApiKey } from "@/utils/Helper";
import { IoCloseCircle } from "react-icons/io5";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { addTransactionsApi } from "@/api/apiRoutes";
import { toast } from "sonner";

const stripeLoadKey = loadStripeApiKey();
const stripePromise = loadStripe(stripeLoadKey);

const StripePayment = ({ clientKey, amount, orderID, open, setOpen, t, isAdditionalCharge, setIsProcessingCheckout }) => {
  const options = {
    clientSecret: clientKey,
    appearance: {
      theme: "stripe",
    },
  };

  const handleClose = async () => {
    // Handle failed payment
    const response = await addTransactionsApi({
      order_id: orderID,
      status: "cancelled",
      is_additional_charge: isAdditionalCharge ? 1 : "",
      payment_method: "stripe"
    });
    if (response.error === false) {
      setOpen(false); // Close the modal
      setIsProcessingCheckout(false);
    } else {
      toast.error(response.message || "Failed to update transaction status.");
      setIsProcessingCheckout(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="card_bg rounded-lg shadow-lg p-6 w-full max-w-6xl">
        <div className="w-full flex items-center justify-between">
          <span>{t("pay_with_stripe")}</span>
          <button onClick={handleClose}>
            <IoCloseCircle size={24} />
          </button>
        </div>
        {clientKey && (
          <Elements stripe={stripePromise} options={options}>
            <StripePaymentForm
              amount={amount}
              orderID={orderID}
              open={open}
              setOpen={setOpen}
              t={t}
              isAdditionalCharge={isAdditionalCharge}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default StripePayment;
