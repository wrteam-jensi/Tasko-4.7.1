import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  MessageSquare,
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
  Mic,
  Wrench,
  Zap,
  Calendar,
  Plus,
  Info,
  ShieldCheck,
  Lock,
  ChevronRight,
  Gift,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomDateTimePicker from "../CustomDateTimePicker/CustomDateTimePicker";
import { useTranslation } from "@/components/Layout/TranslationContext";
import dayjs from "dayjs";
import { getAllCategoriesApi, makeCustomJobRequestApi } from "@/api/apiRoutes";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const AddCustomServiceDialog = ({ open, close, fetchBookings }) => {
  const t = useTranslation();
  const locationData = useSelector((state) => state?.location);
  const settingsData = useSelector((state) => state?.settingsData?.settings);
  const currencySymbol = settingsData?.currency_symbol || "XOF";

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState(null); // 'start' or 'end'
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [timeOption, setTimeOption] = useState("choose"); // 'today', 'week', 'choose', 'flexible'

  const [formValues, setFormValues] = useState({
    serviceTitle: "",
    serviceDescription: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    startDateTime: null,
    endDateTime: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleTimeOptionSelect = (option) => {
    setTimeOption(option);
    const now = dayjs();
    if (option === "today") {
      setFormValues((prev) => ({
        ...prev,
        startDateTime: now.toDate(),
        endDateTime: now.endOf("day").toDate(),
      }));
    } else if (option === "week") {
      setFormValues((prev) => ({
        ...prev,
        startDateTime: now.toDate(),
        endDateTime: now.add(7, "day").toDate(),
      }));
    } else if (option === "flexible") {
      setFormValues((prev) => ({
        ...prev,
        startDateTime: now.toDate(),
        endDateTime: now.add(1, "month").toDate(),
      }));
    }
  };

  const handleDateTimeClick = (type) => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  const handleDateTimeSelect = (value) => {
    setFormValues((prev) => ({
      ...prev,
      [datePickerType]: value,
    }));
    setShowDatePicker(false);
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await getAllCategoriesApi({});
      const categoriesData = response?.data || response;
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const clearForm = () => {
    setFormValues({
      serviceTitle: "",
      serviceDescription: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      startDateTime: null,
      endDateTime: null,
    });
    setTimeOption("choose");
  };

  const handleSubmit = async () => {
    if (!formValues.serviceTitle) {
      toast.error(t("pleaseEnterServiceTitle"));
      return;
    }
    if (!formValues.serviceDescription) {
      toast.error(t("pleaseEnterServiceDescription"));
      return;
    }
    if (!formValues.category) {
      toast.error(t("pleaseSelectService"));
      return;
    }
    if (!formValues.minPrice) {
      toast.error(t("pleaseEnterMinPrice"));
      return;
    }
    if (!formValues.maxPrice) {
      toast.error(t("pleaseEnterMaxPrice"));
      return;
    }
    if (Number(formValues.maxPrice) <= Number(formValues.minPrice)) {
      toast.error(t("maxPriceMustBeGreaterThanMinPrice"));
      return;
    }
    if (!formValues.startDateTime) {
      toast.error(t("pleaseSelectStartDateTime"));
      return;
    }
    if (!formValues.endDateTime) {
      toast.error(t("pleaseSelectEndDateTime"));
      return;
    }
    try {
      setLoading(true);
      const startDate = dayjs(formValues.startDateTime).format("YYYY-MM-DD");
      const startTime = dayjs(formValues.startDateTime).format("HH:mm:ss");
      const endDate = dayjs(formValues.endDateTime).format("YYYY-MM-DD");
      const endTime = dayjs(formValues.endDateTime).format("HH:mm:ss");

      const response = await makeCustomJobRequestApi({
        category_id: formValues.category,
        service_short_description: formValues.serviceDescription,
        end_date_time: formValues.endDateTime,
        min_price: formValues.minPrice,
        max_price: formValues.maxPrice,
        requested_start_date: startDate,
        requested_start_time: startTime,
        requested_end_date: endDate,
        requested_end_time: endTime,
        service_title: formValues.serviceTitle,
        latitude: locationData?.lat,
        longitude: locationData?.lng,
      });
      if (response?.error === false) {
        toast.success(response?.message);
        close();
        fetchBookings();
        clearForm();
      } else {
        toast.error(response?.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const timeOptionCards = [
    {
      id: "today",
      title: t("today"),
      sub: t("asSoonAsPossible"),
      icon: Zap,
      color: "text-orange-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    {
      id: "week",
      title: t("thisWeek"),
      sub: t("within7Days"),
      icon: Calendar,
      color: "text-blue-500",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      id: "choose",
      title: t("chooseDates"),
      sub: t("pickSpecificDates"),
      icon: Plus,
      color: "text-green-500",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      id: "flexible",
      title: t("flexible"),
      sub: t("imFlexible"),
      icon: Info,
      color: "text-purple-500",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 border-none sm:rounded-[24px] scrollbar-hide">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center gap-4">
          <button
            onClick={close}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {t("requestQuote") || "Request a Quote"}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              {t("describeYourNeed") ||
                "Describe your need, we'll find the best pros for you."}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Section 1: Help Input */}
          <div className="bg-white border rounded-[20px] p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <Pencil size={20} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-semibold text-gray-900">
                {t("whatDoYouNeedHelpWith") || "What do you need help with?"}
              </label>
              <input
                type="text"
                name="serviceTitle"
                placeholder="Ex.: Air conditioner repair"
                className="w-full text-base focus:outline-none placeholder:text-gray-400"
                onChange={handleChange}
                value={formValues.serviceTitle}
              />
            </div>
          </div>

          {/* Section 2: Problem Description */}
          <div className="bg-white border rounded-[20px] p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <MessageSquare size={20} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-900">
                  {t("describeTheProblem") || "Describe the problem"}
                </label>
                <span className="text-[10px] text-gray-400 font-medium">
                  {formValues.serviceDescription.length}/500
                </span>
              </div>
              <textarea
                name="serviceDescription"
                placeholder="Provide as many details as possible (symptoms, context, etc.)"
                className="w-full text-base focus:outline-none resize-none min-h-[80px] placeholder:text-gray-400"
                maxLength={500}
                onChange={handleChange}
                value={formValues.serviceDescription}
              />
            </div>
          </div>

          {/* AI Banner */}
          <button className="w-full bg-[#EBF1FF] hover:bg-[#DEE8FF] transition-colors rounded-[16px] py-3 px-4 flex items-center justify-center gap-2 group">
            <Sparkles
              className="text-blue-600 group-hover:scale-110 transition-transform"
              size={18}
            />
            <span className="text-blue-600 font-semibold text-sm">
              {t("improveRequestWithAI") || "Improve my request with AI"}
            </span>
            <span className="bg-blue-600 text-white rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase">
              {t("recommended") || "Recommended"}
            </span>
          </button>

          {/* Section 3: Attachments */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold flex items-baseline gap-1">
              {t("addAttachments") || "Add attachments"}
              <span className="text-gray-400 font-normal text-xs">
                ({t("optional") || "optional"})
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              {t("addPhotosOrFiles") ||
                "Add photos or files to help pros understand your request better."}
            </p>

            <div className="grid grid-cols-4 gap-3 bg-gray-50/50 p-4 border border-dashed rounded-[20px]">
              {[
                { icon: ImageIcon, label: t("photo"), color: "text-blue-500" },
                { icon: Video, label: t("video"), color: "text-green-500" },
                { icon: FileText, label: t("file"), color: "text-orange-500" },
                { icon: Mic, label: t("voiceNote"), color: "text-purple-500" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  className="bg-white rounded-[16px] p-3 flex flex-col items-center justify-center gap-1.5 border hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <item.icon className={item.color} size={24} />
                  <span className="text-[11px] font-semibold text-gray-700">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 text-center uppercase tracking-wider font-semibold">
              JPG, PNG, MP4, PDF up to 10MB each
            </p>
          </div>

          {/* Section 4: Category */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold">
              {t("serviceCategory") || "Service category"}
            </h3>
            <p className="text-xs text-gray-500">
              {t("weDetectAutomatically") ||
                "We detect it automatically, you can change it."}
            </p>

            <div className="bg-white border rounded-[20px] p-4 flex items-center gap-4 hover:shadow-md transition-shadow relative">
              <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <Wrench size={20} />
              </div>
              <div className="flex-1">
                <Select
                  onValueChange={(value) =>
                    setFormValues((prevValues) => ({
                      ...prevValues,
                      category: value,
                    }))
                  }
                  value={formValues.category}
                >
                  <SelectTrigger className="w-full border-none p-0 h-auto focus:ring-0 shadow-none text-left">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {t("selectCategory") || "Select a category"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {t("categoryEx") ||
                          "Ex.: Air Conditioning, Electrical, Plumbing"}
                      </span>
                    </div>
                    <ChevronRight className="ml-auto text-blue-600" size={20} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] z-[9999] rounded-[20px]">
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>
                        {t("loading")}...
                      </SelectItem>
                    ) : categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.translated_name || cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {t("noCategoriesAvailable")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 5: Budget */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold flex items-baseline gap-1">
              {t("budget") || "Budget"}
              <span className="text-gray-400 font-normal text-xs">
                ({t("optional") || "optional"})
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              {t("helpProsGiveQuotes") || "Help pros give you accurate quotes"}
            </p>

            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900">Min.</span>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    name="minPrice"
                    placeholder={currencySymbol}
                    className="w-full border rounded-[12px] py-2.5 px-4 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                    onChange={handleChange}
                    value={formValues.minPrice}
                  />
                </div>
              </div>
              <span className="text-gray-300">—</span>
              <div className="flex-1 flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900">Max.</span>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder={currencySymbol}
                    className="w-full border rounded-[12px] py-2.5 px-4 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                    onChange={handleChange}
                    value={formValues.maxPrice}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: When */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold">
              {t("whenDoYouNeedService") || "When do you need the service?"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {timeOptionCards.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleTimeOptionSelect(opt.id)}
                  className={`flex flex-col items-start p-3 rounded-[16px] border-2 transition-all text-left group
                    ${timeOption === opt.id ? `${opt.bg} ${opt.border}` : "bg-white border-transparent hover:border-gray-100 hover:shadow-sm"}
                  `}
                >
                  <opt.icon
                    className={`${opt.color} mb-2 group-hover:scale-110 transition-transform`}
                    size={20}
                  />
                  <span
                    className={`text-[13px] font-bold ${timeOption === opt.id ? "text-gray-900" : "text-gray-700"}`}
                  >
                    {opt.title}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-tight mt-0.5">
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>

            {timeOption === "choose" && (
              <div className="bg-gray-50 rounded-[20px] p-4 space-y-3">
                <button
                  onClick={() => handleDateTimeClick("startDateTime")}
                  className={`w-full bg-white border rounded-[16px] px-4 py-3 flex items-center gap-3 transition-all ${datePickerType === "startDateTime" && showDatePicker ? "border-blue-500 shadow-sm" : "hover:border-blue-200"}`}
                >
                  <Calendar className="text-blue-600" size={18} />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {t("startDate") || "Start date"}{" "}
                      <span className="font-normal">
                        ({t("optional") || "optional"})
                      </span>
                    </span>
                    <span
                      className={`text-sm font-semibold ${formValues.startDateTime ? "text-gray-900" : "text-gray-400"}`}
                    >
                      {formValues.startDateTime
                        ? dayjs(formValues.startDateTime).format(
                            "MMM D, YYYY h:mm A",
                          )
                        : t("selectDateAndTime") || "Select date and time"}
                    </span>
                  </div>
                  <ChevronRight
                    className={`ml-auto text-gray-300 transition-transform ${datePickerType === "startDateTime" && showDatePicker ? "rotate-90" : ""}`}
                    size={18}
                  />
                </button>

                <button
                  onClick={() => handleDateTimeClick("endDateTime")}
                  className={`w-full bg-white border rounded-[16px] px-4 py-3 flex items-center gap-3 transition-all ${datePickerType === "endDateTime" && showDatePicker ? "border-orange-500 shadow-sm" : "hover:border-blue-200"}`}
                >
                  <Calendar className="text-orange-600" size={18} />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {t("endDate") || "End date"}{" "}
                      <span className="font-normal">
                        ({t("optional") || "optional"})
                      </span>
                    </span>
                    <span
                      className={`text-sm font-semibold ${formValues.endDateTime ? "text-gray-900" : "text-gray-400"}`}
                    >
                      {formValues.endDateTime
                        ? dayjs(formValues.endDateTime).format(
                            "MMM D, YYYY h:mm A",
                          )
                        : t("selectDateAndTime") || "Select date and time"}
                    </span>
                  </div>
                  <ChevronRight
                    className={`ml-auto text-gray-300 transition-transform ${datePickerType === "endDateTime" && showDatePicker ? "rotate-90" : ""}`}
                    size={18}
                  />
                </button>

                {/* Inline Date Picker */}
                {showDatePicker && (
                  <div className="bg-white rounded-[20px] border p-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                      <div className="flex items-center gap-2">
                        {datePickerType === "startDateTime" ? (
                          <Calendar className="text-blue-600" size={16} />
                        ) : (
                          <Calendar className="text-orange-600" size={16} />
                        )}
                        <span className="text-sm font-bold text-gray-900">
                          {datePickerType === "startDateTime"
                            ? t("selectStartDateAndTime")
                            : t("selectEndDateAndTime")}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowDatePicker(false);
                          setDatePickerType(null);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <CustomDateTimePicker
                      value={formValues[datePickerType]}
                      onChange={handleDateTimeSelect}
                      minDateTime={
                        datePickerType === "endDateTime"
                          ? formValues.startDateTime
                          : null
                      }
                      type={datePickerType}
                    />
                  </div>
                )}

                <p className="text-[11px] text-gray-400 px-1">
                  {t("leaveEndDateEmpty") ||
                    "Leave the end date empty if you're not sure yet."}
                </p>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-2 bg-gray-50/80 rounded-[20px] p-4">
            {[
              {
                icon: ShieldCheck,
                title: t("verifiedPros") || "Verified pros",
                sub: t("qualityAssured") || "Quality assured",
                color: "text-blue-500",
              },
              {
                icon: Zap,
                title: t("fastResponses") || "Fast responses",
                sub: t("usuallyWithin1Hour") || "Usually within 1 hour",
                color: "text-orange-500",
              },
              {
                icon: Gift,
                title: t("freeToUse") || "Free to use",
                sub: t("noCommitment") || "No commitment",
                color: "text-green-500",
              },
            ].map((badge, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center gap-1 border-r last:border-r-0 px-2"
              >
                <badge.icon className={badge.color} size={20} />
                <span className="text-[11px] font-bold text-gray-900 leading-tight">
                  {badge.title}
                </span>
                <span className="text-[9px] text-gray-500 leading-tight">
                  {badge.sub}
                </span>
              </div>
            ))}
          </div>

          {/* Info Banner */}
          <div className="bg-[#EBF5FF] border border-blue-100 rounded-[16px] p-4 flex gap-3">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">i</span>
            </div>
            <p className="text-[13px] text-blue-800 font-medium">
              {t("moreDetailsBetterQuotes") ||
                "The more details you provide, the more accurate the quotes."}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pb-6">
            <Button
              className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-[16px] py-7 text-lg font-bold flex items-center justify-center gap-3 group transition-all"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                t("processing")
              ) : (
                <>
                  {t("submitRequest") || "Submit Request"}
                  <ChevronRight
                    className="group-hover:translate-x-1 transition-transform"
                    size={24}
                  />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomServiceDialog;
