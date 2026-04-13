/**
 * Checkout Helpers
 * Shared constants and pure utility functions for the checkout flow.
 */
import dayjs from "dayjs";

export const PENDING_PAYMENT_KEY = "edemand_pending_payment";

/** Read a pending redirect-based payment from localStorage (safe). */
export function getPendingPayment() {
    try {
        const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/** Persist a pending redirect-based payment to localStorage (safe). */
export function setPendingPayment(orderId, method) {
    try {
        localStorage.setItem(
            PENDING_PAYMENT_KEY,
            JSON.stringify({ orderId, method, ts: Date.now() })
        );
    } catch {
        // Ignore storage errors
    }
}

/** Remove the pending payment entry from localStorage (safe). */
export function clearPendingPayment() {
    try {
        localStorage.removeItem(PENDING_PAYMENT_KEY);
    } catch {
        // Ignore storage errors
    }
}

/**
 * Build the common payload passed to `placeOrderApi`.
 * All payment handlers share an identical shape — keep it in one place.
 */
export function buildOrderPayload(
    { dilveryDetails, appliedCoupon, isCustomJob, customJobData }
) {
    const {
        dilevryPymentMethod,
        dilveryDate,
        dilveryTime,
        dilveryAddressType,
        dilevryLocation,
        dilveryNote,
        reOrderId,
    } = dilveryDetails;

    // Format date to YYYY-MM-DD — the API field `date_of_service` requires this exact format.
    // dilveryDate may arrive as a full ISO string or a Date object from Redux.
    const formattedDate = dilveryDate
        ? dayjs(dilveryDate).format("YYYY-MM-DD")
        : "";

    return {
        method: dilevryPymentMethod,
        date: formattedDate,
        time: dilveryTime,
        addressId: dilveryAddressType === "home" ? dilevryLocation?.id : "",
        at_store: dilveryAddressType === "store" ? 1 : "",
        order_note: dilveryNote || "",
        promo_code_id: appliedCoupon?.id || "",
        custom_job_request_id: isCustomJob ? customJobData?.custom_job_request_id : "",
        bidder_id: isCustomJob ? customJobData?.providerId : "",
        order_id: reOrderId || "",
    };
}

/**
 * Given the cart provider data, tax config, promo discount,
 * visiting charges eligibility and tax value — compute the final payable amount.
 */
export function computeFinalAmount({
    cartProvider,
    showTax,
    taxValue,
    promocodeDiscount,
    isHomeDelivery,
}) {
    const subtotalRaw = showTax
        ? (cartProvider?.sub_total_without_tax ?? cartProvider?.sub_total)
        : cartProvider?.sub_total;

    const subTotal = Number(String(subtotalRaw || 0));
    const discount = Number(promocodeDiscount) || 0;
    const tax = showTax ? (Number(taxValue) || 0) : 0;
    const visitingCharges = isHomeDelivery
        ? Number(String(cartProvider?.visiting_charges || 0))
        : 0;

    return subTotal - discount + tax + visitingCharges;
}

/**
 * Determine whether a payment method entry should be considered enabled.
 * The backend can return status as a string or number.
 */
export function isMethodEnabled(status) {
    return status === "enable" || status === 1 || status === "1";
}

/**
 * Safely extract a displayable error string from an API `message` field.
 * The backend sometimes returns an object like { date_of_service: "..." }
 * instead of a plain string. Passing an object to toast.error() crashes React.
 *
 * @param {string|object|undefined} message - Raw `message` from the API response.
 * @param {string} [fallback]               - Fallback text when message is empty.
 * @returns {string}
 */
export function extractErrorMessage(message, fallback = "Something went wrong.") {
    if (!message) return fallback;
    if (typeof message === "string") return message;
    if (typeof message === "object") {
        // Join all field-level validation errors into one readable string
        return Object.values(message).flat().join(" ") || fallback;
    }
    return String(message) || fallback;
}
