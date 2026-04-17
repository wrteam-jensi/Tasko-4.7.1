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
import { getAllCategoriesApi, makeCustomJobRequestApi } from "@/api/apiRoutes";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRef } from "react";

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
  const [timeOption, setTimeOption] = useState("flexible"); // Default to flexible as per "minimal friction"

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
      const detectedCategory = categories.find(cat => {
        const catName = (cat.translated_name || cat.name).toLowerCase();
        return title.includes(catName) || catName.includes(title);
      });

      if (detectedCategory && !formValues.category) {
        setFormValues(prev => ({ ...prev, category: detectedCategory.id }));
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024); // 10MB limit

    if (validFiles.length < files.length) {
      toast.error(
        t("someFilesTooLarge") || "Some files were too large (max 10MB)",
      );
    }

    setAttachments((prev) => [...prev, ...validFiles]);
    e.target.value = ""; // Reset input so same file can be selected again
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
  };

  const handleAIImprove = () => {
    // Placeholder for AI improvement logic
    toast.info("AI is analyzing and improving your request...");
    // Future: Call AI endpoint here
  };

  const handleSubmit = async () => {
    // Requirements: Only title + description required
    if (!formValues.serviceTitle) {
      toast.error(t("pleaseEnterServiceTitle") || "Please enter a service title");
      return;
    }
    if (!formValues.serviceDescription) {
      toast.error(t("pleaseEnterServiceDescription") || "Please describe your problem");
      return;
    }

    try {
      setLoading(true);
      
      // Handle defaults for optional fields if not provided
      const startDate = formValues.startDateTime ? dayjs(formValues.startDateTime).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
      const startTime = formValues.startDateTime ? dayjs(formValues.startDateTime).format("HH:mm:ss") : dayjs().format("HH:mm:ss");
      const endDate = formValues.endDateTime ? dayjs(formValues.endDateTime).format("YYYY-MM-DD") : dayjs().add(1, 'month').format("YYYY-MM-DD");
      const endTime = formValues.endDateTime ? dayjs(formValues.endDateTime).format("HH:mm:ss") : dayjs().format("HH:mm:ss");

      const response = await makeCustomJobRequestApi({
        category_id: formValues.category || categories[0]?.id || "1", // Fallback if still empty
        service_short_description: formValues.serviceDescription,
        end_date_time: formValues.endDateTime || dayjs().add(1, 'month').toDate(),
        min_price: formValues.minPrice || "0",
        max_price: formValues.maxPrice || "0",
        requested_start_date: startDate,
        requested_start_time: startTime,
        requested_end_date: endDate,
        requested_end_time: endTime,
        service_title: formValues.serviceTitle,
        latitude: locationData?.lat || 0,
        longitude: locationData?.lng || 0,
        images: attachments,
      });

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 border-none sm:rounded-[32px] scrollbar-hide bg-[#FBFBFF]">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl px-6 py-5 border-b border-gray-100 flex items-center gap-4">
          <button
            onClick={close}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="rotate-180 text-gray-400" size={24} />
          </button>
          <div>
            <DialogTitle className="text-2xl font-black tracking-tight text-gray-900">
              {t("requestQuote") || "Request a Quote"}
            </DialogTitle>
            <div className="flex items-center gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
               <p className="text-xs font-semibold text-blue-500/80 uppercase tracking-wider">
                {t("fastResponses") || "Fast responses (~1h)"}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="bg-white border-2 border-transparent focus-within:border-blue-500 focus-within:shadow-xl focus-within:shadow-blue-500/10 rounded-[24px] p-5 flex items-start gap-4 transition-all duration-300 shadow-sm">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <Pencil size={20} />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  {t("whatDoYouNeedHelpWith") || "What do you need help with?"}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="serviceTitle"
                  placeholder="Ex.: Air conditioner repair, Plumbing..."
                  className="w-full text-lg font-semibold focus:outline-none placeholder:text-gray-300 bg-transparent"
                  onChange={handleChange}
                  value={formValues.serviceTitle}
                />
              </div>
            </div>

            <div className="bg-white border-2 border-transparent focus-within:border-blue-500 focus-within:shadow-xl focus-within:shadow-blue-500/10 rounded-[24px] p-5 flex items-start gap-4 transition-all duration-300 shadow-sm">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <MessageSquare size={20} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-900">
                    {t("describeTheProblem") || "Describe the problem"}
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-400 font-bold uppercase">
                    {formValues.serviceDescription.length}/500
                  </span>
                </div>
                <textarea
                  name="serviceDescription"
                  placeholder="Provide as many details as possible (symptoms, context, etc.)"
                  className="w-full text-base font-medium focus:outline-none resize-none min-h-[100px] placeholder:text-gray-300 bg-transparent"
                  maxLength={500}
                  onChange={handleChange}
                  value={formValues.serviceDescription}
                />
              </div>
            </div>

            {/* AI Button - Prominent */}
            <button 
              onClick={handleAIImprove}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all rounded-[20px] py-4 px-5 flex items-center justify-between group shadow-lg shadow-blue-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="text-white animate-pulse" size={20} />
                </div>
                <div className="text-left">
                  <span className="text-white font-bold text-sm block">
                    {t("improveRequestWithAI") || "Improve my request with AI"}
                  </span>
                </div>
              </div>
              <span className="bg-white text-blue-600 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm">
                {t("recommended") || "Recommended"}
              </span>
            </button>
          </div>

          {/* Section 2: Attachments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-black flex items-center gap-2">
                {t("addAttachments") || "Add attachments"}
                <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {t("optional") || "optional"}
                </span>
              </h3>
              <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">
                {t("boostAccuracy") || "Boost quote accuracy"}
              </p>
            </div>

            <div className={`p-4 border-2 border-dashed rounded-[28px] transition-all duration-500 ${isRecording ? "bg-purple-50/50 border-purple-300" : "bg-white border-gray-100 hover:border-blue-200"}`}>
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
                      label: t("photo"),
                      color: "bg-blue-50 text-blue-600",
                      accept: "image/*",
                    },
                    {
                      icon: Video,
                      label: t("video"),
                      color: "bg-green-50 text-green-600",
                      accept: "video/*",
                    },
                    {
                      icon: FileText,
                      label: t("file"),
                      color: "bg-orange-50 text-orange-600",
                      accept: ".pdf,.doc,.docx,.txt",
                    },
                    {
                      icon: Mic,
                      label: t("voice"),
                      color: "bg-purple-50 text-purple-600",
                      accept: "audio/*",
                    },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (item.label === t("voice")) {
                          startRecording();
                        } else {
                          fileInputRef.current.setAttribute("accept", item.accept);
                          fileInputRef.current.click();
                        }
                      }}
                      className="group flex flex-col items-center gap-2"
                    >
                      <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-md`}>
                        <item.icon size={24} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-tighter">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 py-2 px-2">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-red-500 rounded-full blur-md opacity-20 animate-pulse"></div>
                      <div className="relative w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Mic size={20} className="animate-pulse" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                        {t("recording") || "Recording"}
                      </span>
                      <span className="text-2xl font-black text-gray-900 tabular-nums">
                        {formatTime(recordingDuration)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => stopRecording(false)}
                      className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                    >
                      <X size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => stopRecording(true)}
                      className="w-12 h-12 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-purple-200"
                    >
                      <Check size={22} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-sm group animate-in slide-in-from-bottom-2"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2 bg-gray-50 rounded-xl text-gray-500">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {file.type.startsWith("audio/") && (
                        <button
                          type="button"
                          onClick={() => togglePlayback(file, index)}
                          className={`p-2 rounded-full ${playingIndex === index ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100 text-gray-400"}`}
                        >
                          {playingIndex === index ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-2 hover:bg-red-50 hover:text-red-500 text-gray-300 rounded-full transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Category */}
          <div className="space-y-4">
             <div className="flex items-baseline justify-between px-1">
                <h3 className="text-base font-black">{t("serviceCategory") || "Service category"}</h3>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                  <Zap size={10} /> {t("autoDetected") || "Auto-detected"}
                </span>
             </div>
            
            <div className="bg-white border-2 border-transparent focus-within:border-blue-500 rounded-[24px] p-5 flex items-center gap-4 shadow-sm transition-all shadow-sm">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
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
                  <SelectTrigger className="w-full border-none p-0 h-auto focus:ring-0 shadow-none text-left bg-transparent">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">
                        {formValues.category 
                          ? categories.find(c => c.id === formValues.category)?.translated_name || categories.find(c => c.id === formValues.category)?.name 
                          : t("selectCategory") || "Select a category"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {t("categorySubtext") || "Change if auto-detection is incorrect"}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] z-[9999] rounded-[24px] border-none shadow-2xl">
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>
                        {t("loading")}...
                      </SelectItem>
                    ) : categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="rounded-xl my-1 mx-1">
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

          {/* Section 4: Budget */}
          <div className="space-y-4">
            <h3 className="text-base font-black flex items-center gap-2">
              {t("budgetRange") || "Budget range"}
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                {t("optional") || "optional"}
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm focus-within:border-blue-500 transition-colors">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Min. Price</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{currencySymbol}</span>
                  <input
                    type="number"
                    name="minPrice"
                    placeholder="0"
                    className="w-full text-lg font-black focus:outline-none placeholder:text-gray-200 bg-transparent"
                    onChange={handleChange}
                    value={formValues.minPrice}
                  />
                </div>
              </div>
              <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm focus-within:border-blue-500 transition-colors">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Max. Price</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{currencySymbol}</span>
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="0"
                    className="w-full text-lg font-black focus:outline-none placeholder:text-gray-200 bg-transparent"
                    onChange={handleChange}
                    value={formValues.maxPrice}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Timing */}
          <div className="space-y-4">
            <h3 className="text-base font-black flex items-center gap-2">
              {t("serviceTiming") || "Service timing"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {timeOptionCards.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleTimeOptionSelect(opt.id)}
                  className={`flex flex-col items-start p-4 rounded-[24px] border-2 transition-all text-left relative overflow-hidden group
                    ${timeOption === opt.id ? `${opt.border} bg-white shadow-lg` : "bg-white border-transparent hover:border-gray-100"}
                  `}
                >
                  <div className={`p-2 ${opt.bg} ${opt.color} rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                    <opt.icon size={20} />
                  </div>
                  <span className={`text-sm font-black ${timeOption === opt.id ? "text-gray-900" : "text-gray-700"}`}>
                    {opt.title}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                    {opt.sub}
                  </span>
                  {timeOption === opt.id && (
                    <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${opt.color.replace('text-', 'bg-')}`}></div>
                  )}
                </button>
              ))}
            </div>

            {timeOption === "choose" && (
              <div className="bg-gray-50/50 rounded-[28px] p-5 space-y-3 animate-in fade-in slide-in-from-top-4">
                <button
                  onClick={() => handleDateTimeClick("startDateTime")}
                  className={`w-full bg-white border-2 rounded-[20px] px-5 py-4 flex items-center gap-4 transition-all ${datePickerType === "startDateTime" && showDatePicker ? "border-blue-500 shadow-xl" : "border-transparent hover:border-blue-100"}`}
                >
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {t("startDate") || "Start date"}
                    </span>
                    <span className={`text-sm font-bold ${formValues.startDateTime ? "text-gray-900" : "text-gray-300"}`}>
                      {formValues.startDateTime
                        ? dayjs(formValues.startDateTime).format("MMM D, YYYY h:mm A")
                        : t("selectDate") || "Select date"}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleDateTimeClick("endDateTime")}
                  className={`w-full bg-white border-2 rounded-[20px] px-5 py-4 flex items-center gap-4 transition-all ${datePickerType === "endDateTime" && showDatePicker ? "border-orange-500 shadow-xl" : "border-transparent hover:border-blue-100"}`}
                >
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {t("endDate") || "End date"}
                    </span>
                    <span className={`text-sm font-bold ${formValues.endDateTime ? "text-gray-900" : "text-gray-300"}`}>
                      {formValues.endDateTime
                        ? dayjs(formValues.endDateTime).format("MMM D, YYYY h:mm A")
                        : t("selectDate") || "Select date"}
                    </span>
                  </div>
                </button>

                {showDatePicker && (
                  <div className="bg-white rounded-[24px] border-2 border-gray-100 p-5 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                        {datePickerType === "startDateTime" ? t("pickStart") : t("pickEnd")}
                      </h4>
                      <button onClick={() => setShowDatePicker(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                        <X size={20} />
                      </button>
                    </div>
                    <CustomDateTimePicker
                      value={formValues[datePickerType]}
                      onChange={handleDateTimeSelect}
                      minDateTime={datePickerType === "endDateTime" ? formValues.startDateTime : null}
                      type={datePickerType}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Trust indicators & CTA (Sticky at bottom) */}
          <div className="pt-4 space-y-6">
            <div className="grid grid-cols-3 gap-2 bg-white rounded-[28px] border border-gray-100 p-4 shadow-sm">
              {[
                { icon: ShieldCheck, title: t("verified"), color: "text-blue-500", bg: "bg-blue-50" },
                { icon: Zap, title: t("fast"), color: "text-orange-500", bg: "bg-orange-50" },
                { icon: Lock, title: t("free"), color: "text-green-500", bg: "bg-green-50" },
              ].map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center text-center gap-1.5">
                  <div className={`w-8 h-8 ${badge.bg} ${badge.color} rounded-full flex items-center justify-center`}>
                    <badge.icon size={16} />
                  </div>
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{badge.title}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-[20px] p-4 flex gap-3 border border-blue-100/50">
              <Info className="text-blue-600 shrink-0" size={18} />
              <p className="text-[11px] font-bold text-blue-900/70 leading-relaxed uppercase tracking-tight">
                {t("moreDetailsBetterQuotes") || "The more details provided, the more accurate the quotes."}
              </p>
            </div>

            <Button
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] text-lg font-black flex items-center justify-center gap-3 group transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t("submitRequest") || "Submit Request"}
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" size={24} />
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
