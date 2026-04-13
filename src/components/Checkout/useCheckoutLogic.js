"use client";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { load as loadCashfree } from "@cashfreepayments/cashfree-js";
import PaystackPop from "@paystack/inline-js";
import { useTranslation } from "@/components/Layout/TranslationContext";
import {
    clearCart,
    clearCheckoutData,
    setDilveryDetails,
    setPromocodeDiscount,
    selectCustomJobData,
    selectCartProvider,
    setAppliedCoupon,
    selectAppliedCoupon,
    selectTaxValue,
} from "@/redux/reducers/cartSlice";
import {
    selectReorderMode,
    clearReorder,
    setReorderMode,
} from "@/redux/reducers/reorderSlice";
import {
    addTransactionsApi,
    createCashfreeOrderApi,
    createRazorOrderApi,
    createStripePaymentIntentApi,
    getAddressApi,
    getPromoCodeApi,
    placeOrderApi,
    providerAvailableApi,
    validatePromocodeApi,
} from "@/api/apiRoutes";
import { logClarityEvent } from "@/utils/clarityEvents";
import { BOOKING_EVENTS, PAYMENT_EVENTS } from "@/constants/clarityEventNames";
import {
    buildOrderPayload,
    computeFinalAmount,
    getPendingPayment,
    setPendingPayment,
    clearPendingPayment,
    isMethodEnabled,
    extractErrorMessage,
} from "./helpers/checkoutHelpers";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCheckoutLogic() {
    const router = useRouter();
    const { isRepayment } = router.query;
    const dispatch = useDispatch();
    const t = useTranslation();

    // ── Redux selectors ──────────────────────────────────────────────────────
    const isReorderMode = useSelector(selectReorderMode);
    const reorderState = useSelector((state) => state.reorder);
    const currentCartProviderData = useSelector((state) =>
        isReorderMode ? reorderState.provider : selectCartProvider(state)
    );
    const dilveryDetails = useSelector((state) => state.cart.dilveryDetails);
    const settingsData = useSelector((state) => state?.settingsData);
    const userDetails = useSelector((state) => state?.userData?.data);
    const taxConfig = useSelector(
        (state) => state?.settingsData?.settings?.system_tax_settings
    );
    const promocodeDiscount = useSelector((state) => state.cart.promocode_discount);
    const taxValue = useSelector(selectTaxValue);
    const customJobData = useSelector(selectCustomJobData);
    const appliedCoupon = useSelector(selectAppliedCoupon);

    const userEmail = userDetails?.email;
    const paymentSettings = settingsData?.settings?.payment_gateways_settings;
    const showTax =
        taxConfig?.show_on_checkout === 1 || taxConfig?.show_on_checkout === "1";
    const isCustomJob = Boolean(customJobData?.custom_job_request_id);
    const availableOnHome = currentCartProviderData?.at_doorstep === "1";
    const availableOnStore = currentCartProviderData?.at_store === "1";
    const isPayLaterAllowed =
        Number(currentCartProviderData?.is_pay_later_allowed) === 1;
    const isPayOnlineAllowed =
        Number(currentCartProviderData?.is_online_payment_allowed) === 1;

    // ── Payment gateway credentials ──────────────────────────────────────────
    const razorpayKey = paymentSettings?.razorpay_key;
    const razorpayCurrencyCode = paymentSettings?.razorpay_currency;
    const paystackCurrencyCode = paymentSettings?.paystack_currency;

    // ── Local state ──────────────────────────────────────────────────────────
    const [serviceType, setServiceType] = useState(
        isReorderMode
            ? reorderState.provider?.dilveryAddressType
            : dilveryDetails?.dilveryAddressType || ""
    );
    const [paymentOption, setPaymentOption] = useState(
        isReorderMode
            ? reorderState.provider?.dilevryPymentMethod
            : dilveryDetails?.dilevryPymentMethod || ""
    );
    const [note, setNote] = useState(dilveryDetails?.dilveryNote || "");
    const [activeNotes, setActiveNotes] = useState(false);
    const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
    const [addressDrawerOpen, setAddressDrawerOpen] = useState(false);
    const [defaultAddress, setDefaultAddress] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [offers, setOffers] = useState([]);
    const [offersModalOpen, setOffersModalOpen] = useState(false);
    const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
    const [clientKey, setClientKey] = useState("");
    const [orderID, setOrderID] = useState(undefined);
    const [stripeModalOpen, setStripeModalOpen] = useState(false);

    // ── Derived ───────────────────────────────────────────────────────────────
    const amount = currentCartProviderData?.overall_amount;

    const paymentMethods = [
        {
            method: "Stripe",
            methodIcon: "stripe",
            methodType: "stripe",
            status: isPayOnlineAllowed ? paymentSettings?.stripe_status : "disable",
        },
        {
            method: "Paypal",
            methodIcon: "paypal",
            methodType: "paypal",
            status: isPayOnlineAllowed ? paymentSettings?.paypal_status : "disable",
        },
        {
            method: "Paystack",
            methodIcon: "paystack",
            methodType: "paystack",
            status: isPayOnlineAllowed ? paymentSettings?.paystack_status : "disable",
        },
        {
            method: "Razorpay",
            methodIcon: "razorpay",
            methodType: "razorpay",
            status: isPayOnlineAllowed
                ? paymentSettings?.razorpayApiStatus
                : "disable",
        },
        {
            method: "Flutterwave",
            methodIcon: "flutterwave",
            methodType: "flutterwave",
            status: isPayOnlineAllowed
                ? paymentSettings?.flutterwave_status
                : "disable",
        },
        {
            method: "Xendit",
            methodIcon: "xendit",
            methodType: "xendit",
            status: isPayOnlineAllowed ? paymentSettings?.xendit_status : "disable",
        },
        {
            method: "Cashfree",
            methodIcon: "cashfree",
            methodType: "cashfree",
            status: isPayOnlineAllowed ? paymentSettings?.cashfree_status : "disable",
        },
        {
            method: t("payOnService"),
            methodIcon: "cod",
            methodType: "cod",
            status: isPayLaterAllowed ? paymentSettings?.cod_setting : "disable",
        },
    ];

    const enabledPaymentMethods = paymentMethods.filter((m) => isMethodEnabled(m.status));
    const onlinePaymentMethodsCount = enabledPaymentMethods.filter(
        (m) => m.methodType !== "cod"
    ).length;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const calculateFinalAmount = useCallback(
        () =>
            computeFinalAmount({
                cartProvider: currentCartProviderData,
                showTax,
                taxValue,
                promocodeDiscount,
                isHomeDelivery: serviceType === "home",
            }),
        [currentCartProviderData, showTax, taxValue, promocodeDiscount, serviceType]
    );

    const buildPayload = useCallback(
        (overrideMethod) => {
            const payload = buildOrderPayload({
                dilveryDetails,
                appliedCoupon,
                isCustomJob,
                customJobData,
            });
            if (overrideMethod) payload.method = overrideMethod;
            return payload;
        },
        [dilveryDetails, appliedCoupon, isCustomJob, customJobData]
    );

    const markTransactionFailed = useCallback(
        (orderId) =>
            addTransactionsApi({
                order_id: orderId,
                status: "failed",
                is_reorder: isReorderMode ? "1" : "",
            }).catch(() => { }),
        [isReorderMode]
    );

    const navigatePaymentFailed = useCallback(
        (orderId) => {
            setIsProcessingCheckout(false);
            router.push(`/payment-status?order_id=${orderId}&status=failed`);
        },
        [router]
    );

    // ── Effects ───────────────────────────────────────────────────────────────

    // Recovery: pending redirect payment on mount
    useEffect(() => {
        const pending = getPendingPayment();
        if (!pending?.orderId) return;
        clearPendingPayment();
        markTransactionFailed(pending.orderId).finally(() =>
            navigatePaymentFailed(pending.orderId)
        );
    }, [markTransactionFailed, navigatePaymentFailed]);

    // Recovery: BFCache restore (browser back from payment redirect)
    useEffect(() => {
        async function handlePageShow(event) {
            try {
                const navType =
                    performance.getEntriesByType("navigation")?.[0]?.type || "";
                if (!event.persisted && navType !== "back_forward") return;

                setIsProcessingCheckout(false);
                const pending = getPendingPayment();
                if (!pending?.orderId) return;

                await markTransactionFailed(pending.orderId);
                clearPendingPayment();
                navigatePaymentFailed(pending.orderId);
            } catch {
                setIsProcessingCheckout(false);
            }
        }

        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, [markTransactionFailed, navigatePaymentFailed]);

    // Auto-set service type when not yet configured
    useEffect(() => {
        if (dilveryDetails.dilveryAddressType) return;

        const defaultType = availableOnHome ? "home" : availableOnStore ? "store" : null;
        if (!defaultType) return;

        const dateStr = dilveryDetails?.dilveryDate
            ? dayjs(dilveryDetails.dilveryDate).format("YYYY-MM-DD")
            : "";

        setServiceType(defaultType);
        dispatch(
            setDilveryDetails({
                ...dilveryDetails,
                dilveryAddressType: defaultType,
                ...(defaultType === "store" ? { dilevryLocation: {} } : {}),
                dilveryDate: dateStr,
            })
        );

        if (isReorderMode) {
            const reorderDateStr = reorderState.provider?.dilveryDate
                ? dayjs(reorderState.provider.dilveryDate).format("YYYY-MM-DD")
                : "";
            dispatch(
                setReorderMode({
                    ...reorderState,
                    provider: {
                        ...reorderState.provider,
                        dilveryAddressType: defaultType,
                        ...(defaultType === "store" ? { dilevryLocation: {} } : {}),
                        dilveryDate: reorderDateStr,
                    },
                })
            );
        }
    }, [availableOnHome, availableOnStore, dilveryDetails, isReorderMode, reorderState, dispatch]);

    // Auto-select first available payment method
    useEffect(() => {
        if (dilveryDetails.dilevryPymentMethod || enabledPaymentMethods.length === 0)
            return;
        const firstMethod = enabledPaymentMethods[0].methodType;
        setPaymentOption(firstMethod);
        dispatch(setDilveryDetails({ ...dilveryDetails, dilevryPymentMethod: firstMethod }));
    }, [enabledPaymentMethods, dilveryDetails, dispatch]);

    // Reorder mode: reset delivery details so user re-selects
    useEffect(() => {
        if (!isReorderMode || !reorderState.provider) return;
        dispatch(
            setDilveryDetails({
                dilveryAddressType:
                    reorderState.provider.at_store === "1" ? "store" : "home",
                dilevryLocation: {},
                dilveryDate: "",
                dilveryTime: "",
                dilveryNote: "",
                dilevryPymentMethod: "",
                isReOrder: true,
                reOrderId: reorderState.orderId,
            })
        );
    }, [isReorderMode, reorderState.provider, reorderState.orderId, dispatch]);

    // Fetch promo codes when provider is available
    useEffect(() => {
        const providerId = currentCartProviderData?.provider_id;
        if (!providerId) return;
        getPromoCodeApi({ partner_id: providerId })
            .then((res) => setOffers(res?.error === false ? res.data : []))
            .catch(() => setOffers([]));
    }, [currentCartProviderData?.provider_id]);

    // Fetch user addresses for home delivery
    useEffect(() => {
        if (serviceType !== "home") return;
        getAddressApi()
            .then((res) => {
                if (res.error !== false) return;
                setAddresses(res.data);
                const def = res.data.find((a) => a.is_default === "1");
                if (def) {
                    setDefaultAddress(def);
                    dispatch(
                        setDilveryDetails({ ...dilveryDetails, dilevryLocation: def })
                    );
                }
            })
            .catch(() => { });
    }, [serviceType]);

    // ── Event Handlers ────────────────────────────────────────────────────────
    const handleServiceType = (type) => {
        setServiceType(type);
        dispatch(
            setDilveryDetails({
                ...dilveryDetails,
                dilveryAddressType: type,
                ...(type === "store" ? { dilevryLocation: {} } : {}),
            })
        );
        if (isReorderMode) {
            dispatch(
                setReorderMode({
                    ...reorderState,
                    provider: {
                        ...reorderState.provider,
                        dilveryAddressType: type,
                        ...(type === "store" ? { dilevryLocation: {} } : {}),
                    },
                })
            );
        }
    };

    const handleActiveNotes = () => setActiveNotes(true);

    const handleSaveNotes = () => {
        if (!note) return toast.error(t("pleaseEnterNote"));
        dispatch(setDilveryDetails({ ...dilveryDetails, dilveryNote: note }));
        setActiveNotes(false);
    };

    const handleClearNotes = () => {
        setActiveNotes(false);
        setNote("");
        dispatch(setDilveryDetails({ ...dilveryDetails, dilveryNote: "" }));
    };

    const handlePaymentOption = (method) => {
        if (dilveryDetails.dilevryPymentMethod === method.methodType) return;
        setPaymentOption(method.methodType);
        dispatch(
            setDilveryDetails({ ...dilveryDetails, dilevryPymentMethod: method.methodType })
        );
        logClarityEvent(PAYMENT_EVENTS.PAYMENT_METHOD_SELECTED, {
            method: method.methodType,
            provider_id: currentCartProviderData?.provider_id,
        });
    };

    const handleApply = async (offer) => {
        try {
            const subtotalRaw = showTax
                ? currentCartProviderData?.sub_total_without_tax
                : currentCartProviderData?.sub_total;
            const numericSubtotal = Number(String(subtotalRaw || 0));

            const res = await validatePromocodeApi({
                promo_code_id: offer?.id,
                provider_id: currentCartProviderData?.provider_id,
                overall_amount: numericSubtotal,
            });

            if (res.error !== false) {
                toast.error(extractErrorMessage(res.message));
                logClarityEvent(PAYMENT_EVENTS.PROMO_CODE_FAILED, {
                    promo_code_id: offer?.id,
                    reason: res.message,
                });
                return;
            }

            let discountAmount = res.data[0]?.final_discount || res.data[0]?.discount || 0;
            if (typeof discountAmount === "object" && discountAmount !== null) {
                discountAmount = discountAmount.final_total || discountAmount.final_discount || 0;
            }
            discountAmount = Number(discountAmount) || 0;

            dispatch(setPromocodeDiscount(discountAmount));
            dispatch(setAppliedCoupon(offer));
            setOffersModalOpen(false);
            logClarityEvent(PAYMENT_EVENTS.PROMO_CODE_APPLIED, {
                promo_code_id: offer?.id,
                discount_value: discountAmount,
            });
        } catch {
            logClarityEvent(PAYMENT_EVENTS.PROMO_CODE_FAILED, {
                promo_code_id: offer?.id,
                reason: "network_error",
            });
        }
    };

    const handleRemove = () => {
        dispatch(setAppliedCoupon(null));
        dispatch(setPromocodeDiscount(0));
    };

    // ── Payment Handlers ──────────────────────────────────────────────────────

    const handleCODPayment = async () => {
        try {
            const orderRes = await placeOrderApi(buildPayload());
            if (orderRes.error !== false) {
                setIsProcessingCheckout(false);
                toast.error(extractErrorMessage(orderRes?.message));
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, {
                    payment_method: "cod",
                    reason: extractErrorMessage(orderRes?.message),
                });
                return;
            }

            const orderId = orderRes.data.order_id;
            const txRes = await addTransactionsApi({
                order_id: orderId,
                status: "success",
                is_reorder: isReorderMode ? "1" : "",
            });

            if (txRes.error !== false) {
                setIsProcessingCheckout(false);
                toast.error(txRes.message || "Failed to update transaction status.");
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, {
                    payment_method: "cod",
                    order_id: orderId,
                    reason: txRes.message,
                });
                return;
            }

            logClarityEvent(PAYMENT_EVENTS.PAYMENT_SUCCEEDED, {
                payment_method: "cod",
                order_id: orderId,
            });
            logClarityEvent(BOOKING_EVENTS.BOOKING_CONFIRMED, {
                order_id: orderId,
                payment_method: "cod",
            });
            setIsProcessingCheckout(false);
            toast.success(t("paymentSuccessWithCOD"));
            dispatch(isReorderMode ? clearReorder() : clearCart());
            dispatch(clearCheckoutData());
            router.push(`/booking/inv-${orderId}`);
        } catch {
            logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, {
                payment_method: "cod",
                reason: "cod_exception",
            });
        }
    };

    const handleStripePayment = async () => {
        try {
            const orderRes = await placeOrderApi(buildPayload());
            if (orderRes.error !== false) {
                setIsProcessingCheckout(false);
                toast.error(extractErrorMessage(orderRes?.message));
                return;
            }

            const orderId = orderRes.data.order_id;
            setOrderID(orderId);

            const intentRes = await createStripePaymentIntentApi({ order_id: orderId });
            if (intentRes?.error !== false) {
                toast.error(intentRes?.message || t("somethingWentWrong"));
                setIsProcessingCheckout(false);
                return;
            }

            setClientKey(intentRes.data.client_secret);
            setStripeModalOpen(true);

            // Handle Stripe modal cancel via DOM event (legacy approach preserved)
            const stripeModal = document.querySelector(".stripe-modal");
            if (stripeModal) {
                stripeModal.addEventListener("close", async () => {
                    try {
                        await addTransactionsApi({ order_id: orderId, status: "failed" });
                        setIsProcessingCheckout(false);
                        router.push(`/payment-status?order_id=${orderId}&status=failed`);
                    } catch {
                        setIsProcessingCheckout(false);
                        toast.error(t("somethingWentWrong"));
                    }
                });
            }
        } catch {
            setIsProcessingCheckout(false);
            toast.error(t("somethingWentWrong"));
        }
    };

    const handleRedirectPayment = async (method, urlKey) => {
        try {
            const orderRes = await placeOrderApi(buildPayload(method));
            if (orderRes.error !== false) {
                setIsProcessingCheckout(false);
                toast.error(extractErrorMessage(orderRes.message) || "Failed to place order.");
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, {
                    payment_method: method,
                    reason: extractErrorMessage(orderRes.message),
                });
                return;
            }

            const orderId = orderRes.data.order_id;
            const redirectUrl =
                method === "paypal"
                    ? orderRes.data.paypal_link
                    : orderRes.data[urlKey];

            if (!redirectUrl) {
                setIsProcessingCheckout(false);
                toast.error(t("xenditUrlNotFoundInResponse"));
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, {
                    payment_method: method,
                    order_id: orderId,
                    reason: "missing_gateway_url",
                });
                return;
            }

            setPendingPayment(orderId, method);
            logClarityEvent(PAYMENT_EVENTS.PAYMENT_GATEWAY_REDIRECTED, {
                payment_method: method,
                order_id: orderId,
            });
            window.location.href = redirectUrl;
        } catch {
            setIsProcessingCheckout(false);
            toast.error(t("somethingWentWrong"));
            logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, {
                payment_method: method,
                reason: "exception",
            });
        }
    };

    const handlePaypalPayment = () => handleRedirectPayment("paypal", "paypal_link");
    const handleFlutterwavePayment = () => handleRedirectPayment("flutterwave", "flutterwave");
    const handleXenditPayment = () => handleRedirectPayment("xendit", "xendit");

    const handlePaystackPayment = async () => {
        try {
            const orderRes = await placeOrderApi(buildPayload("paystack"));
            if (orderRes.error !== false) {
                setIsProcessingCheckout(false);
                toast.error(extractErrorMessage(orderRes.message) || "Failed to place order.");
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, {
                    payment_method: "paystack",
                    reason: extractErrorMessage(orderRes.message),
                });
                return;
            }

            const orderId = orderRes.data.order_id;

            if (!userEmail) {
                setIsProcessingCheckout(false);
                toast.error(t("pleaseUpdateYourEmailAddressToProceedWithPaystackPayment"));
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, {
                    payment_method: "paystack",
                    order_id: orderId,
                    reason: "missing_email",
                });
                return;
            }

            const onSuccess = async () => {
                try {
                    const txRes = await addTransactionsApi({
                        order_id: orderId,
                        status: "success",
                        is_reorder: isReorderMode ? "1" : "",
                    });
                    if (txRes.error === false) {
                        toast.success(t("paymentSuccess"));
                        logClarityEvent(PAYMENT_EVENTS.PAYMENT_SUCCEEDED, { payment_method: "paystack", order_id: orderId });
                        logClarityEvent(BOOKING_EVENTS.BOOKING_CONFIRMED, { order_id: orderId, payment_method: "paystack" });
                        router.push(`/payment-status?order_id=${orderId}&status=successful`);
                    } else {
                        toast.error(txRes.message || "Failed to update transaction status.");
                        logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "paystack", order_id: orderId, reason: txRes.message });
                    }
                } catch {
                    toast.error(t("somethingWentWrong"));
                    logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "paystack", order_id: orderId, reason: "transaction_update_exception" });
                }
            };

            const onClose = async () => {
                try {
                    await addTransactionsApi({ order_id: orderId, status: "failed" });
                    setIsProcessingCheckout(false);
                    router.push(`/payment-status?order_id=${orderId}&status=failed`);
                    logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "paystack", order_id: orderId, reason: "gateway_closed" });
                } catch {
                    setIsProcessingCheckout(false);
                    toast.error(t("somethingWentWrong"));
                    logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "paystack", order_id: orderId, reason: "gateway_close_exception" });
                }
            };

            const paystack = new PaystackPop();
            paystack.newTransaction({
                key: paymentSettings?.paystack_key,
                email: userEmail,
                amount: calculateFinalAmount() * 100,
                currency: paystackCurrencyCode,
                reference: `order_${orderId}_${Date.now()}`,
                metadata: { order_id: orderId },
                onSuccess,
                onClose,
            });
        } catch {
            setIsProcessingCheckout(false);
            toast.error(t("somethingWentWrong"));
            logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "paystack", reason: "exception" });
        }
    };

    const handleRazorpayPayment = async () => {
        try {
            const orderRes = await placeOrderApi(buildPayload());
            if (orderRes.error !== false) {
                setIsProcessingCheckout(false);
                toast.error(extractErrorMessage(orderRes.message) || "Failed to place order.");
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "razorpay", reason: extractErrorMessage(orderRes.message) });
                return;
            }

            const placeOrderId = orderRes.data.order_id;
            const rzpOrderRes = await createRazorOrderApi({ orderId: placeOrderId });

            if (rzpOrderRes.error !== false) {
                setIsProcessingCheckout(false);
                toast.error(rzpOrderRes.message || "Failed to create Razorpay order.");
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "razorpay", order_id: placeOrderId, reason: rzpOrderRes.message });
                return;
            }

            const onModalClose = async () => {
                try {
                    await addTransactionsApi({ order_id: placeOrderId, status: "failed" });
                    setIsProcessingCheckout(false);
                    router.push(`/payment-status?order_id=${placeOrderId}&status=failed`);
                } catch {
                    setIsProcessingCheckout(false);
                    toast.error(t("somethingWentWrong"));
                }
            };

            window.addEventListener("popstate", onModalClose);
            window.addEventListener("keydown", (e) => {
                if (e.key === "Escape") onModalClose();
            });

            const options = {
                key: razorpayKey,
                amount: parseInt(calculateFinalAmount()) * 100,
                currency: razorpayCurrencyCode,
                name: process.env.NEXT_PUBLIC_APP_NAME,
                order_id: rzpOrderRes.data.id,
                notes: { order_id: placeOrderId },
                description: "Payment for Your Product",
                handler: async (response) => {
                    if (!response.razorpay_payment_id) return;
                    try {
                        const txRes = await addTransactionsApi({
                            order_id: placeOrderId,
                            status: "success",
                            is_reorder: isReorderMode ? "1" : "",
                        });
                        if (txRes.error === false) {
                            toast.success(t("paymentSuccessful"));
                            logClarityEvent(PAYMENT_EVENTS.PAYMENT_SUCCEEDED, { payment_method: "razorpay", order_id: placeOrderId });
                            logClarityEvent(BOOKING_EVENTS.BOOKING_CONFIRMED, { order_id: placeOrderId, payment_method: "razorpay" });
                            router.push(`/payment-status?order_id=${placeOrderId}&status=successful`);
                        } else {
                            toast.error(txRes.message || "Failed to update transaction status.");
                            logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "razorpay", order_id: placeOrderId, reason: txRes.message });
                        }
                    } catch {
                        toast.error(t("somethingWentWrong"));
                        logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "razorpay", order_id: placeOrderId, reason: "transaction_update_exception" });
                    }
                },
                theme: { color: "#3399cc" },
                modal: {
                    ondismiss: async () => {
                        try {
                            await addTransactionsApi({ order_id: placeOrderId, status: "failed" });
                            setIsProcessingCheckout(false);
                            router.push(`/payment-status?order_id=${placeOrderId}&status=failed`);
                            logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "razorpay", order_id: placeOrderId, reason: "gateway_dismissed" });
                        } catch {
                            setIsProcessingCheckout(false);
                            toast.error(t("somethingWentWrong"));
                            logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "razorpay", order_id: placeOrderId, reason: "gateway_dismiss_exception" });
                        }
                    },
                },
            };

            new window.Razorpay(options).open();
        } catch {
            setIsProcessingCheckout(false);
            toast.error(t("somethingWentWrong"));
            logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "razorpay", reason: "exception" });
        }
    };

    const handleCashfreePayment = async () => {
        try {
            const orderRes = await placeOrderApi(buildPayload("cashfree"));
            if (orderRes.error !== false) {
                setIsProcessingCheckout(false);
                toast.error(extractErrorMessage(orderRes.message) || "Failed to place order.");
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "cashfree", reason: extractErrorMessage(orderRes.message) });
                return;
            }

            const orderId = orderRes.data.order_id;
            const cfOrderRes = await createCashfreeOrderApi({ order_id: orderId });

            if (cfOrderRes.error !== false) {
                setIsProcessingCheckout(false);
                toast.error(cfOrderRes.message || "Failed to create Cashfree order.");
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "cashfree", order_id: orderId, reason: cfOrderRes.message });
                return;
            }

            const sessionId = cfOrderRes.data.payment_session_id;
            if (!sessionId) {
                setIsProcessingCheckout(false);
                toast.error(t("cashfreeSessionIdNotFound"));
                logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "cashfree", order_id: orderId, reason: "missing_session_id" });
                return;
            }

            const cashfree = await loadCashfree({
                mode: paymentSettings?.cashfree_mode === "production" ? "production" : "sandbox",
            });
            cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_self" });
        } catch {
            setIsProcessingCheckout(false);
            toast.error(t("somethingWentWrong"));
            logClarityEvent(PAYMENT_EVENTS.PAYMENT_FAILED, { payment_method: "cashfree", reason: "exception" });
        }
    };

    const proceedToPayment = useCallback(
        (paymentMethod) => {
            logClarityEvent(BOOKING_EVENTS.BOOKING_REQUESTED, {
                payment_method: paymentMethod,
                provider_id: currentCartProviderData?.provider_id,
                amount: calculateFinalAmount(),
                is_reorder: dilveryDetails?.isReOrder ? "1" : "0",
            });
            logClarityEvent(PAYMENT_EVENTS.PAYMENT_STARTED, {
                payment_method: paymentMethod,
                amount: calculateFinalAmount(),
            });

            const handlerMap = {
                cod: handleCODPayment,
                stripe: handleStripePayment,
                paypal: handlePaypalPayment,
                paystack: handlePaystackPayment,
                razorpay: handleRazorpayPayment,
                flutterwave: handleFlutterwavePayment,
                xendit: handleXenditPayment,
                cashfree: handleCashfreePayment,
            };

            const handler = handlerMap[paymentMethod];
            if (!handler) {
                setIsProcessingCheckout(false);
                toast.error(t("invalidPaymentMethodSelected"));
                return;
            }

            try {
                handler();
            } catch {
                setIsProcessingCheckout(false);
                toast.error(t("somethingWentWrong"));
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [calculateFinalAmount, currentCartProviderData, dilveryDetails]
    );

    const handleCheckout = async (e) => {
        e.preventDefault();
        setIsProcessingCheckout(true);

        try {
            const {
                dilevryLocation,
                dilevryPymentMethod,
                dilveryAddressType,
                dilveryDate,
                dilveryTime,
            } = dilveryDetails;

            if (
                dilveryAddressType === "home" &&
                (!dilevryLocation?.id || !dilevryLocation?.address)
            ) {
                toast.error(t("invalidDeliveryAddress"));
                setIsProcessingCheckout(false);
                return;
            }

            if (!["home", "store"].includes(dilveryAddressType)) {
                toast.error(t("invalidDelievryType"));
                setIsProcessingCheckout(false);
                return;
            }

            if (!dilveryDate || !dilveryTime) {
                toast.error(t("invalidDateAndTime"));
                setIsProcessingCheckout(false);
                return;
            }

            if (!dilevryPymentMethod) {
                toast.error(t("selectPaymentMethod"));
                setIsProcessingCheckout(false);
                return;
            }

            if (dilveryAddressType === "home") {
                const availRes = await providerAvailableApi({
                    latitude: dilevryLocation?.lattitude,
                    longitude: dilevryLocation?.longitude,
                    isCheckout: 1,
                    order_id: isReorderMode ? reorderState.orderId : "",
                    custom_job_request_id: isCustomJob ? customJobData?.custom_job_request_id : "",
                    bidder_id: isCustomJob ? customJobData?.providerId : "",
                });

                if (availRes.error !== false) {
                    toast.error(extractErrorMessage(availRes.message));
                    setIsProcessingCheckout(false);
                    return;
                }
            }

            await proceedToPayment(dilevryPymentMethod);
        } catch {
            toast.error(t("somethingWentWrong"));
            setIsProcessingCheckout(false);
        } finally {
            // Note: setIsProcessingCheckout(false) is intentionally NOT called here
            // for redirect gateways — they navigate away before this runs.
            // The individual handlers manage their own loading state.
        }
    };

    return {
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
    };
}
