import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { RiDeleteBinLine } from "react-icons/ri";

const DeleteAccountDiallog = ({ isOpen, onClose, onDelete }) => {
  const t = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={(state) => { if (!state) onClose(); }}>
      <DialogContent className="max-w-[400px] p-8 card_bg rounded-[20px] overflow-hidden flex flex-col items-center">
        <div className="mb-5 flex items-center justify-center">
          <div className="flex items-center justify-center p-3 bg-[#D1000014] rounded-full">
            <RiDeleteBinLine className="w-10 h-10 text-[#D10000]" />
          </div>
        </div>

        <DialogTitle className="text-[22px] font-semibold mb-2">
          {t("deleteAccount")}
        </DialogTitle>

        <p className="description_color text-center text-[15px] mb-6 max-w-[280px]">
          {t("areYouSureYouWantToDeleteYourAccount")}
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 primary_bg_color text-white rounded-lg  transition-colors duration-200 text-center font-medium"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onDelete}
            className="flex-1 py-3 px-6 bg-transparent border border-black hover:border-transparent hover:text-white hover:bg-black rounded-lg  transition-colors duration-200 text-center font-medium"
          >
            {t("delete")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDiallog;
