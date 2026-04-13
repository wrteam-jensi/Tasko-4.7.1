import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { IoLogOutOutline } from "react-icons/io5";

const LogoutDialog = ({ isOpen, onClose, onLogout }) => {
  const t = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] p-8 card_bg rounded-[20px] overflow-hidden flex flex-col items-center">
        <div className="mb-5 flex items-center justify-center">
          <div className="flex items-center justify-center p-3 light_bg_color rounded-full">
            <IoLogOutOutline className="w-10 h-10 primary_text_color" />
          </div>
        </div>

        {/* Title */}
        <DialogTitle className="text-[22px] font-semibold mb-2">
          {t("logoutt")}
        </DialogTitle>

        {/* Description */}
        <p className="description_color text-center text-[15px] mb-6 max-w-[280px]">
          {t("areYouSureYouWantToLogout")}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 primary_bg_color text-white rounded-lg  transition-colors duration-200 text-center font-medium"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onLogout}
            className="flex-1 py-3 px-6 bg-transparent border border-black hover:border-transparent hover:text-white hover:bg-black rounded-lg  transition-colors duration-200 text-center font-medium"
          >
            {t("logout")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogoutDialog;
