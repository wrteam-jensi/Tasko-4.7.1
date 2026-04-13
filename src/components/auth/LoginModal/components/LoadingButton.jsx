/**
 * LoadingButton Component
 * Reusable button with loading state
 */

import React from "react";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";

const LoadingButton = ({
    loading,
    onClick,
    disabled,
    children,
    className = "",
    activeClassName = "primary_bg_color text-white",
    disabledClassName = "background_color description_color cursor-not-allowed",
}) => {
    if (loading) {
        return (
            <div
                className={`w-full p-3 flex items-center justify-center font-semibold rounded-md primary_bg_color ${className}`}
            >
                <MiniLoader />
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full py-2 font-semibold rounded-md ${disabled ? disabledClassName : activeClassName
                } ${className}`}
        >
            {children}
        </button>
    );
};

export default LoadingButton;
