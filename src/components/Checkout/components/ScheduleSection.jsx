"use client";
import { BsCalendar3Week } from "react-icons/bs";
import { IoTimeOutline } from "react-icons/io5";
import { BiSolidEdit } from "react-icons/bi";
import { MdClose, MdModeEdit } from "react-icons/md";
import { FaInfoCircle } from "react-icons/fa";
import dayjs from "dayjs";
import { useTranslation } from "@/components/Layout/TranslationContext";

/**
 * ScheduleSection
 * Renders the date/time display row, the time-slot warning banner,
 * the "Select Here / Change" button, and the collapsible notes input.
 */
const ScheduleSection = ({
    dilveryDetails,
    note,
    setNote,
    activeNotes,
    onOpenScheduleDrawer,
    onToggleNotes,
    onSaveNotes,
    onClearNotes,
}) => {
    const t = useTranslation();

    return (
        <div className="mb-6">
            <span className="text-xl lg:text-2xl font-semibold">{t("scheduleAt")}</span>

            <div className="mt-3 flex flex-wrap sm:flex-nowrap items-center p-3 gap-3 w-full">
                {/* Date + Time display */}
                <div className="flex flex-col items-start justify-start gap-3 w-full">
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                        {/* Date */}
                        <div className="flex items-center space-x-2 gap-3 w-full">
                            <span
                                className={`${dilveryDetails?.dilveryDate
                                    ? "light_bg_color primary_text_color"
                                    : "bg-[#2121212E]"
                                    } p-3 rounded-[8px]`}
                            >
                                <BsCalendar3Week size={22} />
                            </span>
                            <div className="flex flex-col items-start justify-center">
                                <span className="text-base font-normal description_color">{t("date")}</span>
                                <span>
                                    {dilveryDetails?.dilveryDate
                                        ? dayjs(dilveryDetails.dilveryDate).format("DD/MM/YYYY")
                                        : "---"}
                                </span>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-center space-x-2 gap-3 w-full">
                            <span
                                className={`${dilveryDetails?.dilveryTime
                                    ? "light_bg_color primary_text_color"
                                    : "bg-[#2121212E]"
                                    } p-3 rounded-[8px]`}
                            >
                                <IoTimeOutline size={22} />
                            </span>
                            <div className="flex flex-col items-start justify-center">
                                <span className="text-base font-normal description_color">{t("time")}</span>
                                <span>
                                    {dilveryDetails?.dilveryTime
                                        ? dayjs(
                                            `1970-01-01T${dilveryDetails.dilveryTime.replace("-", ":")}`
                                        ).format("h:mm A")
                                        : "---"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Time-slot warning banner */}
                    {dilveryDetails?.dilveryTimeMessage && (
                        <span className="w-full text-center text-sm bg-[#FFEEC5] p-2 rounded-md text-[#B39651] dark:bg-[#FFDA7F] mt-1 flex items-center justify-center gap-1">
                            <FaInfoCircle size={16} />
                            {dilveryDetails.dilveryTimeMessage}
                        </span>
                    )}
                </div>

                {/* Select / Change button */}
                {dilveryDetails?.dilveryDate ? (
                    <button
                        className="px-4 py-2 border rounded-md w-full light_bg_color border_color"
                        onClick={onOpenScheduleDrawer}
                    >
                        <span className="primary_text_color flex items-center justify-center gap-1">
                            <span>{t("change")}</span>
                            <BiSolidEdit size={22} />
                        </span>
                    </button>
                ) : (
                    <button
                        className="px-4 py-2 border rounded-md border-black w-full transition-all duration-300 hover:primary_bg_color hover:border_color hover:text-white"
                        onClick={onOpenScheduleDrawer}
                    >
                        <span>{t("selectHere")}</span>
                    </button>
                )}
            </div>

            {/* Notes / Instructions */}
            <div className="extraNotes mt-3">
                {/* Expanded input */}
                <div
                    className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${activeNotes ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center justify-between light_bg_color border border_color w-full rounded-lg p-3">
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={t("typeHere")}
                                className="w-full focus:outline-none bg-transparent"
                            />
                            <MdClose
                                size={22}
                                className="bg-transparent description_color cursor-pointer"
                                onClick={onClearNotes}
                            />
                        </div>
                        <button
                            className="light_bg_color primary_text_color rounded-lg text-white p-3 w-2/5"
                            onClick={onSaveNotes}
                        >
                            {t("save")}
                        </button>
                    </div>
                </div>

                {/* Collapsed "Add Instruction" button */}
                {!activeNotes && (
                    <button
                        className={`mt-4 flex items-center ${note ? "justify-start" : "justify-center"} p-3 rounded-md bg-[#2121212E] w-full gap-2`}
                        onClick={onToggleNotes}
                    >
                        <MdModeEdit size={22} />
                        <span className="text-sm font-normal">{note || t("addInstruction")}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ScheduleSection;
