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
  getPlacesDetailsForWebApi 
} from "@/api/apiRoutes";
import { useSelector, useDispatch } from "react-redux";
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

  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState(null); // 'start' or 'end'
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [timeOption, setTimeOption] = useState("flexible");
  const [isImproving, setIsImproving] = useState(false);

  // Location search states
  const [locationSearchInput, setLocationSearchInput] = useState(locationData?.address || "");
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
    setCurrentStep(1);
  };

  const handleAIImprove = async () => {
    if (!formValues.serviceDescription || formValues.serviceDescription.length < 10) {
      toast.error(t("pleaseProvideMoreDetails") || "Please describe your problem in more detail first.");
      return;
    }

    try {
      setIsImproving(true);
      // In a real app: const response = await improveWithAIApi(formValues.serviceDescription);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const improvedText = `Professional request regarding ${formValues.serviceTitle || "the service"}: ${formValues.serviceDescription}. I am looking for a high-quality solution with attention to detail. Please provide a quote including estimated timeline.`;
      
      setFormValues(prev => ({
        ...prev,
        serviceDescription: improvedText
      }));
      
      toast.success(t("aiImprovedDescription") || "AI has enhanced your description!");
    } catch (error) {
      console.error(error);
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
      const response = await getPlacesDetailsForWebApi({ place_id: place.place_id });
      const details = response?.data?.data?.result || response?.data?.data?.results?.[0];
      
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
        toast.error(t("pleaseEnterServiceTitle") || "Please enter a service title");
        return;
      }
      if (!formValues.serviceDescription) {
        toast.error(t("pleaseEnterServiceDescription") || "Please describe your problem");
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const startDate = formValues.startDateTime ? dayjs(formValues.startDateTime).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
      const startTime = formValues.startDateTime ? dayjs(formValues.startDateTime).format("HH:mm:ss") : dayjs().format("HH:mm:ss");
      const endDate = formValues.endDateTime ? dayjs(formValues.endDateTime).format("YYYY-MM-DD") : dayjs().add(1, 'month').format("YYYY-MM-DD");
      const endTime = formValues.endDateTime ? dayjs(formValues.endDateTime).format("HH:mm:ss") : dayjs().format("HH:mm:ss");

      const response = await makeCustomJobRequestApi({
        category_id: formValues.category || categories[0]?.id || "1",
        service_short_description: formValues.serviceDescription,
        end_date_time: formValues.endDateTime || dayjs().add(1, 'month').toDate(),
        min_price: formValues.minPrice || "0",
        max_price: formValues.maxPrice || "0",
        requested_start_date: startDate,
        requested_start_time: startTime,
        requested_end_date: endDate,
        requested_end_time: endTime,
        service_title: formValues.serviceTitle,
        latitude: selectedLocation.lat || 0,
        longitude: selectedLocation.lng || 0,
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

  const steps = [
    { id: 1, title: t("serviceInfo") || "Service Info", icon: Pencil },
    { id: 2, title: t("detailsContext") || "Details & Context", icon: Info },
    { id: 3, title: t("summary") || "Summary", icon: Check },
  ];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 border-none sm:rounded-[40px] scrollbar-hide bg-[#F8F9FF]">
        {/* Header & Stepper Progress */}
        <div className="sticky top-0 z-50">
          <div className="bg-white/95 backdrop-blur-md px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="p-2.5 hover:bg-gray-100 rounded-full transition-all active:scale-95"
                >
                  <ChevronRight className="rotate-180 text-gray-500" size={22} />
                </button>
              )}
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  {t("requestQuote") || "Request a Quote"}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                    Step {currentStep} of 3
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={close}
              className="p-2.5 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-full transition-all"
            >
              <X size={22} />
            </button>
          </div>
          
          {/* Stepper Visual */}
          <div className="bg-white px-8 pb-4 flex items-center gap-3">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2 group cursor-default">
                  <div className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500
                    ${currentStep >= step.id ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "bg-gray-100 text-gray-400"}
                  `}>
                    <step.icon size={18} />
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-widest hidden sm:block ${currentStep >= step.id ? "text-blue-600" : "text-gray-400"}`}>
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 rounded-full transition-all duration-700 ${currentStep > step.id ? "bg-blue-600" : "bg-gray-100"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="px-8 py-8">
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              {/* Step 1: Info */}
              <div className="space-y-6">
                <div className="bg-white hover:border-blue-200 border-2 border-transparent focus-within:border-blue-500 focus-within:shadow-2xl focus-within:shadow-blue-500/10 rounded-[32px] p-6 flex items-start gap-5 transition-all duration-300 shadow-sm">
                  <div className="p-4 bg-blue-50 rounded-[22px] text-blue-600">
                    <Pencil size={24} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      {t("serviceTitle") || "Service Title"}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="serviceTitle"
                      placeholder="Ex: Kitchen Sink Repair"
                      className="w-full text-xl font-bold focus:outline-none placeholder:text-gray-200 bg-transparent text-gray-900"
                      onChange={handleChange}
                      value={formValues.serviceTitle}
                    />
                  </div>
                </div>

                <div className="bg-white hover:border-blue-200 border-2 border-transparent focus-within:border-blue-500 focus-within:shadow-2xl focus-within:shadow-blue-500/10 rounded-[32px] p-6 flex items-start gap-5 transition-all duration-300 shadow-sm">
                  <div className="p-4 bg-blue-50 rounded-[22px] text-blue-600">
                    <MessageSquare size={24} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {t("description") || "Description"}
                        <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded-full text-gray-400 font-bold uppercase">
                        {formValues.serviceDescription.length}/500
                      </span>
                    </div>
                    <textarea
                      name="serviceDescription"
                      placeholder="Tell us more about what you need..."
                      className="w-full text-lg font-medium focus:outline-none resize-none min-h-[120px] placeholder:text-gray-200 bg-transparent text-gray-900"
                      maxLength={500}
                      onChange={handleChange}
                      value={formValues.serviceDescription}
                    />
                  </div>
                </div>

                {/* AI Improve Button */}
                <button 
                  onClick={handleAIImprove}
                  disabled={isImproving}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all rounded-[24px] py-4 px-6 flex items-center justify-between group shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:grayscale"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-white/20 rounded-lg ${isImproving ? 'animate-spin' : ''}`}>
                      <Sparkles className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <span className="text-white font-black text-xs block uppercase tracking-widest leading-none mb-1">
                        {isImproving ? "AI is refining..." : "Smart Assist"}
                      </span>
                      <span className="text-white/80 font-bold text-sm">
                        {isImproving ? "Rewriting description..." : "Improve with AI"}
                      </span>
                    </div>
                  </div>
                  {!isImproving && (
                    <div className="bg-white text-blue-600 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm">
                      ✨ Recommended
                    </div>
                  )}
                </button>

                <div className="bg-white hover:border-blue-200 border-2 border-transparent focus-within:border-blue-500 rounded-[32px] p-6 flex items-center gap-5 shadow-sm transition-all">
                  <div className="p-4 bg-indigo-50 rounded-[22px] text-indigo-600">
                    <Wrench size={24} />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
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
                          <span className="text-lg font-bold text-gray-900">
                            {formValues.category 
                              ? categories.find(c => c.id === formValues.category)?.translated_name || categories.find(c => c.id === formValues.category)?.name 
                              : t("selectCategory") || "Choose category"}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] z-[9999] rounded-[32px] border-none shadow-2xl p-2">
                        {categoriesLoading ? (
                          <SelectItem value="loading" disabled className="rounded-2xl">
                            {t("loading")}...
                          </SelectItem>
                        ) : categories.length > 0 ? (
                          categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="rounded-2xl my-1 focus:bg-blue-50 focus:text-blue-600 font-bold">
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
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                      {t("photosAttachments") || "Attachments"}
                      <span className="ml-2 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full lowercase font-bold tracking-normal italic">optional</span>
                    </h3>
                  </div>
                  <div className={`p-6 border-2 border-dashed rounded-[32px] transition-all duration-500 ${isRecording ? "bg-purple-50/50 border-purple-300" : "bg-white border-gray-100 hover:border-blue-200"}`}>
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                    {!isRecording ? (
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { icon: ImageIcon, label: "Photo", color: "bg-blue-50 text-blue-600", accept: "image/*" },
                          { icon: Video, label: "Video", color: "bg-emerald-50 text-emerald-600", accept: "video/*" },
                          { icon: Mic, label: "Voice", color: "bg-purple-50 text-purple-600", type: "voice" },
                          { icon: FileText, label: "File", color: "bg-orange-50 text-orange-600", accept: ".pdf,.doc,.docx" },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (item.type === "voice") {
                                startRecording();
                              } else {
                                fileInputRef.current.setAttribute("accept", item.accept);
                                fileInputRef.current.click();
                              }
                            }}
                            className="group flex flex-col items-center gap-3"
                          >
                            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-1 transition-all shadow-sm`}>
                              <item.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-purple-50/50 p-4 rounded-2xl">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white animate-pulse shadow-lg shadow-red-200">
                               <Mic size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase text-purple-600">Recording...</p>
                               <p className="text-2xl font-black text-gray-900 tabular-nums">{formatTime(recordingDuration)}</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => stopRecording(false)} className="w-10 h-10 rounded-full bg-white text-gray-400 hover:text-red-500 shadow-sm flex items-center justify-center transition-all"><X size={18} /></button>
                            <button onClick={() => stopRecording(true)} className="w-10 h-10 rounded-full bg-purple-600 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-all"><Check size={18} /></button>
                         </div>
                      </div>
                    )}
                  </div>
                  {attachments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 shadow-sm group">
                          <div className="flex items-center gap-3 truncate">
                            <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 group-hover:text-blue-500 transition-colors">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="truncate">
                               <p className="text-xs font-bold text-gray-900 truncate">{file.name}</p>
                               <p className="text-[9px] font-black text-gray-400 uppercase">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <button onClick={() => removeAttachment(index)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              {/* Step 2: Location, Timing, Budget */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 px-1">Where do you need this service?</h3>
                  <div className="relative">
                    <div className="bg-white hover:border-blue-200 border-2 border-transparent focus-within:border-blue-500 focus-within:shadow-2xl focus-within:shadow-blue-500/10 rounded-[32px] p-6 flex items-center gap-5 transition-all duration-300 shadow-sm">
                      <div className="p-4 bg-blue-50 rounded-[22px] text-blue-600">
                        <MapPin size={24} />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                          {t("location") || "Location"}
                        </label>
                        <div className="flex items-center gap-2">
                           <input
                            type="text"
                            placeholder="Enter your address..."
                            className="w-full text-lg font-bold focus:outline-none placeholder:text-gray-200 bg-transparent text-gray-900"
                            onChange={(e) => handleLocationSearch(e.target.value)}
                            value={locationSearchInput}
                          />
                          {isSearchingLocation && <Loader2 className="animate-spin text-blue-500" size={20} />}
                        </div>
                      </div>
                    </div>

                    {locationSuggestions.length > 0 && (
                      <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-[28px] shadow-2xl border border-gray-100 p-2 z-[60] animate-in slide-in-from-top-4 duration-300">
                        {locationSuggestions.map((place) => (
                          <button
                            key={place.place_id}
                            onClick={() => handleLocationSelect(place)}
                            className="w-full flex items-start gap-4 p-4 hover:bg-blue-50 rounded-[20px] transition-all group text-left"
                          >
                            <div className="p-2.5 bg-gray-50 group-hover:bg-white rounded-xl text-gray-400 group-hover:text-blue-500 transition-all">
                              <MapPin size={18} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600">{place.structured_formatting.main_text}</p>
                               <p className="text-[11px] font-medium text-gray-400 italic mt-0.5 line-clamp-1">{place.structured_formatting.secondary_text}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                
                </div>

                <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 px-1">Pick a Schedule</h3>
                   <div className="grid grid-cols-2 gap-3">
                      {timeOptionCards.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleTimeOptionSelect(opt.id)}
                          className={`flex flex-col items-start p-5 rounded-[28px] border-2 transition-all group relative
                            ${timeOption === opt.id ? `${opt.border} bg-white shadow-xl shadow-gray-100 scale-[1.02]` : "bg-white border-transparent hover:border-gray-100"}
                          `}
                        >
                          <div className={`p-3 ${opt.bg} ${opt.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                            <opt.icon size={22} />
                          </div>
                          <span className={`text-base font-black ${timeOption === opt.id ? "text-gray-900" : "text-gray-700"}`}>
                            {opt.title}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                            {opt.sub}
                          </span>
                          {timeOption === opt.id && (
                             <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${opt.color.replace('text-', 'bg-')} shadow-sm`}></div>
                          )}
                        </button>
                      ))}
                   </div>

                   {timeOption === "choose" && (
                     <div className="bg-white rounded-[32px] p-6 space-y-4 shadow-sm border border-gray-100 animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <button onClick={() => handleDateTimeClick("startDateTime")} className="p-4 bg-gray-50 hover:bg-white border-2 border-transparent hover:border-blue-500 rounded-2xl text-left transition-all">
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Start Date & Time</p>
                              <p className="font-bold text-gray-900">{formValues.startDateTime ? dayjs(formValues.startDateTime).format("MMM D, HH:mm") : "Select"}</p>
                           </button>
                           <button onClick={() => handleDateTimeClick("endDateTime")} className="p-4 bg-gray-50 hover:bg-white border-2 border-transparent hover:border-orange-500 rounded-2xl text-left transition-all">
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">End Date & Time</p>
                              <p className="font-bold text-gray-900">{formValues.endDateTime ? dayjs(formValues.endDateTime).format("MMM D, HH:mm") : "Select"}</p>
                           </button>
                        </div>
                        {showDatePicker && (
                          <div className="p-2">
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

                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 px-1">Expected Budget ({currencySymbol})</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 focus-within:border-blue-500 focus-within:shadow-xl transition-all">
                       <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Min. Price</label>
                       <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-300">{currencySymbol}</span>
                          <input type="number" name="minPrice" placeholder="0" className="w-full text-xl font-black focus:outline-none bg-transparent" onChange={handleChange} value={formValues.minPrice} />
                       </div>
                    </div>
                    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 focus-within:border-blue-500 focus-within:shadow-xl transition-all">
                       <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Max. Price</label>
                       <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-300">{currencySymbol}</span>
                          <input type="number" name="maxPrice" placeholder="0" className="w-full text-xl font-black focus:outline-none bg-transparent" onChange={handleChange} value={formValues.maxPrice} />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
               {/* Step 3: Summary */}
               <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-2xl shadow-blue-100/20 space-y-8">
                  <div className="space-y-8">
                     {/* Top Section: Title & Category */}
                     <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-50">
                        <div className="space-y-1.5 transition-all">
                           <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Requested Service</p>
                           <h4 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">{formValues.serviceTitle}</h4>
                           <div className="flex items-center gap-2 mt-2">
                              <div className="px-3 py-1 bg-gray-100 rounded-full text-[11px] font-bold text-gray-500">
                                {categories.find(c => c.id === formValues.category)?.translated_name || categories.find(c => c.id === formValues.category)?.name || "General"}
                              </div>
                           </div>
                        </div>
                        <div className="px-6 py-2 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest h-fit">Ready to post</div>
                     </div>

                     {/* Grid Section: Timing, Budget, Attachments */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-4 p-5 bg-gray-50/50 rounded-[28px] border border-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all border-dashed">
                           <Calendar className="text-blue-500 mt-0.5" size={20} />
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Timing</p>
                              <p className="text-xs font-bold text-gray-900 capitalize">{timeOption}</p>
                              <p className="text-[10px] font-medium text-gray-500 mt-1 leading-relaxed">
                                {timeOption === 'flexible' ? "Open to availability" : (
                                  <>
                                    {dayjs(formValues.startDateTime || new Date()).format("MMM D, HH:mm")}
                                    {formValues.endDateTime && (
                                       <span className="block text-gray-300">to {dayjs(formValues.endDateTime).format("MMM D, HH:mm")}</span>
                                    )}
                                  </>
                                )}
                              </p>
                           </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 bg-gray-50/50 rounded-[28px] border border-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all border-dashed">
                           <Gift className="text-emerald-500 mt-0.5" size={20} />
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Budget</p>
                              <p className="text-xs font-bold text-gray-900">
                                {formValues.minPrice && formValues.maxPrice 
                                  ? `${currencySymbol} ${formValues.minPrice} - ${formValues.maxPrice}` 
                                  : "Flexible"}
                              </p>
                           </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 bg-gray-50/50 rounded-[28px] border border-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all border-dashed">
                           <ImageIcon className="text-purple-500 mt-0.5" size={20} />
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Assets</p>
                              <p className="text-xs font-bold text-gray-900">{attachments.length} files attached</p>
                           </div>
                        </div>
                     </div>

                     {/* Full Width Description Section */}
                     <div className="bg-white rounded-[32px] p-8 border border-blue-50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors"></div>
                        <div className="space-y-3">
                           <div className="flex items-center gap-2">
                              <MessageSquare size={16} className="text-blue-500" />
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Description</p>
                           </div>
                           <p className="text-sm font-medium text-gray-600 leading-relaxed italic break-all">
                             "{formValues.serviceDescription}"
                           </p>
                        </div>
                     </div>
                  </div>

                 
               </div>
            </div>
          )}

          {/* Navigation Buttons (Sticky-ish bottom) */}
          <div className="mt-12 flex items-center gap-4">
            {currentStep < 3 ? (
              <Button
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[28px] text-lg font-black flex items-center justify-center gap-3 group transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                onClick={handleNext}
              >
                {t("continue") || "Continue"}
                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={24} />
              </Button>
            ) : (
              <Button
                className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[28px] text-lg font-black flex items-center justify-center gap-3 group transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t("submitRequest") || "Submit Request"}
                    <Sparkles className="group-hover:scale-125 transition-transform" size={24} />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomServiceDialog;
