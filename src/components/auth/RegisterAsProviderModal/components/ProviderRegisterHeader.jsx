import React from "react";
import CustomImageTag from "@/components/ReUseableComponents/CustomImageTag";
import { MdClose } from "react-icons/md";

const ProviderRegisterHeader = ({ websettings, onClose, t }) => {
    return (
        <div className="w-full flex justify-between items-center mb-4">
            <CustomImageTag
                src={websettings?.web_logo}
                alt={t("logo")}
                className="aspect-logo w-[182px] object-cover"
                imgClassName="object-cover"
            />
            <button
                onClick={onClose}
                className="rounded-full description_color text-white p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <MdClose size={24} />
            </button>
        </div>
    );
};

export default ProviderRegisterHeader;
