import { BsHouse } from "react-icons/bs";
import { IoStorefrontOutline } from "react-icons/io5";
import { useTranslation } from "@/components/Layout/TranslationContext";
import RadioIndicator from "./RadioIndicator";

const ServiceTypeSelector = ({ availableOnHome, availableOnStore, serviceType, onSelect }) => {
    const t = useTranslation();

    return (
        <div className="mb-6">
            <span className="text-xl lg:text-2xl font-semibold">{t("servicePerformAt")}</span>
            <div className="flex flex-wrap sm:flex-nowrap mt-[18px] w-full gap-3">
                {availableOnHome && (
                    <button
                        onClick={() => onSelect("home")}
                        disabled={serviceType === "home"}
                        className={`disabled:cursor-not-allowed flex items-center justify-between m-0 px-4 py-2 border rounded-[8px] w-full transition-all duration-300 ease-in-out ${serviceType === "home" ? "border_color selected_shadow" : "border-gray-300"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <BsHouse size={24} />
                            <span className="rtl:mr-2">{t("atDoorstep")}</span>
                        </div>
                        <RadioIndicator selected={serviceType === "home"} />
                    </button>
                )}

                {availableOnStore && (
                    <button
                        onClick={() => onSelect("store")}
                        disabled={serviceType === "store"}
                        className={`disabled:cursor-not-allowed flex items-center justify-between m-0 px-4 py-2 border rounded-[8px] w-full transition-all duration-300 ease-in-out ${serviceType === "store" ? "border_color selected_shadow" : "border-gray-300"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <IoStorefrontOutline size={24} />
                            <span className="rtl:mr-2">{t("atStore")}</span>
                        </div>
                        <RadioIndicator selected={serviceType === "store"} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ServiceTypeSelector;
