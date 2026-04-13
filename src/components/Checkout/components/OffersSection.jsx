"use client";
import { FaChevronRight, FaPercentage } from "react-icons/fa";
import { useTranslation } from "@/components/Layout/TranslationContext";
import OfferCard from "./OfferCard";

/**
 * OffersSection
 * Renders the promo/coupon area in the summary sidebar:
 *  - Applied coupon card with Remove action
 *  - "Save Big with N more offers" bar (opens modal)
 *  - Single offer card with Apply action
 * Hidden entirely when `isCustomJob` is true or there are no offers.
 */
const OffersSection = ({
    isCustomJob,
    offers,
    appliedCoupon,
    hasAppliedCoupon,
    onOpenOffersModal,
    onApply,
    onRemove,
}) => {
    const t = useTranslation();

    if (isCustomJob || offers.length === 0) return null;

    if (hasAppliedCoupon) {
        return (
            <OfferCard
                offer={appliedCoupon}
                actionLabel={t("remove")}
                onAction={onRemove}
            />
        );
    }

    if (offers.length > 1) {
        return (
            <div
                className="flex items-center justify-between mt-6 bg-green-100 text-green-600 p-3 rounded-md mb-4 cursor-pointer"
                onClick={onOpenOffersModal}
            >
                <span className="flex items-center gap-2">
                    <FaPercentage />
                    {t("saveBigwith")} {offers.length} {t("moreOffers")}
                </span>
                <span className="text-green-600 font-semibold rtl:rotate-180">
                    <FaChevronRight size={20} />
                </span>
            </div>
        );
    }

    return (
        <OfferCard
            offer={offers[0]}
            actionLabel={t("apply")}
            onAction={() => onApply(offers[0])}
        />
    );
};

export default OffersSection;
