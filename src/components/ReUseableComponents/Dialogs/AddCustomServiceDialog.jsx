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
import { MdClose } from "react-icons/md";
import { Button } from "@/components/ui/button";
import CustomDateTimePicker from "../CustomDateTimePicker/CustomDateTimePicker"; // Import your custom date-time picker
import { useTranslation } from "@/components/Layout/TranslationContext";
import dayjs from "dayjs";
import {
  getAllCategoriesApi,
  getCategoriesApi,
  makeCustomJobRequestApi,
} from "@/api/apiRoutes";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const AddCustomServiceDialog = ({ open, close, fetchBookings }) => {
  const t = useTranslation();
  const locationData = useSelector((state) => state?.location);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState(null); // 'start' or 'end'
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]); // State for all categories
  const [categoriesLoading, setCategoriesLoading] = useState(false); // Loading state for categories

  const [formValues, setFormValues] = useState({
    serviceTitle: "",
    serviceDescription: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    startDateTime: null,
    endDateTime: null,
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleDateTimeClick = (type) => {
    setDatePickerType(type);
    setShowDatePicker(true);
    // close(); // Close the main dialog
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

      // Check if response has data property or if data is directly in response
      const categoriesData = response?.data || response;

      setCategories(categoriesData || []); // Store all categories with fallback to empty array
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]); // Set empty array on error
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
  };

  // State for form values
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
    // Add price comparison validation
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
      // Format dates and times separately
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

  if (showDatePicker) {
    return (
      <Dialog
        open={showDatePicker}
        onOpenChange={() => {
          setShowDatePicker(false);
        }}
      >
        <DialogContent className="sm:max-w-[600px] w-full">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {datePickerType === "startDateTime"
                ? t("selectStartDateAndTime")
                : t("selectEndDateAndTime")}
            </DialogTitle>
            <button
              onClick={() => {
                setShowDatePicker(false);
              }}
            >
              <MdClose size={18} />
            </button>
          </DialogHeader>
          <CustomDateTimePicker
            value={formValues[datePickerType]}
            onChange={handleDateTimeSelect}
            minDateTime={formValues.startDateTime}
            type={datePickerType}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            {t("reqNewService")}
          </DialogTitle>
          <button onClick={close}>
            <MdClose size={18} />
          </button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category Select */}

          <div className="flex items-center space-x-2">
            <Select
              onValueChange={(value) =>
                setFormValues((prevValues) => ({
                  ...prevValues,
                  category: value,
                }))
              }
              value={formValues.category}
            >
              <SelectTrigger className="w-full px-4 py-2 border rounded-md description_color focus:outline-none focus:ring-0 focus:ring-transparent background_color description_color">
                <SelectValue placeholder={categoriesLoading ? t("loading") : t("selectService")} />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto z-[9999]">
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>
                    {t("loading")}...
                  </SelectItem>
                ) : categories && categories.length > 0 ? (
                  categories.map((category) => {
                    const translatedCategoryName = category?.translated_name ? category?.translated_name : category?.name;
                    return (
                      <SelectItem key={category?.id} value={category?.id}>
                        {translatedCategoryName}
                      </SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value="no-categories" disabled>
                    {t("noCategoriesAvailable")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {/* Service Title */}
          <input
            type="text"
            name="serviceTitle"
            placeholder={t("serviceTitle")}
            className="w-full background_color description_color p-2 rounded focus:outline-none focus:ring-0 focus:ring-transparent dark:border"
            onChange={handleChange}
            value={formValues.serviceTitle}
          />

          {/* Service Description */}
          <textarea
            name="serviceDescription"
            placeholder={t("serviceDesc")}
            className="w-full background_color description_color p-2 rounded focus:outline-none focus:ring-0 focus:ring-transparent dark:border"
            onChange={handleChange}
            value={formValues.serviceDescription}
          />

          {/* Price Range Inputs */}
          <div className="flex gap-4">
            <input
              type="number"
              name="minPrice"
              placeholder={t("minPrice")}
              className="w-1/2 background_color description_color p-2 rounded focus:outline-none focus:ring-0 focus:ring-transparent dark:border"
              onChange={handleChange}
              value={formValues.minPrice}
            />
            <input
              type="number"
              name="maxPrice"
              placeholder={t("maxPrice")}
              className="w-1/2 background_color description_color p-2 rounded focus:outline-none focus:ring-0 focus:ring-transparent dark:border"
              onChange={handleChange}
              value={formValues.maxPrice}
            />
          </div>

          {/* Date Time Buttons */}
          <Button
            variant="outline"
            className="w-full justify-start text-left background_color description_color"
            onClick={() => handleDateTimeClick("startDateTime")}
          >
            {formValues.startDateTime
              ? dayjs(formValues.startDateTime).format("MMM D, YYYY h:mm A")
              : t("selectStartDateAndTime")}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-left background_color description_color"
            onClick={() => handleDateTimeClick("endDateTime")}
          >
            {formValues.endDateTime
              ? dayjs(formValues.endDateTime).format("MMM D, YYYY h:mm A")
              : t("selectEndDateAndTime")}
          </Button>

          {/* Submit Button */}
          {loading ? (
            <Button className="w-full primary_bg_color text-white" disabled>
              {t("processing")}
            </Button>
          ) : (
            <Button
              className="w-full primary_bg_color text-white"
              onClick={handleSubmit}
            >
              {t("submitRequest")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomServiceDialog;
