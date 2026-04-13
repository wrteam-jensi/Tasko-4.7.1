"use client";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";
import { showPrice } from "@/utils/Helper";

/**
 * OrderSummary
 * Renders the right-column price breakdown card and the checkout action button.
 */
const OrderSummary = ({
    isCustomJob,
    showTax,
    taxValue,
    promocodeDiscount,
    serviceType,
    currentCartProviderData,
    calculateFinalAmount,
    isProcessingCheckout,
    paymentOption,
    isRepayment,
    onCheckout,
    t,
}) => {
    /** Resolve the sub-total value based on tax display config. */
    const subTotal = showTax
        ? currentCartProviderData?.sub_total_without_tax ?? currentCartProviderData?.sub_total
        : currentCartProviderData?.sub_total;

    const taxAmount = Number(taxValue);
    const discountAmount = Number(promocodeDiscount);
    const visitingCharges = Number(currentCartProviderData?.visiting_charges ?? 0);
    const showVisitingCharges = serviceType === "home" && visitingCharges > 0;

    /** Resolve checkout button label. */
    const buttonLabel = paymentOption === "cod"
        ? t("bookService")
        : isRepayment
            ? t("retryPayment")
            : t("makeOnlinePayment");

    return (
        <div className="border light_bg_color p-5 rounded-xl my-6">
            <div className="flex flex-col gap-6">
                {/* Sub-total */}
                <div className="flex justify-between items-center text-base">
                    <span>{isCustomJob ? t("customJobPrice") : t("subTotal")}</span>
                    <span className="font-semibold">{showPrice(subTotal)}</span>
                </div>

                {/* Tax */}
                {showTax && taxValue !== "" && taxAmount > 0 && (
                    <div className="flex justify-between items-center text-base">
                        <span>{t("tax")}</span>
                        <span className="font-semibold">+{showPrice(taxAmount)}</span>
                    </div>
                )}

                {/* Discount */}
                {!isCustomJob && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-base">
                        <span>{t("discount")}</span>
                        <span className="font-semibold">-{showPrice(discountAmount)}</span>
                    </div>
                )}

                {/* Visiting charges */}
                {showVisitingCharges && (
                    <div className="flex justify-between items-center text-base">
                        <span>{t("vistingCharges")}</span>
                        <span className="font-semibold">+{showPrice(visitingCharges)}</span>
                    </div>
                )}
            </div>

            <hr className="border-gray-300 my-6" />

            {/* Final price */}
            <div className="flex justify-between items-center text-lg font-bold">
                <span>{t("finalPrice")}</span>
                <span>{showPrice(calculateFinalAmount())}</span>
            </div>

            {/* Checkout button */}
            <button
                disabled={isProcessingCheckout}
                className={`w-full primary_bg_color mt-6 text-white py-2 rounded-xl font-medium text-sm transition hover:bg-black ${isProcessingCheckout ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                onClick={onCheckout}
            >
                {isProcessingCheckout ? (
                    <div className="flex items-center justify-center">
                        <MiniLoader color="white" />
                    </div>
                ) : (
                    buttonLabel
                )}
            </button>
        </div>
    );
};

export default OrderSummary;
