import { FaCirclePlus, FaLocationDot } from "react-icons/fa6";
import { useTranslation } from "@/components/Layout/TranslationContext";

const AddressSection = ({ defaultAddress, addresses, onOpenDrawer }) => {
    const t = useTranslation();

    return (
        <div className="mb-6">
            <span className="text-xl lg:text-2xl font-semibold">{t("address")}</span>

            {defaultAddress && addresses.length > 0 ? (
                <div className="rounded-md flex items-start space-x-3 mt-[18px]">
                    <span className="primary_text_color light_bg_color p-3 rounded-[8px] flex items-center justify-center">
                        <FaLocationDot />
                    </span>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="block text-lg font-semibold">
                                {defaultAddress?.city_name || defaultAddress?.city}
                            </span>
                            <span>|</span>
                            <button className="primary_text_color underline" onClick={onOpenDrawer}>
                                {t("edit")}
                            </button>
                        </div>
                        <span className="block text-base font-normal description_color break-all">
                            {defaultAddress?.address}, {defaultAddress?.area}
                            <br />
                            {defaultAddress?.type}
                            <br />
                            {defaultAddress?.mobile}
                        </span>
                    </div>
                </div>
            ) : (
                <button
                    onClick={onOpenDrawer}
                    className="mt-2 w-full border border-dashed border_color flex items-center justify-center gap-3 primary_text_color p-4 rounded-xl"
                >
                    <FaCirclePlus size={22} />
                    <span>{t("addAddress")}</span>
                </button>
            )}
        </div>
    );
};

export default AddressSection;
