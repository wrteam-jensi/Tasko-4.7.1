import React from "react";
import Link from "next/link";
import {
    MdComputer,
    MdPhoneAndroid,
    MdAppRegistration,
} from "react-icons/md";

const ProviderSuccessScreen = ({
    providerPanelLink,
    providerPlayStoreLink,
    providerAppStoreLink,
    t,
}) => {
    return (
        <div className="space-y-8 text-center">
            {/* Success Title & Message */}
            <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-800">
                    {t("registrationSuccess")}
                </h2>
                <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
                    {t("youAreNowRegistered")}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 max-w-md mx-auto">
                {/* Provider Panel Button */}
                <Link
                    href={providerPanelLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full primary_bg_color text-white py-4 px-6 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    <div className="flex items-center justify-center space-x-3">
                        <MdComputer className="w-5 h-5" />
                        <span>{t("goToProviderPanel")}</span>
                    </div>
                </Link>

                {/* Mobile Apps Section */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 mb-3">
                        {t("downloadOurMobileProviderApps") ||
                            "Download our mobile provider apps"}
                    </p>
                    <div className="flex space-x-3">
                        {/* Play Store Button */}
                        <Link
                            href={providerPlayStoreLink || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-sm"
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <MdPhoneAndroid className="w-4 h-4" />
                                <span>Android</span>
                            </div>
                        </Link>

                        {/* App Store Button */}
                        <Link
                            href={providerAppStoreLink || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium text-sm"
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <MdAppRegistration className="w-4 h-4" />
                                <span>iOS</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderSuccessScreen;
