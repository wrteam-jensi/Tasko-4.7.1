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
  Gift,
  X,
  Trash2,
  Square,
  Check,
  Play,
  Pause,
  MapPin,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomDateTimePicker from "../CustomDateTimePicker/CustomDateTimePicker";
import { useTranslation } from "@/components/Layout/TranslationContext";
import dayjs from "dayjs";
import {
  getAllCategoriesApi,
  makeCustomJobRequestApi,
  getPlacesForWebApi,
  getPlacesDetailsForWebApi,
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

const AddCustomServiceForm = ({ close, fetchBookings, provider_id }) => {
  const t = useTranslation();
  const locationData = useSelector((state) => state?.location);
  const settingsData = useSelector((state) => state?.settingsData?.settings);
  const currencySymbol = settingsData?.currency_symbol || "XOF";

  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState(null); // 'start' or 'end'
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [timeOption, setTimeOption] = useState("flexible");
  const [isImproving, setIsImproving] = useState(false);

  // Location search states
  const [locationSearchInput, setLocationSearchInput] = useState(
    locationData?.address || "",
  );
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    address: locationData?.address || "",
    lat: locationData?.lat || 0,
    lng: locationData?.lng || 0,
  });

  const [formValues, setFormValues] = useState({
    serviceTitle: "",
    serviceDescription: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    startDateTime: null,
    endDateTime: null,
  });
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // Auto-category detection logic
  useEffect(() => {
    if (categories.length > 0 && formValues.serviceTitle) {
      const title = formValues.serviceTitle.toLowerCase();
      const detectedCategory = categories.find((cat) => {
        const catName = (cat.translated_name || cat.name).toLowerCase();
        return title.includes(catName) || catName.includes(title);
      });

      if (detectedCategory && !formValues.category) {
        setFormValues((prev) => ({ ...prev, category: detectedCategory.id }));
      }
    }
  }, [formValues.serviceTitle, categories]);

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

  const requestQuoteSettings = settingsData?.request_quote_settings;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Get limits with safe fallbacks
    const maxFilesAllowed = parseInt(requestQuoteSettings?.max_files_allowed) ;
    const maxSizeImages = (parseInt(requestQuoteSettings?.max_file_size_images)) * 1024 * 1024;
    const maxSizeVideo = (parseInt(requestQuoteSettings?.max_file_size_video)) * 1024 * 1024;
    const maxSizeAudio = (parseInt(requestQuoteSettings?.max_file_size_audio)) * 1024 * 1024;
    const maxSizeOther = (parseInt(requestQuoteSettings?.max_file_size_other)) * 1024 * 1024;

    // Check total files count limit
    if (attachments.length + files.length > maxFilesAllowed) {
      toast.error(
        `${t("maxFilesAllowed") || "Maximum files allowed is"} ${maxFilesAllowed}`
      );
      e.target.value = "";
      return;
    }

    // Filter files based on individual size limits (MB to Bytes)
    const validFiles = files.filter((file) => {
      let maxSize = maxSizeOther;
      if (file.type.startsWith("image/")) {
        maxSize = maxSizeImages;
      } else if (file.type.startsWith("video/")) {
        maxSize = maxSizeVideo;
      } else if (file.type.startsWith("audio/")) {
        maxSize = maxSizeAudio;
      }
      return file.size <= maxSize;
    });

    // Notify user if any files were rejected due to size
    if (validFiles.length < files.length) {
      toast.error(
        t("someFilesTooLarge") || "Some files were too large for their respective type limits (MB)."
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
    setTimeOption("flexible");
    setAttachments([]);
    setCurrentStep(1);
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

  const handleLocationSearch = async (val) => {
    setLocationSearchInput(val);
    if (!val.trim() || val.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    try {
      setIsSearchingLocation(true);
      const response = await getPlacesForWebApi({ input: val });
      const data = response?.data?.data || response?.data;
      setLocationSuggestions(data?.predictions || []);
    } catch (error) {
      console.error("Location search error:", error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleLocationSelect = async (place) => {
    setLocationSearchInput(place.description);
    setLocationSuggestions([]);

    try {
      setIsSearchingLocation(true);
      const response = await getPlacesDetailsForWebApi({
        place_id: place.place_id,
      });
      const details =
        response?.data?.data?.result || response?.data?.data?.results?.[0];

      if (details) {
        setSelectedLocation({
          address: details.formatted_address,
          lat: details.geometry?.location?.lat,
          lng: details.geometry?.location?.lng,
        });
      }
    } catch (error) {
      console.error("Location details error:", error);
    } finally {
      setIsSearchingLocation(false);
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
      if (!formValues.category) {
        toast.error(t("selectServiceCategory"));
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
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
        category_id: formValues.category || categories[0]?.id || "1",
        service_title: formValues.serviceTitle,
        service_short_description: formValues.serviceDescription,
        min_price: formValues.minPrice || "0",
        max_price: formValues.maxPrice || "0",
        type,
        latitude: selectedLocation.lat || 0,
        longitude: selectedLocation.lng || 0,
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
        toast.error(response?.message);
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
    { id: 2, title: t("detailsContext") || "Details & Context", icon: Info },
    { id: 3, title: t("summary") || "Summary", icon: Check },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500 bg-white min-h-[70vh] px-4 md:px-6">
      {/* Compact Header & Stepper Progress */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100/80">
        <div className="px-6 py-4 flex items-center justify-between"></div>

        {/* Sleek Minimalist Stepper */}
        <div className="pb-6 pt-2 flex items-center gap-6">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2 group">
                <div
                  className={`
                    w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 text-[10px] font-semibold
                    ${currentStep >= step.id ? "bg-blue-600 text-white " : "bg-gray-100 text-gray-400"}
                  `}
                >
                  {currentStep > step.id ? (
                    <Check size={12} strokeWidth={3} />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-[13px] font-semibold uppercase tracking-wider hidden sm:block whitespace-nowrap ${currentStep >= step.id ? "text-blue-600" : "text-gray-400"}`}
                >
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[2px] bg-gray-100 rounded-full mx-1">
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
            {/* Step 1: Info */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 flex items-start gap-4 transition-all focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 shadow-sm">
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                <Pencil size={18} />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[13px] font-semibold uppercase tracking-widest flex items-center gap-2 text-gray-400">
                  {t("serviceTitle") || "Service Title"}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="serviceTitle"
                  placeholder="Ex: Kitchen Sink Repair"
                  className="w-full text-base focus:outline-none placeholder:text-gray-200 bg-transparent text-gray-900"
                  onChange={handleChange}
                  value={formValues.serviceTitle}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-4 flex items-start gap-4 transition-all focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 shadow-sm">
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                <MessageSquare size={18} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-semibold uppercase tracking-widest text-gray-400">
                    {t("description") || "Description"}
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[9px] bg-gray-50 px-2 py-0.5 rounded-full text-gray-400 font-semibold">
                    {formValues.serviceDescription.length}/500
                  </span>
                </div>
                <textarea
                  name="serviceDescription"
                  placeholder="Tell us more about what you need..."
                  className="w-full text-sm focus:outline-none resize-none min-h-[100px] placeholder:text-gray-200 bg-transparent text-gray-900 leading-relaxed"
                  maxLength={500}
                  onChange={handleChange}
                  value={formValues.serviceDescription}
                />
              </div>
            </div>

            {/* AI Improve Action - More Integrated */}
            <button
              onClick={handleAIImprove}
              disabled={isImproving}
              className="w-full h-12 bg-white border border-blue-100 hover:border-blue-600 rounded-lg px-4 flex items-center justify-between group transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 bg-blue-50 rounded-lg ${isImproving ? "animate-spin" : ""}`}
                >
                  <Sparkles className="text-blue-600" size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-700">
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

            <div className="bg-white border border-gray-100 rounded-lg p-4 flex items-center gap-4 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500">
              <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Wrench size={18} />
              </div>
              <div className="flex-1">
                <label className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest block mb-0.5">
                  {t("category") || "Category"}
                </label>
                <Select
                  onValueChange={(value) =>
                    setFormValues((prevValues) => ({
                      ...prevValues,
                      category: value,
                    }))
                  }
                  value={formValues.category}
                >
                  <SelectTrigger className="w-full border-none p-0 h-auto focus:ring-0 shadow-none text-left bg-transparent">
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-gray-900 line-clamp-1">
                        {formValues.category
                          ? categories.find((c) => c.id === formValues.category)
                              ?.translated_name ||
                            categories.find((c) => c.id === formValues.category)
                              ?.name
                          : t("selectCategory") || "Choose category"}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] z-[9999] rounded-lg border-none shadow-2xl p-2 bg-white">
                    {categoriesLoading ? (
                      <SelectItem
                        value="loading"
                        disabled
                        className="rounded-lg"
                      >
                        {t("loading")}...
                      </SelectItem>
                    ) : categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="rounded-lg my-1 focus:bg-blue-50 focus:text-blue-600 font-semibold"
                        >
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

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[13px] font-semibold uppercase tracking-widest text-gray-400 flex items-center">
                  {t("addAttachments") || "Attachments"}
                  <span className="ml-2 text-[11px] font-normal lowercase italic tracking-normal text-gray-300">
                    (optional)
                  </span>
                </h3>
              </div>
              <div
                className={`p-6 border-2 border-dashed rounded-lg transition-all duration-500 ${isRecording ? "bg-purple-50/50 border-purple-300" : "bg-white border-gray-100 hover:border-blue-200"}`}
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
                        accept: ".pdf,.doc,.docx",
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
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-tight">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-purple-50/50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white animate-pulse shadow-lg shadow-red-200">
                        <Mic size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-purple-600">
                          Recording...
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 tabular-nums">
                          {formatTime(recordingDuration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => stopRecording(false)}
                        className="w-10 h-10 rounded-full bg-white text-gray-400 hover:text-red-500 shadow-sm flex items-center justify-center transition-all"
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
              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-100 transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400 group-hover:text-blue-500 transition-colors shadow-sm">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-semibold text-gray-400 uppercase">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                            {file.type.startsWith("audio/") && (
                              <button
                                onClick={() => togglePlayback(file, index)}
                                className="text-[9px]  text-blue-600 px-2 py-0.5  font-bold uppercase  transition-all flex items-center gap-1"
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
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm hidden sm:block">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
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

        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Step 2: Location, Timing, Budget */}
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Service Location
                  </h3>
                  <div className="h-[1px] flex-1 bg-gray-100/60" />
                </div>
                <div className="relative group/location">
                  <div className="bg-white border-2 border-gray-100 rounded-lg p-4 flex items-center gap-4 transition-all duration-300 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-500/5 hover:border-gray-200 shadow-sm">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shadow-sm transition-transform group-focus-within/location:scale-110">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block transition-colors group-focus-within/location:text-blue-500">
                        {t("location") || "Service Address"}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Where do you need the service?"
                          className="w-full text-base font-bold focus:outline-none placeholder:text-gray-200 bg-transparent text-gray-900"
                          onChange={(e) => handleLocationSearch(e.target.value)}
                          value={locationSearchInput}
                        />
                        {isSearchingLocation && (
                          <Loader2
                            className="animate-spin text-blue-500"
                            size={18}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {locationSuggestions.length > 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-lg border border-gray-100 p-1.5 z-[60] animate-in slide-in-from-top-2">
                      {locationSuggestions.map((place) => (
                        <button
                          key={place.place_id}
                          onClick={() => handleLocationSelect(place)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-all text-left group"
                        >
                          <div className="p-1.5 bg-gray-50 group-hover:bg-white rounded-lg text-gray-400 group-hover:text-blue-500">
                            <MapPin size={14} />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                              {place.structured_formatting.main_text}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {place.structured_formatting.secondary_text}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Scheduling
                  </h3>
                  <div className="h-[1px] flex-1 bg-gray-100/60" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {timeOptionCards.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleTimeOptionSelect(opt.id)}
                      className={`group flex flex-col items-center text-center p-3.5 rounded-lg border-2 transition-all duration-300 relative overflow-hidden active:scale-[0.97]
                            ${
                              timeOption === opt.id
                                ? `${opt.border} bg-white shadow-xl shadow-gray-100 scale-[1.02] z-10`
                                : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50"
                            }
                          `}
                    >
                      {/* Background accent glow for selected state */}
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
                              ? "text-gray-900"
                              : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        >
                          {opt.title}
                        </span>
                        <span
                          className={`text-[9px] font-medium leading-tight block transition-colors duration-300 ${
                            timeOption === opt.id
                              ? "text-gray-500"
                              : "text-gray-400/80"
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
                  <div className="bg-white rounded-lg p-5 space-y-4 border border-gray-100 shadow-gray-100/50 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleDateTimeClick("startDateTime")}
                        className={`group p-4 rounded-lg text-left transition-all border-2 flex items-center gap-4 ${
                          datePickerType === "startDateTime" && showDatePicker
                            ? "border-blue-600 bg-blue-50/30 shadow-sm"
                            : "border-gray-50 bg-gray-50/30 hover:bg-white hover:border-blue-200"
                        }`}
                      >
                        <div
                          className={`p-2.5 rounded-lg transition-all duration-300 ${
                            datePickerType === "startDateTime" && showDatePicker
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                              : "bg-white text-gray-400 group-hover:text-blue-500 shadow-sm"
                          }`}
                        >
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-0.5">
                            Start Schedule
                          </p>
                          <p
                            className={`text-sm font-bold transition-colors ${
                              formValues.startDateTime
                                ? "text-gray-900"
                                : "text-gray-300"
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
                            ? "border-orange-500 bg-orange-50/30 shadow-sm"
                            : "border-gray-50 bg-gray-50/30 hover:bg-white hover:border-orange-200"
                        }`}
                      >
                        <div
                          className={`p-2.5 rounded-lg transition-all duration-300 ${
                            datePickerType === "endDateTime" && showDatePicker
                              ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                              : "bg-white text-gray-400 group-hover:text-orange-500 shadow-sm"
                          }`}
                        >
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-0.5">
                            End Schedule
                          </p>
                          <p
                            className={`text-sm font-bold transition-colors ${
                              formValues.endDateTime
                                ? "text-gray-900"
                                : "text-gray-300"
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
                      <div className="pt-2 border-t border-gray-50">
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

              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Expected Budget ({currencySymbol})
                  </h3>
                  <div className="h-[1px] flex-1 bg-gray-100/60" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="group bg-white rounded-lg p-4 border-2 border-gray-100 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm hover:shadow-md">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 transition-colors group-focus-within:text-blue-500">
                      Min Budget
                    </label>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400  transition-all font-bold text-base">
                        {currencySymbol}
                      </div>
                      <input
                        type="number"
                        name="minPrice"
                        placeholder="0"
                        className="w-full text-base font-bold focus:outline-none bg-transparent text-gray-900 placeholder:text-gray-200"
                        onChange={handleChange}
                        value={formValues.minPrice}
                      />
                    </div>
                  </div>
                  <div className="group bg-white rounded-lg p-4 border-2 border-gray-100 focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-sm hover:shadow-md">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 transition-colors group-focus-within:text-emerald-500">
                      Max Budget
                    </label>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400   transition-all font-bold text-base">
                        {currencySymbol}
                      </div>
                      <input
                        type="number"
                        name="maxPrice"
                        placeholder="0"
                        className="w-full text-base font-bold focus:outline-none bg-transparent text-gray-900 placeholder:text-gray-200"
                        onChange={handleChange}
                        value={formValues.maxPrice}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold text-gray-900 tracking-tight"  >
                Request Summary
              </h3>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-2xl shadow-gray-200/40 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-90" />

              {/* Header Info */}
              <div className="flex flex-col gap-3 pb-6 border-b border-gray-50/80">
                <div className="px-2.5 py-1 bg-blue-50/80 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] w-fit">
                  {categories.find((c) => c.id === formValues.category)
                    ?.translated_name ||
                    categories.find((c) => c.id === formValues.category)
                      ?.name ||
                    "Service"}
                </div>
                <h4 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                  {formValues.serviceTitle}
                </h4>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50/50 rounded-lg border border-gray-100 hover:bg-white hover:border-blue-100 hover:shadow-md hover:shadow-blue-500/5 transition-all space-y-2 group">
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                    <Calendar size={14} />
                    <span className="text-[13px] font-semibold uppercase tracking-widest">
                      Timing
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {timeOption === "choose"
                      ? formValues.startDateTime
                        ? `${dayjs(formValues.startDateTime).format("MMM D, HH:mm")} — ${formValues.endDateTime ? dayjs(formValues.endDateTime).format(dayjs(formValues.startDateTime).isSame(dayjs(formValues.endDateTime), "day") ? "HH:mm" : "MMM D, HH:mm") : ""}`
                        : "Select Date"
                      : timeOptionCards.find((c) => c.id === timeOption)
                          ?.title || "Flexible"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50/50 rounded-lg border border-gray-100 hover:bg-white hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-500/5 transition-all space-y-2 group">
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-emerald-500 transition-colors">
                    <CreditCard size={14} />
                    <span className="text-[13px] font-semibold uppercase tracking-widest">
                      Budget
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {formValues.minPrice && formValues.maxPrice
                      ? `${currencySymbol}${formValues.minPrice} - ${formValues.maxPrice}`
                      : "Flexible"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50/50 rounded-lg border border-gray-100 hover:bg-white hover:border-purple-100 hover:shadow-md hover:shadow-purple-500/5 transition-all space-y-2 group">
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-500 transition-colors">
                    <ImageIcon size={14} />
                    <span className="text-[13px] font-semibold uppercase tracking-widest">
                      Assets
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {attachments.length}{" "}
                    {attachments.length === 1 ? "File" : "Files"}
                  </p>
                </div>
              </div>

              {/* Location if present */}
              <div className="bg-blue-50/30 rounded-lg p-5 border border-blue-50 relative group transition-all">
                <div className="absolute top-4 left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-blue-500" />
                    <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
                      Location
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-relaxed truncate">
                    {selectedLocation.address || "No address provided"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-blue-50/30 rounded-lg p-5 border border-blue-50 relative group transition-all">
                <div className="absolute top-4 left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-blue-500" />
                    <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
                      Description
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed italic line-clamp-4 group-hover:line-clamp-none transition-all">
                    "{formValues.serviceDescription}"
                  </p>
                </div>
              </div>

              {/* Assets Review */}
              {attachments.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 px-1">
                    <ImageIcon size={14} className="text-blue-500" />
                    <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
                      Attached Assets
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100 hover:bg-white transition-all group"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="p-2.5 bg-white rounded-lg text-gray-400 group-hover:text-blue-500 transition-colors shadow-sm">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-semibold text-gray-400 uppercase">
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
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
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
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-4 flex-wrap border-t border-gray-50 pt-6">
          <div className="min-w-[120px] md:min-w-[144px]">
            {currentStep > 1 && (
              <Button
                variant="ghost"
                className="h-10 w-32 md:w-36 text-gray-500 hover:text-gray-900 border border-gray-100 hover:border-gray-200 rounded-lg text-[13px] font-semibold transition-all active:scale-[0.98]"
                onClick={handleBack}
              >
                {t("back") || "Back"}
              </Button>
            )}
          </div>

          <div className="flex-1 flex justify-end">
            {currentStep < 3 ? (
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
