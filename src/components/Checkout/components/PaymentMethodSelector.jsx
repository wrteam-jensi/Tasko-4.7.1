"use client";
import CustomImageTag from "@/components/ReUseableComponents/CustomImageTag";
import RadioIndicator from "./RadioIndicator";

/**
 * PaymentMethodSelector
 * Renders the grid of available payment method buttons.
 * If no enabled methods exist, shows an empty-state message.
 *
 * @param {object[]} enabledMethods  - Filtered list of enabled payment methods.
 * @param {number}   onlineCount     - Number of enabled non-COD methods.
 * @param {string}   paymentOption   - Currently selected method type.
 * @param {object}   icons           - Map of methodType → imported asset.
 * @param {object}   cardIcon        - Generic card icon for single-online mode.
 * @param {string}   codIcon         - COD fallback icon.
 * @param {Function} onSelect        - Callback when a method is clicked.
 * @param {Function} t               - Translation function.
 * @param {string}   noMethodsLabel  - Translated "no payment methods" string.
 */
const PaymentMethodSelector = ({
    enabledMethods,
    onlineCount,
    paymentOption,
    icons,
    cardIcon,
    codIcon,
    onSelect,
    t,
    noMethodsLabel,
}) => {
    if (enabledMethods.length === 0) {
        return (
            <div className="text-red-500 text-center flex justify-center items-center">
                {noMethodsLabel}
            </div>
        );
    }

    return (
        <div>
            <span className="text-2xl font-semibold">{t("selectPaymentOption")}</span>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {enabledMethods.map((method) => {
                    const isCod = method.methodType === "cod";
                    const isSingleOnline = !isCod && onlineCount === 1;
                    const icon = isSingleOnline
                        ? cardIcon
                        : icons[method.methodIcon] ?? codIcon;
                    const label = isCod
                        ? method.method
                        : isSingleOnline
                            ? t("payNow")
                            : method.method;
                    const isSelected = paymentOption === method.methodType;

                    return (
                        <button
                            key={method.methodType}
                            onClick={() => onSelect(method)}
                            className={`flex items-center justify-between gap-3 px-4 py-3 border rounded-md w-full transition-all duration-300 ${isSelected ? "border border_color selected_shadow" : "border"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <CustomImageTag
                                    src={icon}
                                    alt={method.method}
                                    className="w-8 aspect-square object-contain"
                                    imgClassName="object-contain rounded-md"
                                />
                                <span>{label}</span>
                            </div>
                            <RadioIndicator selected={isSelected} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PaymentMethodSelector;
