import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MdClose } from "react-icons/md";
import OfferCard from "@/components/Provider/OfferCard";
import { useTranslation } from "@/components/Layout/TranslationContext";

const OfferModal = ({
  open,
  close,
  offers,
  handleApply,
  handleRemove,
  isApplied,
}) => {
  const t = useTranslation();

  return (
    <Dialog open={open} onClose={close}>
      <DialogTitle className="hidden"></DialogTitle>
      <DialogContent
        className="card_bg p-6 md:p-8 rounded-md shadow-lg w-full max-w-4xl"
        style={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        <div className="w-full flex justify-between items-center mb-4">
          <h1 className="text-3xl font-semibold">{t("allCoupons")}</h1>
          {/* Close Button */}
          <button
            onClick={close}
            className="rounded-full description_color text-white p-1"
          >
            <MdClose size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              isApplicable={true}
              handleApply={handleApply}
              handleRemove={handleRemove}
              isApplied={isApplied(offer)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferModal;
