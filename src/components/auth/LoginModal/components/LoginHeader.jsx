/**
 * LoginHeader Component
 * Logo and close button header for LoginModal
 */

import React from "react";
import { MdClose } from "react-icons/md";
import CustomImageTag from "@/components/ReUseableComponents/CustomImageTag";

const LoginHeader = ({ websettings, onClose, t }) => {
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
                className="rounded-full description_color text-white p-1"
            >
                <MdClose size={24} />
            </button>
        </div>
    );
};

export default LoginHeader;
