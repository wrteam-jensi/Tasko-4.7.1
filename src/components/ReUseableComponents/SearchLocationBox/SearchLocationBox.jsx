"use client";
import React, { useState, useEffect } from "react";
import { IoLocationOutline, IoLocationSharp, IoSearch } from "react-icons/io5";
import { FaLocationCrosshairs } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import {
  locationAddressData,
  setLatitude,
  setLongitude,
} from "@/redux/reducers/locationSlice";
import { useRouter } from "next/router";
import { getFormattedAddress } from "@/utils/Helper";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { getPlacesDetailsForWebApi, getPlacesForWebApi, providerAvailableApi } from "@/api/apiRoutes";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import LocationModal from "../LocationModal";

const SearchLocationBox = ({ open, setIsModalOpen, onCurrentLocationDetected }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const t = useTranslation();

  const closeModal = () => setIsModalOpen(false);

  const [searchInput, setSearchInput] = useState(""); // Track user input
  const [isSelecting, setIsSelecting] = useState(false); // Prevent API calls during selection
  const [placeSuggestions, setPlaceSuggestions] = useState([]); // Store API results
  const [isLoading, setIsLoading] = useState(true); // API loading state
  const [activeIndex, setActiveIndex] = useState(-1); // Track currently focused suggestion
  const [apiError, setApiError] = useState(null); // Track API errors
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false); // Track location permission status
  const [fullAddress, setFullAddress] = useState({
    lat: "",
    lng: "",
    address: "",
  });
  const [tempCurrentLocation, setTempCurrentLocation] = useState({
    lat: "",
    lng: "",
    address: "",
  });

  // Check location permission status on component mount
  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
          setLocationPermissionGranted(false);
          return;
        }

        // Check permission status
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

        // Set initial permission status (allow both 'granted' and 'prompt' states)
        setLocationPermissionGranted(['granted', 'prompt'].includes(permissionStatus.state));

        // Listen for permission changes
        permissionStatus.addEventListener('change', () => {
          setLocationPermissionGranted(['granted', 'prompt'].includes(permissionStatus.state));
        });
      } catch (error) {
        // Fallback to checking if geolocation is available
        if (navigator.geolocation) {
          setLocationPermissionGranted(true);
        } else {
          console.error('Error checking location permission:', error);
          setLocationPermissionGranted(false);
        }
      }
    };

    checkLocationPermission();
  }, []);

  // Fetch places when input changes
  useEffect(() => {
    if (!searchInput.trim() || isSelecting) {
      setPlaceSuggestions([]);
      setActiveIndex(-1);
      setApiError(null);
      return;
    }

    const fetchPlaces = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const response = await getPlacesForWebApi({
          input: searchInput,
        });
        const data = await response?.data?.data;

        // Check if there's an error message in the response
        if (data.error_message || data.status === "REQUEST_DENIED") {
          // Set a simple warning message
          setApiError("Location search is temporarily unavailable");
          setPlaceSuggestions([]);
        } else {
          setPlaceSuggestions(data.predictions || []);
        }

        setActiveIndex(-1); // Reset index when suggestions change
      } catch (error) {
        console.error("Error fetching places:", error);
        setApiError("Location search is temporarily unavailable");
        setPlaceSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce API calls
    const timeoutId = setTimeout(fetchPlaces, 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchPlaceDetails = async (place) => {
    try {
      const response = await getPlacesDetailsForWebApi({
        place_id: place?.place_id,
      });
      return response?.data?.data?.result || response?.data?.data?.results?.[0];
    } catch (error) {
      console.log(error);
    }
  };
  // Handle place selection
  const handlePlaceSelect = async (place) => {
    setIsSelecting(true); // Mark as selecting to prevent API call
    setIsLoading(true); // Show loading state while fetching details

    setSearchInput(place.description); // Set the selected place in the input field

    try {
      const fullAddress = await fetchPlaceDetails(place);

      setFullAddress({
        lat: fullAddress?.geometry?.location?.lat,
        lng: fullAddress?.geometry?.location?.lng,
        address: fullAddress?.formatted_address,
      });
    } catch (error) {
      console.error("Error fetching place details:", error);
      toast.error(t("errorFetchingPlaceDetails"));
    } finally {
      // Clear the search input and suggestions
      setPlaceSuggestions([]); // Clear suggestions
      setActiveIndex(-1); // Reset active index
      setIsLoading(false); // Hide loading
    }

    // Delay allowing API calls after a short timeout
    setTimeout(() => setIsSelecting(false), 500);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (placeSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      // Move focus down
      setActiveIndex((prevIndex) =>
        prevIndex < placeSuggestions.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      // Move focus up
      setActiveIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : placeSuggestions.length - 1
      );
    } else if (e.key === "Enter" && activeIndex !== -1) {
      // Select the active suggestion
      handlePlaceSelect(placeSuggestions[activeIndex]);
    }
  };

  const handleSearchPlace = async () => {
    if (fullAddress.lat && fullAddress.lng && fullAddress.address) {
      try {
        const available = await providerAvailableApi({
          latitude: fullAddress.lat,
          longitude: fullAddress.lng,
        });
        if (!available || available?.error) {
          toast.error(available.message);
          return;
        }

        dispatch(setLatitude(fullAddress.lat));
        dispatch(setLongitude(fullAddress.lng));
        dispatch(locationAddressData(fullAddress.address));
        router.push("/");
      } catch (error) {
        toast.error(error.message);
      }
    } else if (fullAddress.address) {
      dispatch(locationAddressData(fullAddress.address));
      router.push("/");
    } else {
      toast.error(t("pleaseSelectValidLocation"));
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (!navigator.geolocation) {
        toast.error(t("notSupportedGeolocation"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // 🔄 Get formatted address but don't dispatch to Redux yet
          const address = await getFormattedAddress(latitude, longitude);

          // 🆕 Set temporary location state instead of dispatching to Redux
          setTempCurrentLocation({
            lat: latitude,
            lng: longitude,
            address: address,
          });

          // 🆕 Pass current location to parent component
          if (onCurrentLocationDetected) {
            onCurrentLocationDetected({
              lat: latitude,
              lng: longitude,
              address: address,
            });
          }

          // Open the modal for user to confirm/adjust location
          setIsModalOpen(true);
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error(t("permissionDenied"));
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error(t("positionUnavailable"));
              break;
            case error.TIMEOUT:
              toast.error(t("timeoutforlocation"));
              break;
            default:
              toast.error(t("unknownError"));
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds
          maximumAge: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching location:", error.message);
      toast.error("Failed to fetch location: " + error.message);
    }
  };

  // Update input change handler to clear address when input is empty
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    // Clear stored address if input is empty
    if (!value.trim()) {
      setFullAddress({
        lat: "",
        lng: "",
        address: "",
      });
    }
  };

  // Add this Skeleton component inside your SearchLocationBox component
  const LocationSkeleton = () => (
    <div className="absolute z-10 w-full top-8 card_bg rounded-b-xl shadow-lg max-h-60 overflow-y-auto primary_text_color">
      {[1, 2, 3].map((item) => (
        <div key={item} className="p-2 flex items-center gap-3 border-dashed border-b border-t-0 border-l-0 border-r-0 border last:border-none">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // Simplified error message component
  const ErrorMessage = ({ message }) => (
    <div className="absolute z-50 w-full top-8 card_bg rounded-b-xl shadow-lg p-4 text-center description_color">
      <div className="flex items-center justify-center gap-2 primary_text_color mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Notice</span>
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );

  // 🆕 Handle modal close and clear temporary location
  const handleModalClose = async () => {
    setIsModalOpen(false);
    if (tempCurrentLocation.lat && tempCurrentLocation.lng) {
      try {
        const available = await providerAvailableApi({
          latitude: tempCurrentLocation.lat,
          longitude: tempCurrentLocation.lng,
        });

        if (!available || available?.error) {
          toast.error(available.message);
          return;
        }
      } catch (error) {
        toast.error(available.message);
        return;
      }
    }
    setTempCurrentLocation({
      lat: "",
      lng: "",
      address: "",
    });
  };

  return (
    <>
      <div className="search_input_box w-full relative flex items-center card_bg p-2 rounded-md mt-4 sm:mt-6 lg:mt-10 gap-4">
        <div className="flex flex-1 items-center relative w-full">
          <IoLocationSharp size={20} className="description_color" />
          <input
            className="ml-2 focus:outline-none w-full text-sm sm:text-base bg-transparent"
            placeholder={t("enterLocation")}
            value={searchInput}
            onChange={handleInputChange} // Use the new handler
            onKeyDown={handleKeyDown}
          />
          {/* Dropdown of suggestions - Only show when we have input AND (loading OR suggestions) */}
          {searchInput.trim() && (isLoading || placeSuggestions.length > 0 || apiError) && (
            <>
              {isLoading ? (
                <LocationSkeleton />
              ) : apiError ? (
                <ErrorMessage message={apiError} />
              ) : (
                <div
                  className="absolute z-50 w-full top-8 card_bg rounded-b-xl shadow-lg max-h-60 overflow-y-auto primary_text_color"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {placeSuggestions.length > 0 ? (
                    placeSuggestions.map((place, index) => (
                      <div
                        key={place.place_id}
                        className={`cursor-pointer p-2 flex items-center gap-3 border-dashed border-b border-t-0 border-l-0 border-r-0 border last:border-none ${index === activeIndex ? "primary_bg_color text-white" : ""
                          }`}
                        onClick={() => handlePlaceSelect(place)}
                      >
                        <span>
                          <IoLocationOutline size={22} />
                        </span>
                        <span>{place.description}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center description_color">
                      {t("noResultsFound")}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-4 relative">
          {locationPermissionGranted && (
            <button
              className="px-3 py-2 bg-transparent description_color hover:primary_text_color rounded-md flex items-center justify-center gap-2 text-sm sm:text-base"
              onClick={() => getCurrentLocation()}
            >
              <FaLocationCrosshairs size={18} />
              <span className="hidden sm:block">{t("locateMe")}</span>
            </button>
          )}
          <button
            className="px-3 py-2 primary_bg_color text-white rounded-md flex items-center justify-center gap-2 text-sm sm:text-base transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSearchPlace}
            disabled={!fullAddress.lat || !fullAddress.lng || !fullAddress.address}
          >
            <IoSearch size={18} />
            <span className="hidden sm:block">{t("search")}</span>
          </button>
        </div>
      </div>

      {/* 🆕 Location Modal with temporary current location support */}
      <LocationModal
        open={open}
        onClose={handleModalClose}
        initialLocation={tempCurrentLocation.lat ? tempCurrentLocation : null}
      />
    </>
  );
};

export default SearchLocationBox;
