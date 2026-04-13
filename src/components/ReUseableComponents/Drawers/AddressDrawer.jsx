"use client";
import React, { useEffect, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useGoogleMapsLoader, useRTL } from "@/utils/Helper";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar";
import { BsPlusLg } from "react-icons/bs";
import { IoCheckmark } from "react-icons/io5";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setDilveryDetails } from "@/redux/reducers/cartSlice";
import { AddAddressApi } from "@/api/apiRoutes";
import { useTranslation } from "@/components/Layout/TranslationContext";
import MiniLoader from "../MiniLoader";
import AddressMap from "../LocationMapBox/AddressMap.jsx";
import { logClarityEvent } from "@/utils/clarityEvents";
import { AUTH_EVENTS } from "@/constants/clarityEventNames";

const AddressDrawer = ({
  open,
  onClose,
  defaultAddress,
  setDefaultAddress,
  addresses,
  setAddresses,
  onUpdateAddress,
}) => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const dilveryDetails = useSelector((state) => state.cart);
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const isRTL = useRTL();
  const [isClicked, setIsClicked] = useState(false);
  const [activeAddress, setActiveAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const addressTypes = ["home", "office", "other"];

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (defaultAddress && open) {
      setActiveAddress(defaultAddress);
      const reorderedAddresses = addresses.filter(
        (add) => add.id !== defaultAddress.id
      );
      setAddresses([defaultAddress, ...reorderedAddresses]);
    }
  }, [defaultAddress, open]);

  const [formValues, setFormValues] = useState({
    id: defaultAddress?.id ? defaultAddress?.id : "",
    address: defaultAddress?.address ? defaultAddress?.address : "",
    area: defaultAddress?.area ? defaultAddress?.area : "",
    city: defaultAddress?.city_name ? defaultAddress?.city_name : "",
    mobile: defaultAddress?.mobile ? defaultAddress?.mobile : "",
    type: defaultAddress?.type ? defaultAddress?.type : "",
    is_default: defaultAddress?.is_default === "1" ? true : false,
  });


  const [mapCoordinates, setMapCoordinates] = useState({
    lat: defaultAddress?.lattitude ? Number(defaultAddress?.lattitude) : "",
    lng: defaultAddress?.longitude ? Number(defaultAddress?.longitude) : "",
  });

  useEffect(() => {
    if (defaultAddress) {
      setFormValues({
        id: defaultAddress.id || "",
        address: defaultAddress.address || "",
        area: defaultAddress.area || "",
        city: defaultAddress.city_name || defaultAddress.city || "",
        mobile: defaultAddress.mobile || "",
        type: defaultAddress.type || "",
        is_default: defaultAddress.is_default === "1",
      });

      setMapCoordinates({
        lat: defaultAddress.lattitude ? Number(defaultAddress.lattitude) : "",
        lng: defaultAddress.longitude ? Number(defaultAddress.longitude) : "",
      });
    }
  }, [defaultAddress]);

  const handleSelectAddress = (address) => {
    // First validate the coordinates
    const validLat = Number(address?.lattitude);
    const validLng = Number(address?.longitude);

    if (isNaN(validLat) || isNaN(validLng)) {
      toast.error(t("invalidCoordinates"));
      return;
    }

    setActiveAddress(address);
    setIsClicked(false);

    // Find the address in the addresses array to ensure we have the most up-to-date data
    const selectedAddress = addresses.find((add) => add.id === address?.id);

    if (selectedAddress) {
      // Update form values - handle both city_name and city fields
      // This ensures city is populated even if address uses different field name
      // Also ensure all fields have fallback values to prevent empty form fields
      setFormValues({
        id: selectedAddress.id || "",
        address: selectedAddress.address || "",
        area: selectedAddress.area || "",
        city: selectedAddress.city_name || selectedAddress.city || "",
        mobile: selectedAddress.mobile || "",
        type: selectedAddress.type || "",
        is_default: selectedAddress.is_default === "1",
      });

      // Update map coordinates with validated numbers
      const newCoordinates = {
        lat: validLat,
        lng: validLng
      };

      // Update map coordinates
      setMapCoordinates(newCoordinates);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If it's the 'mobile' field, allow only digits
    if (name === "mobile") {
      const digitsOnly = value.replace(/\D/g, ""); // Remove non-digit characters
      setFormValues((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
    } else {
      // For other fields, update as usual
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleTypeChange = (type) => {
    setFormValues((prev) => ({
      ...prev,
      type: type,
    }));
  };

  const handleSetDefaultAddress = () => {
    setFormValues((prev) => ({
      ...prev,
      is_default: !prev.is_default,
    }));
  };

  const onLocationChange = (newAddresses) => {
    setFormValues((prev) => {
      return {
        ...prev,
        city: newAddresses.city,
        address: newAddresses.address,
        area: newAddresses.area,
      };
    });
    setMapCoordinates({
      lat: newAddresses.lat,
      lng: newAddresses.lng,
    });
  };

  const clearForm = () => {
    setFormValues({
      id: "",
      address: "",
      area: "",
      city: "",
      mobile: "",
      type: "",
      is_default: false,
    });
    setMapCoordinates({
      lat: "",
      lng: "",
    });
  };

  const handleButtonClick = () => {
    // Toggle add new address mode
    setIsClicked((prevState) => !prevState);
    // Clear selected address
    setActiveAddress(null);
    // Clear form values
    clearForm();
    // Reset map coordinates to empty to trigger default location
    setMapCoordinates({
      lat: "",
      lng: ""
    });
  };

  const handleSaveAddress = async () => {
    // Validation checks for required fields
    if (!formValues.type) {
      toast.error(t("pleaseSelectAddressType"));
      return;
    }
    if (!formValues.address) {
      toast.error(t("pleaseEnterAddressDetails"));
      return;
    }
    if (!formValues.area) {
      toast.error(t("pleaseEnterAreaDetails"));
      return;
    }
    if (!formValues.city) {
      toast.error(t("pleaseEnterCityDetails"));
      return;
    }
    if (!formValues.mobile) {
      toast.error(t("pleaseEnterMobileNumber"));
      return;
    }

    // Create the new address object from the form values
    const newAddress = {
      id: formValues.id ? formValues.id : "",
      type: formValues.type, // Assuming it's a home address; add logic to dynamically set this if needed
      city_name: formValues.city,
      address: formValues.address,
      area: formValues.area,
      mobile: formValues.mobile,
      lattitude: mapCoordinates.lat,
      longitude: mapCoordinates.lng,
      is_default: formValues.is_default ? "1" : "0",
    };

    setIsLoading(true);

    try {
      const response = await AddAddressApi({
        id: newAddress.id ? newAddress.id : "",
        type: newAddress.type ? newAddress.type : "",
        city_name: newAddress.city_name ? newAddress.city_name : "",
        address: newAddress.address ? newAddress.address : "",
        area: newAddress.area ? newAddress.area : "",
        mobile: newAddress.mobile ? newAddress.mobile : "",
        lattitude: newAddress.lattitude ? newAddress.lattitude : "",
        longitude: newAddress.longitude ? newAddress.longitude : "",
        is_default: newAddress.is_default ? newAddress.is_default : "",
      });

      if (response?.error === false) {
        const updatedAddress = response?.data;

        onUpdateAddress(updatedAddress);
        // Check if the address already exists by comparing the id
        setAddresses((prevAddresses) => {
          const existingAddress = prevAddresses.find(
            (addr) => addr.id === updatedAddress.id
          );
          if (existingAddress) {
            // If address exists, update it and move it to the top
            return [
              updatedAddress,
              ...prevAddresses.filter((addr) => addr.id !== updatedAddress.id),
            ];
          } else {
            // If address doesn't exist, add it to the top of the list
            return [updatedAddress, ...prevAddresses];
          }
        });

        // Set the new address as the default
        setDefaultAddress(updatedAddress);

        dispatch(
          setDilveryDetails({
            ...dilveryDetails, // Keep the existing delivery details
            dilevryLocation: updatedAddress, // Update dilevryLocation with the new address
          })
        );
        // Capture address creation for analytics – helps tie bookings to address mix.
        logClarityEvent(AUTH_EVENTS.ADDRESS_ADDED, {
          address_id: updatedAddress?.id,
          is_default: updatedAddress?.is_default === "1",
          has_coordinates: Boolean(
            updatedAddress?.lattitude && updatedAddress?.longitude
          ),
        });
        setIsLoading(false);
        // CLOSE THE DRAWER
        handleClose();
        toast.success(response?.message);
      }
    } catch (error) {
      toast.error(error?.message);
      console.log(error);
      setIsLoading(false);
    }
  };

  const breakpoints = {
    320: { slidesPerView: 1.2 },
    576: { slidesPerView: 1.5 },
    992: { slidesPerView: 2 },
    1200: { slidesPerView: 2.2 },
  };

  return (
    <Drawer open={open} onClose={handleClose} closeOnClickOutside={false}>
      <DrawerContent
        className={cn(
          "max-w-full md:max-w-[90%] lg:max-w-[85%] xl:max-w-7xl mx-auto rounded-tr-[18px] rounded-tl-[18px]",
          "overflow-y-auto",
          "transition-all duration-300",
          "after:!content-none"
        )}
      >
        <div className="address w-full flex flex-col lg:flex-row gap-6 py-4 px-4 md:p-6 lg:p-8 xl:p-10">
          {/* Left side: Map */}
          <div className="w-full lg:w-1/2">
            <div className="schedule_cal w-full">
              <div className="w-full rounded-lg overflow-hidden h-[300px] md:h-[350px] lg:h-[650px]">
                {isLoaded ? (
                  <>
                    <AddressMap
                      isClicked={true}
                      latitude={mapCoordinates?.lat}
                      longitude={mapCoordinates?.lng}
                      isLoaded={isLoaded}
                      loadError={loadError}
                      onLocationChange={onLocationChange}
                    />
                  </>
                ) : (
                  <p>Loading Map...</p>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Address fields */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4 md:gap-5 max-h-[400px] md:max-h-full overflow-y-auto">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl md:text-2xl font-bold">
                {isClicked ? t("addNewAddress") : t("selectAddress")}
              </h2>
              <button
                onClick={handleButtonClick}
                className="flex items-center gap-2 light_bg_color primary_text_color px-3 py-1 md:px-4 md:py-1 rounded-lg text-sm md:text-base font-normal"
              >
                <span>{t("addAddress")}</span>
                <span
                  className={`transition-transform duration-300 ${isClicked ? "rotate-45" : "rotate-0"
                    }`}
                >
                  <BsPlusLg size={18} />
                </span>
              </button>
            </div>

            <div className="address_div w-full">
              <Swiper
                spaceBetween={10}
                slidesPerView="auto"
                modules={[FreeMode]}
                freeMode={true}
                key={isRTL}
                dir={isRTL ? "rtl" : "ltr"}
                className="!pb-2"
              >
                {addresses.map((address, index) => (
                  <SwiperSlide key={address.id} className="!w-auto min-w-[180px] max-w-[250px]">
                    <div
                      onClick={() => handleSelectAddress(address)}
                      className={`p-3 border ${activeAddress?.id === address.id ? "border_color" : ""
                        } flex flex-col gap-2 items-start rounded-xl cursor-pointer`}
                    >
                      <div
                        className={`text-sm md:text-base flex items-center justify-between ${activeAddress?.id === address.id
                            ? "primary_text_color"
                            : "description_color"
                          } w-full`}
                      >
                        <span>{address.type}</span>
                        {activeAddress?.id === address.id && (
                          <IoCheckmark size={16} />
                        )}
                      </div>
                      <div className="text-base font-medium line-clamp-1">
                        {address.city_name || address.city}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div className="address_fields flex flex-col gap-3 md:gap-4">
              {["area", "address", "city", "mobile"].map((field) => (
                <input
                  key={field}
                  name={field}
                  type="text"
                  value={formValues[field]}
                  onChange={handleInputChange}
                  placeholder={
                    {
                      area: t("area"),
                      address: t("addressDetail"),
                      city: t("city"),
                      mobile: t("mobile"),
                    }[field]
                  }
                  className="w-full p-3 border background_color rounded-lg transition-all duration-300 focus:outline-none focus:border_color focus:light_bg_color focus:primary_text_color"
                />
              ))}

              <div className="types flex items-center gap-2 flex-wrap">
                {addressTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`py-1 px-3 border rounded-lg transition-colors ${formValues.type === type
                        ? "light_bg_color primary_text_color border_color"
                        : "background_color"
                      }`}
                  >
                    {t(type)}
                  </button>
                ))}
              </div>
              <div className="default_address flex items-center gap-2">
                <input
                  type="checkbox"
                  id="setDefaultAddress"
                  checked={formValues.is_default}
                  onChange={handleSetDefaultAddress}
                  className="form-checkbox h-4 w-4 !bg-black border-gray-300 rounded focus:ring-primary_color"
                />
                <label
                  htmlFor="setDefaultAddress"
                  className="text-xs md:text-sm font-medium"
                >
                  {t("setDefaultAddress")}
                </label>
              </div>
              <div className="submit_address mt-1 md:mt-2 mb-2">
                {isLoading ? (
                  <button className="primary_bg_color primary_text_color py-3 px-8 rounded-xl w-full flex items-center justify-center">
                    <MiniLoader />
                  </button>
                ) : (
                  <button
                    className="w-full primary_bg_color text-white p-3 rounded-xl text-sm md:text-base font-normal"
                    onClick={handleSaveAddress}
                  >
                    {t("continue")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddressDrawer;
