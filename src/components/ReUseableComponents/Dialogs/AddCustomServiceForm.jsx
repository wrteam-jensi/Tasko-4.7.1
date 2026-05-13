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
  CreditCard,
  Plus,
  Info,
  ShieldCheck,
  Lock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Gift,
  X,
  Trash2,
  Square,
  Check,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomDateTimePicker from "../CustomDateTimePicker/CustomDateTimePicker";
import { useTranslation } from "@/components/Layout/TranslationContext";
import dayjs from "dayjs";
import {
  getCategoriesHierarchicalApi,
  makeCustomJobRequestApi,
  enhanceCustomJobRequestApi,
} from "@/api/apiRoutes";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRef } from "react";

const quoteAllowedDocExtensions = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "rtf",
];
const quoteAllowedImageExtensions = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "heic",
  "heif",
];
const quoteAllowedVideoExtensions = [
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "m4v",
  "3gp",
];
const quoteAllowedAudioExtensions = ["m4a", "mp3", "wav", "aac", "ogg", "flac"];

const AddCustomServiceForm = ({ close, fetchBookings, provider_id }) => {
  const t = useTranslation();
  const settingsData = useSelector((state) => state?.settingsData?.settings);
  const locationData = useSelector((state) => state?.location);
  const currencySymbol = settingsData?.general_settings?.currency || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState(null); // 'start' or 'end'
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [timeOption, setTimeOption] = useState("flexible");
  const [isImproving, setIsImproving] = useState(false);

  const [isManualCategory, setIsManualCategory] = useState(false);
  const [formValues, setFormValues] = useState({
    serviceTitle: "",
    serviceDescription: "",
    category: "",
    subCategory: "",
    minPrice: "",
    maxPrice: "",
    startDateTime: null,
    endDateTime: null,
  });
  const [customDates, setCustomDates] = useState({
    startDateTime: dayjs().toDate(),
    endDateTime: dayjs().add(1, "day").toDate(),
  });
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // Auto-category detection logic
  useEffect(() => {
    // If the user has manually selected a category, we don't override it automatically
    // unless the title is completely cleared, which might suggest a fresh start.
    if (isManualCategory && formValues.serviceTitle.length > 0) return;

    // Trigger auto-detection starting from 1 character as requested
    if (
      categories.length > 0 &&
      formValues.serviceTitle &&
      formValues.serviceTitle.length >= 1
    ) {
      const title = formValues.serviceTitle.toLowerCase();
      const detectedCategory = categories.find((cat) => {
        const catName = (cat.translated_name || cat.name).toLowerCase();
        const catWords = catName.split(/\s+/);

        // Match if:
        // 1. The title contains the category name (e.g., "urgent fridge repair" -> "Fridge repair")
        // 2. The category name starts with the title (e.g., "Fri" -> "Fridge repair")
        // 3. Any word in the category name starts with the title, but only for 3+ chars to avoid "f" -> "fridge"
        //    UNLESS the title is an exact word match.
        return (
          title.includes(catName) ||
          catName.startsWith(title) ||
          catWords.some(
            (word) =>
              (title.length >= 3 && word.startsWith(title)) || word === title,
          )
        );
      });

      if (detectedCategory) {
        setFormValues((prev) => ({ ...prev, category: detectedCategory.id }));
      } else {
        // If no match found and it wasn't a manual selection, reset the category
        setFormValues((prev) => ({ ...prev, category: "" }));
      }
    } else if (formValues.serviceTitle.length === 0) {
      // Clear category and reset manual flag if title is emptied
      if (isManualCategory) {
        setIsManualCategory(false);
      }
      setFormValues((prev) => ({ ...prev, category: "" }));
    }
  }, [formValues.serviceTitle, categories, isManualCategory]);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioFile = new File(
          [audioBlob],
          `voice-note-${Date.now()}.wav`,
          {
            type: "audio/wav",
          },
        );
        setAttachments((prev) => [...prev, audioFile]);
        setIsRecording(false);
        setRecordingDuration(0);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error(
        t("microphoneError") ||
          "Could not access microphone. Please check your browser permissions.",
      );
    }
  };

  const stopRecording = (shouldSave = true) => {
    if (mediaRecorderRef.current && isRecording) {
      if (!shouldSave) {
        mediaRecorderRef.current.onstop = () => {
          setIsRecording(false);
          setRecordingDuration(0);
          const stream = mediaRecorderRef.current.stream;
          stream.getTracks().forEach((track) => track.stop());
        };
      }
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
    }
  };

  const [playingIndex, setPlayingIndex] = useState(null);
  const audioRef = useRef(null);

  const togglePlayback = (file, index) => {
    if (playingIndex === index) {
      audioRef.current.pause();
      setPlayingIndex(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const url = URL.createObjectURL(file);
      audioRef.current = new Audio(url);
      audioRef.current.play();
      setPlayingIndex(index);
      audioRef.current.onended = () => setPlayingIndex(null);
    }
  };

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
    } else if (option === "choose") {
      setFormValues((prev) => ({
        ...prev,
        startDateTime: customDates.startDateTime,
        endDateTime: customDates.endDateTime,
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
    setCustomDates((prev) => ({
      ...prev,
      [datePickerType]: value,
    }));
    setShowDatePicker(false);
  };

  const requestQuoteSettings = settingsData?.request_quote_settings;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Get limits with safe fallbacks
    const maxFilesAllowed = parseInt(requestQuoteSettings?.max_files_allowed);
    const maxSizeImages =
      parseInt(requestQuoteSettings?.max_file_size_images) * 1024 * 1024;
    const maxSizeVideo =
      parseInt(requestQuoteSettings?.max_file_size_video) * 1024 * 1024;
    const maxSizeAudio =
      parseInt(requestQuoteSettings?.max_file_size_audio) * 1024 * 1024;
    const maxSizeOther =
      parseInt(requestQuoteSettings?.max_file_size_other) * 1024 * 1024;

    // Check total files count limit
    if (attachments.length + files.length > maxFilesAllowed) {
      toast.error(
        `${t("maxFilesAllowed") || "Maximum files allowed is"} ${maxFilesAllowed}`,
      );
      e.target.value = "";
      return;
    }

    // Filter files based on individual size limits and allowed extensions
    const validFiles = files.filter((file) => {
      const extension = file.name.split(".").pop().toLowerCase();
      let maxSize = maxSizeOther;
      let isAllowed = false;

      if (quoteAllowedImageExtensions.includes(extension)) {
        isAllowed = true;
        maxSize = maxSizeImages;
      } else if (quoteAllowedVideoExtensions.includes(extension)) {
        isAllowed = true;
        maxSize = maxSizeVideo;
      } else if (quoteAllowedAudioExtensions.includes(extension)) {
        isAllowed = true;
        maxSize = maxSizeAudio;
      } else if (quoteAllowedDocExtensions.includes(extension)) {
        isAllowed = true;
        maxSize = maxSizeOther;
      }

      return isAllowed && file.size <= maxSize;
    });

    // Notify user if any files were rejected due to size or type
    if (validFiles.length < files.length) {
      toast.error(
        t("someFilesInvalid") ||
          "Some files were too large or have unsupported formats.",
      );
    }

    setAttachments((prev) => [...prev, ...validFiles]);
    e.target.value = ""; // Reset input
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return <ImageIcon size={16} />;
    if (type.startsWith("video/")) return <Video size={16} />;
    if (type.startsWith("audio/")) return <Mic size={16} />;
    return <FileText size={16} />;
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await getCategoriesHierarchicalApi();
      const categoriesData = response?.data || response;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
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
      subCategory: "",
      minPrice: "",
      maxPrice: "",
      startDateTime: null,
      endDateTime: null,
    });
    setTimeOption("flexible");
    setAttachments([]);
    setCurrentStep(1);
    setIsManualCategory(false);
    setExpandedCategoryId(null);
    setCategoryDropdownOpen(false);
  };

  const handleAIImprove = async () => {
    if (
      !formValues.serviceDescription ||
      formValues.serviceDescription.length < 10
    ) {
      toast.error(t("pleaseProvideMoreDetails"));
      return;
    }

    try {
      setIsImproving(true);
      const response = await enhanceCustomJobRequestApi({
        service_title: formValues.serviceTitle,
        service_short_description: formValues.serviceDescription,
      });

      if (response?.error === false) {
        setFormValues((prev) => ({
          ...prev,
          serviceTitle: response.data?.service_title || response.service_title,
          serviceDescription:
            response.data?.service_short_description ||
            response.service_short_description,
        }));
        toast.success(t("aiImprovedDescription"));
      } else {
        toast.error(response?.message || t("somethingWentWrongTitle"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("somethingWentWrongTitle"));
    } finally {
      setIsImproving(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formValues.serviceTitle) {
        toast.error(
          t("pleaseEnterServiceTitle") || "Please enter a service title",
        );
        return;
      }
      if (!formValues.serviceDescription) {
        toast.error(
          t("pleaseEnterServiceDescription") || "Please describe your problem",
        );
        return;
      }
    }

    if (currentStep === 2) {
      if (!formValues.category) {
        toast.error(t("selectServiceCategory"));
        return;
      }
    }

    if (currentStep === 5) {
      const min = Number(formValues.minPrice) || 0;
      const max = Number(formValues.maxPrice) || 0;

      if (max > 0 && min > max) {
        toast.error(
          t("minBudgetExceedsMax") ||
            "Min budget cannot be greater than max budget",
        );
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    // Budget Validation
    const min = Number(formValues.minPrice) || 0;
    const max = Number(formValues.maxPrice) || 0;

    if (max > 0 && min > max) {
      toast.error(
        t("minBudgetExceedsMax") ||
          "Min budget cannot be greater than max budget",
      );
      return;
    }

    try {
      setLoading(true);

      const typeMap = {
        today: "one_day",
        week: "week",
        flexible: "flexible",
        choose: "custom",
      };
      const type = typeMap[timeOption] || "flexible";

      const toUTC = (date) =>
        new Date(date).toISOString().replace("T", " ").slice(0, 19);

      const payload = {
        category_id: formValues.subCategory || formValues.category || categories[0]?.id || "1",
        service_title: formValues.serviceTitle,
        service_short_description: formValues.serviceDescription,
        min_price: formValues.minPrice,
        max_price: formValues.maxPrice,
        type,
        latitude: locationData?.lat || "",
        longitude: locationData?.lng || "",
        provider_id: provider_id || "",
        files: attachments,
      };

      if (type === "custom") {
        if (formValues.startDateTime) {
          payload.requested_start_date_time = toUTC(formValues.startDateTime);
        }
        if (formValues.endDateTime) {
          payload.requested_end_date_time = toUTC(formValues.endDateTime);
        }
      }

      const response = await makeCustomJobRequestApi(payload);

      if (response?.error === false) {
        toast.success(response?.message);
        close();
        if (fetchBookings) fetchBookings();
        clearForm();
      } else {
        const msg =
          typeof response?.message === "object" && response?.message !== null
            ? Object.values(response.message).flat().join(", ")
            : response?.message;
        toast.error(msg);
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  // fetchCategories based on component mount since it's now inline
  useEffect(() => {
    fetchCategories();
  }, []);

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

  const steps = [
    { id: 1, title: t("serviceInfo") || "Service Info", icon: Pencil },
    { id: 2, title: t("category") || "Category", icon: Wrench },
    { id: 3, title: t("addAttachments") || "Attachments", icon: ImageIcon },
    { id: 4, title: t("scheduling") || "Scheduling", icon: Calendar },
    { id: 5, title: t("budget") || "Budget", icon: CreditCard },
    { id: 6, title: t("review") || "Review", icon: Check },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500 bg-white dark:bg-gray-900 min-h-[70vh] px-4 md:px-6">
      {/* Compact Header & Stepper Progress */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100/80 dark:border-gray-700/80">
        <div className="px-6 py-4 flex items-center justify-between"></div>

        {/* Sleek Minimalist Stepper */}
        <div className="pb-6 pt-2 flex items-center gap-6">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2 group">
                <div
                  className={`
                    w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 text-[10px] font-semibold
                    ${currentStep >= step.id ? "bg-blue-600 text-white " : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"}
                  `}
                >
                  {currentStep > step.id ? (
                    <Check size={12} strokeWidth={3} />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-[13px] font-semibold uppercase tracking-wider hidden sm:block whitespace-nowrap ${currentStep >= step.id ? "text-blue-600" : "text-gray-400 dark:text-gray-500"}`}
                >
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[2px] bg-gray-100 dark:bg-gray-700 rounded-full mx-1">
                  <div
                    className={`h-full bg-blue-600 rounded-full transition-all duration-500 ${currentStep > step.id ? "w-full" : "w-0"}`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="py-8 md:py-10">
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Step 1: Service Title + Description */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 flex items-start gap-4 transition-all focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 shadow-sm">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                <Pencil size={18} />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[13px] font-semibold uppercase tracking-widest flex items-center gap-2 text-gray-400 dark:text-gray-500">
                  {t("serviceTitle") || "Service Title"}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="serviceTitle"
                  placeholder="Ex: Kitchen Sink Repair"
                  className="w-full text-base focus:outline-none placeholder:text-gray-200 dark:placeholder:text-gray-600 bg-transparent text-gray-900 dark:text-gray-100"
                  onChange={handleChange}
                  value={formValues.serviceTitle}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 flex items-start gap-4 transition-all focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 shadow-sm">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                <MessageSquare size={18} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {t("description") || "Description"}
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[9px] bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-400 dark:text-gray-500 font-semibold">
                    {formValues.serviceDescription.length}/500
                  </span>
                </div>
                <textarea
                  name="serviceDescription"
                  placeholder="Tell us more about what you need..."
                  className="w-full text-sm focus:outline-none resize-none min-h-[100px] placeholder:text-gray-200 dark:placeholder:text-gray-600 bg-transparent text-gray-900 dark:text-gray-100 leading-relaxed"
                  maxLength={500}
                  onChange={handleChange}
                  value={formValues.serviceDescription}
                />
              </div>
            </div>

            {/* AI Improve Action */}
            <button
              onClick={handleAIImprove}
              disabled={isImproving}
              className="w-full h-12 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900 hover:border-blue-600 dark:hover:border-blue-500 rounded-lg px-4 flex items-center justify-between group transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg ${isImproving ? "animate-spin" : ""}`}
                >
                  <Sparkles className="text-blue-600" size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {isImproving
                    ? "Refining Details..."
                    : "Improve with Smart AI"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:block px-2 py-0.5 bg-blue-600 text-white text-[9px] font-semibold rounded-lg uppercase">
                  New
                </div>
                <ChevronRight
                  size={14}
                  className="text-blue-600 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 flex-shrink-0">
                  <Wrench size={18} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-0.5">
                    {t("category") || "Category"}
                  </span>
                  {(() => {
                    const selectedCat = categories.find((c) => c.id === formValues.category);
                    const selectedSub = formValues.subCategory
                      ? (selectedCat?.children || []).find((s) => s.id === formValues.subCategory)
                      : null;
                    const display = selectedSub || selectedCat;
                    const displayImg = display?.image || display?.category_image;
                    const displayName = display
                      ? display.translated_name || display.category_name || display.name
                      : t("selectCategory") || "Choose category";
                    return (
                      <div className="flex items-center gap-2">
                        {displayImg && (
                          <img src={displayImg} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                            {displayName}
                          </span>
                          {selectedSub && selectedCat && (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1">
                              {selectedCat.translated_name || selectedCat.category_name || selectedCat.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${categoryDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Category list — shown only when open */}
              {categoryDropdownOpen && (
              <div className="border-t border-gray-100 dark:border-gray-700 max-h-[55vh] overflow-y-auto">
                {categoriesLoading ? (
                  <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse flex-shrink-0" />
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse flex-shrink-0" />
                        <div className="h-4 bg-gray-100 dark:bg-gray-700 animate-pulse rounded flex-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {categories.map((cat) => {
                      const catImg = cat.image || cat.category_image;
                      const catName = cat.translated_name || cat.category_name || cat.name;
                      const isSelected = formValues.category === cat.id;
                      const isExpanded = expandedCategoryId === cat.id;
                      const catSubCategories = Array.isArray(cat.children) ? cat.children : [];
                      const hasSubCategories = catSubCategories.length > 0;

                      return (
                        <div key={cat.id}>
                          {/* Category row */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualCategory(true);
                              setFormValues((prev) => ({
                                ...prev,
                                category: cat.id,
                                subCategory: "",
                              }));
                              if (!hasSubCategories) {
                                setCategoryDropdownOpen(false);
                              } else if (isExpanded) {
                                setExpandedCategoryId(null);
                              } else {
                                setExpandedCategoryId(cat.id);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-900/20"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                            }`}
                          >
                            {/* Image */}
                            {catImg ? (
                              <img
                                src={catImg}
                                alt=""
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <Wrench size={18} className="text-gray-400" />
                              </div>
                            )}
                            {/* Name */}
                            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {catName}
                            </span>
                            {/* Chevron — hidden if no subcategories */}
                            {hasSubCategories && (
                              isExpanded ? (
                                <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                              )
                            )}
                          </button>

                          {/* Subcategories — inline below parent */}
                          {isExpanded && hasSubCategories && (
                            <div className="divide-y divide-gray-50 dark:divide-gray-700/30 bg-gray-50/50 dark:bg-gray-700/20">
                              {catSubCategories.map((sub) => {
                                  const subImg = sub.category_image || sub.image;
                                  const subName = sub.translated_name || sub.name;
                                  const isSubSelected = formValues.subCategory === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() => {
                                        setFormValues((prev) => ({
                                          ...prev,
                                          subCategory: isSubSelected ? "" : sub.id,
                                        }));
                                        if (!isSubSelected) setCategoryDropdownOpen(false);
                                      }}
                                      className={`w-full flex items-center gap-3 pl-12 pr-4 py-3 text-left transition-colors ${
                                        isSubSelected
                                          ? "bg-blue-50/70 dark:bg-blue-900/15"
                                          : "hover:bg-gray-100 dark:hover:bg-gray-700/40"
                                      }`}
                                    >
                                      {subImg ? (
                                        <img
                                          src={subImg}
                                          alt=""
                                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
                                      )}
                                      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {subName}
                                      </span>
                                    </button>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Step 3: Attachments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[13px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center">
                  {t("addAttachments") || "Attachments"}
                  <span className="ml-2 text-[11px] font-normal lowercase italic tracking-normal text-gray-300 dark:text-gray-600">
                    (optional)
                  </span>
                </h3>
              </div>
              <div
                className={`p-6 border-2 border-dashed rounded-lg transition-all duration-500 ${isRecording ? "bg-purple-50/50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700"}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
                {!isRecording ? (
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      {
                        icon: ImageIcon,
                        label: "Photo",
                        color: "text-blue-500",
                        accept: "image/*",
                      },
                      {
                        icon: Video,
                        label: "Video",
                        color: "text-emerald-500",
                        accept: "video/*",
                      },
                      {
                        icon: Mic,
                        label: "Voice",
                        color: "text-purple-500",
                        type: "voice",
                      },
                      {
                        icon: FileText,
                        label: "File",
                        color: "text-orange-500",
                        accept: ".pdf,.doc,.docx,.txt",
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (item.type === "voice") {
                            startRecording();
                          } else {
                            fileInputRef.current.setAttribute(
                              "accept",
                              item.accept,
                            );
                            fileInputRef.current.click();
                          }
                        }}
                        className="group flex flex-col items-center gap-2 p-2"
                      >
                        <div
                          className={`${item.color} transition-all group-hover:scale-110 group-hover:-translate-y-1`}
                        >
                          <item.icon size={28} />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-purple-50/50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white animate-pulse shadow-lg shadow-red-200 dark:shadow-red-900">
                        <Mic size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-purple-600 dark:text-purple-400">
                          Recording...
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                          {formatTime(recordingDuration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => stopRecording(false)}
                        className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-400 hover:text-red-500 shadow-sm flex items-center justify-center transition-all"
                      >
                        <X size={18} />
                      </button>
                      <button
                        onClick={() => stopRecording(true)}
                        className="w-10 h-10 rounded-full bg-purple-600 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-all"
                      >
                        <Check size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {requestQuoteSettings && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
                  {[
                    requestQuoteSettings.max_files_allowed &&
                      `Max ${requestQuoteSettings.max_files_allowed} files`,
                    requestQuoteSettings.max_file_size_images &&
                      `JPG, PNG up to ${requestQuoteSettings.max_file_size_images}MB`,
                    requestQuoteSettings.max_file_size_video &&
                      `MP4 up to ${requestQuoteSettings.max_file_size_video}MB`,
                    requestQuoteSettings.max_file_size_audio &&
                      `MP3, WAV up to ${requestQuoteSettings.max_file_size_audio}MB`,
                    requestQuoteSettings.max_file_size_other &&
                      `PDF, DOC, XLS up to ${requestQuoteSettings.max_file_size_other}MB`,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              )}

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-700 transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 group-hover:text-blue-500 transition-colors shadow-sm">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                            {file.type.startsWith("audio/") && (
                              <button
                                onClick={() => togglePlayback(file, index)}
                                className="text-[9px] text-blue-600 px-2 py-0.5 font-bold uppercase transition-all flex items-center gap-1"
                              >
                                {playingIndex === index ? (
                                  <>
                                    <Pause size={10} /> Playing
                                  </>
                                ) : (
                                  <>
                                    <Play size={10} />{" "}
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.type.startsWith("image/") && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-600 shadow-sm hidden sm:block">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Step 4: Scheduling */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  Scheduling
                </h3>
                <div className="h-[1px] flex-1 bg-gray-100/60 dark:bg-gray-700/60" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {timeOptionCards.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleTimeOptionSelect(opt.id)}
                    className={`group flex flex-col items-center text-center p-3.5 rounded-lg border-2 transition-all duration-300 relative overflow-hidden active:scale-[0.97]
                          ${
                            timeOption === opt.id
                              ? `${opt.border} bg-white dark:bg-gray-800 shadow-xl shadow-gray-100 dark:shadow-gray-900 scale-[1.02] z-10`
                              : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 "
                          }
                        `}
                  >
                    {timeOption === opt.id && (
                      <div
                        className={`absolute -bottom-6 -right-6 w-16 h-16 ${opt.bg} opacity-20 rounded-full blur-2xl transition-all duration-500`}
                      />
                    )}

                    <div
                      className={`p-2.5 ${opt.bg} ${opt.color} rounded-lg mb-2.5 transition-all duration-500 group-hover:scale-110 shadow-sm`}
                    >
                      <opt.icon size={18} />
                    </div>

                    <div className="space-y-1 relative z-10">
                      <span
                        className={`block text-[11px] font-bold uppercase tracking-[0.05em] transition-colors duration-300 ${
                          timeOption === opt.id
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                        }`}
                      >
                        {opt.title}
                      </span>
                      <span
                        className={`text-[9px] font-medium leading-tight block transition-colors duration-300 ${
                          timeOption === opt.id
                            ? "text-gray-500 dark:text-gray-400"
                            : "text-gray-400/80 dark:text-gray-600"
                        }`}
                      >
                        {opt.sub}
                      </span>
                    </div>

                    {timeOption === opt.id && (
                      <div
                        className={`absolute top-3 right-3 w-2 h-2 rounded-full ${opt.color.replace(
                          "text-",
                          "bg-",
                        )} animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                      />
                    )}
                  </button>
                ))}
              </div>

              {timeOption === "choose" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-5 space-y-4 border border-gray-100 dark:border-gray-700 shadow-gray-100/50 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleDateTimeClick("startDateTime")}
                      className={`group p-4 rounded-lg text-left transition-all border-2 flex items-center gap-4 ${
                        datePickerType === "startDateTime" && showDatePicker
                          ? "border-blue-600 bg-blue-50/30 dark:bg-blue-900/20 shadow-sm"
                          : "border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 hover:border-blue-200 dark:hover:border-blue-700"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg transition-all duration-300 ${
                          datePickerType === "startDateTime" && showDatePicker
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-700 text-gray-400"
                        }`}
                      >
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] mb-0.5">
                          Start Schedule
                        </p>
                        <p
                          className={`text-sm font-bold transition-colors ${
                            formValues.startDateTime
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        >
                          {formValues.startDateTime
                            ? dayjs(formValues.startDateTime).format(
                                "ddd, MMM D • HH:mm",
                              )
                            : "Set start time"}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDateTimeClick("endDateTime")}
                      className={`group p-4 rounded-lg text-left transition-all border-2 flex items-center gap-4 ${
                        datePickerType === "endDateTime" && showDatePicker
                          ? "border-orange-500 bg-orange-50/30 dark:bg-orange-900/20"
                          : "border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg transition-all duration-300 ${
                          datePickerType === "endDateTime" && showDatePicker
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-gray-700 text-gray-400"
                        }`}
                      >
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] mb-0.5">
                          End Schedule
                        </p>
                        <p
                          className={`text-sm font-bold transition-colors ${
                            formValues.endDateTime
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        >
                          {formValues.endDateTime
                            ? dayjs(formValues.endDateTime).format(
                                "ddd, MMM D • HH:mm",
                              )
                            : "Set end time"}
                        </p>
                      </div>
                    </button>
                  </div>
                  {showDatePicker && (
                    <div className="pt-2 border-t border-gray-50 dark:border-gray-700">
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
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Step 5: Budget */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  Expected Budget ({currencySymbol})
                </h3>
                <div className="h-[1px] flex-1 bg-gray-100/60 dark:bg-gray-700/60" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="group bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-100 dark:border-gray-700 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all shadow-sm hover:shadow-md">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5 transition-colors group-focus-within:text-blue-500">
                    Min Budget
                  </label>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 transition-all font-bold text-base">
                      {currencySymbol}
                    </div>
                    <input
                      type="number"
                      name="minPrice"
                      min="0"
                      placeholder="0"
                      className="w-full text-base font-bold focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-200 dark:placeholder:text-gray-600"
                      onChange={handleChange}
                      value={formValues.minPrice}
                    />
                  </div>
                </div>
                <div className="group bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-100 dark:border-gray-700 focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all shadow-sm hover:shadow-md">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5 transition-colors group-focus-within:text-emerald-500">
                    Max Budget
                  </label>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 transition-all font-bold text-base">
                      {currencySymbol}
                    </div>
                    <input
                      type="number"
                      name="maxPrice"
                      min="0"
                      placeholder="0"
                      className="w-full text-base font-bold focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-200 dark:placeholder:text-gray-600"
                      onChange={handleChange}
                      value={formValues.maxPrice}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Request Summary
              </h3>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-100 dark:border-gray-700 shadow-2xl shadow-gray-200/40 dark:shadow-gray-900/40 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-90" />

              {/* Header Info */}
              <div className="flex flex-col gap-3 pb-6 border-b border-gray-50/80 dark:border-gray-700/80">
                {(() => {
                  const reviewCat = categories.find((c) => c.id === formValues.category);
                  const reviewSub = formValues.subCategory
                    ? (reviewCat?.children || []).find((s) => s.id === formValues.subCategory)
                    : null;
                  const catName = reviewCat?.translated_name || reviewCat?.category_name || reviewCat?.name || "Service";
                  const subName = reviewSub?.translated_name || reviewSub?.name;
                  return (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="px-2.5 py-1 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 border border-blue-100 dark:border-blue-800 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] w-fit">
                        {catName}
                      </div>
                      {subName && (
                        <div className="px-2.5 py-1 bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-600 border border-indigo-100 dark:border-indigo-800 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] w-fit">
                          {subName}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                  {formValues.serviceTitle}
                </h4>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 hover:border-blue-100 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-500/5 transition-all space-y-2 group">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors">
                    <Calendar size={14} />
                    <span className="text-[13px] font-semibold uppercase tracking-widest">
                      Timing
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {timeOption === "choose"
                      ? formValues.startDateTime
                        ? `${dayjs(formValues.startDateTime).format("MMM D, HH:mm")} — ${formValues.endDateTime ? dayjs(formValues.endDateTime).format(dayjs(formValues.startDateTime).isSame(dayjs(formValues.endDateTime), "day") ? "HH:mm" : "MMM D, HH:mm") : ""}`
                        : "Select Date"
                      : timeOptionCards.find((c) => c.id === timeOption)
                          ?.title || "Flexible"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 hover:border-emerald-100 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/5 transition-all space-y-2 group">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors">
                    <CreditCard size={14} />
                    <span className="text-[13px] font-semibold uppercase tracking-widest">
                      Budget
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {formValues.minPrice && formValues.maxPrice
                      ? `${currencySymbol}${formValues.minPrice} - ${formValues.maxPrice}`
                      : "Flexible"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 hover:border-purple-100 dark:hover:border-purple-700 hover:shadow-md hover:shadow-purple-500/5 transition-all space-y-2 group">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 transition-colors">
                    <ImageIcon size={14} />
                    <span className="text-[13px] font-semibold uppercase tracking-widest">
                      Assets
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {attachments.length}{" "}
                    {attachments.length === 1 ? "File" : "Files"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-blue-50/30 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-50 dark:border-blue-800/50 relative group transition-all">
                <div className="absolute top-4 left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-blue-500" />
                    <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Description
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed italic line-clamp-4 group-hover:line-clamp-none transition-all">
                    "{formValues.serviceDescription}"
                  </p>
                </div>
              </div>

              {/* Assets Review */}
              {attachments.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 px-1">
                    <ImageIcon size={14} className="text-blue-500" />
                    <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Attached Assets
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all group"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="p-2.5 bg-white dark:bg-gray-700 rounded-lg text-gray-400 group-hover:text-blue-500 transition-colors shadow-sm">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
                                {(file.size / 1024).toFixed(0)} KB
                              </span>
                              {file.type.startsWith("audio/") && (
                                <button
                                  onClick={() => togglePlayback(file, index)}
                                  className="text-[9px] text-blue-600 px-2 py-0.5  font-bold uppercase transition-all flex items-center gap-1"
                                >
                                  {playingIndex === index ? (
                                    <>
                                      <Pause size={10} /> Playing
                                    </>
                                  ) : (
                                    <>
                                      <Play size={10} />{" "}
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {file.type.startsWith("image/") && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-600 shadow-sm">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Signals Section */}
              <div className="mt-8 p-6 bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl border border-gray-100/50 dark:border-gray-600/50 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 overflow-hidden relative">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-blue-600 shadow-sm border border-blue-50 dark:border-blue-900">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                      {t("verifiedPros") || "Verified pros"}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {t("qualityAssured") || "Quality assured"}
                    </p>
                  </div>
                </div>

                <div className="hidden md:block w-px h-8 bg-gray-200/60 dark:bg-gray-600/60" />

                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-orange-500 shadow-sm border border-orange-50 dark:border-orange-900">
                    <Zap size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                      {t("fastResponses") || "Fast responses"}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {t("usuallyWithin1Hour") || "Usually within 1 hour"}
                    </p>
                  </div>
                </div>

                <div className="hidden md:block w-px h-8 bg-gray-200/60 dark:bg-gray-600/60" />

                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50 dark:border-emerald-900">
                    <Lock size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                      {t("freeToUse") || "Free to use"}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {t("noCommitment") || "No commitment"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-4 flex-wrap border-t border-gray-50 dark:border-gray-700 pt-6">
          <div className="min-w-[120px] md:min-w-[144px]">
            <Button
              variant="ghost"
              className="h-10 w-32 md:w-36 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-100 dark:border-gray-600 hover:border-gray-200 dark:hover:border-gray-500 rounded-lg text-[13px] font-semibold transition-all active:scale-[0.98]"
              onClick={currentStep > 1 ? handleBack : close}
            >
              {currentStep > 1 ? (t("back") || "Back") : (t("cancel") || "Cancel")}
            </Button>
          </div>

          <div className="flex-1 flex justify-end">
            {currentStep < 6 ? (
              <Button
                className="h-10 w-32 md:w-36 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 group transition-all active:scale-[0.98] "
                onClick={handleNext}
              >
                {t("continue") || "Continue"}
                <ChevronRight
                  className="group-hover:translate-x-1 transition-transform"
                  size={14}
                />
              </Button>
            ) : (
              <Button
                className="h-10 w-40 md:w-44 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 group transition-all active:scale-[0.98] shadow-sm shadow-indigo-100"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t("submitRequest") || "Submit Request"}
                    <Sparkles
                      className="group-hover:rotate-12 transition-transform"
                      size={14}
                    />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCustomServiceForm;
