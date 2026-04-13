"use client";
import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { FaSearch } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { IoLocationOutline } from "react-icons/io5";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { getPlacesDetailsForWebApi, getPlacesForWebApi } from "@/api/apiRoutes";
import { darkThemeStyles, useIsDarkMode } from "@/utils/Helper";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelector } from "react-redux";

const containerStyle = { width: "100%", height: "100%" };

const AddressMap = ({
    latitude,
    longitude,
    isLoaded,
    loadError,
    isClicked,
    onLocationChange,
    currentFormValues = null, // Add current form values to check what's already filled
}) => {
    // ✅ All hooks must be called first, before any return
    const t = useTranslation();
    const isDarkMode = useIsDarkMode();

    const locationData = useSelector((state) => state?.location);

    const [isLoading, setIsLoading] = useState(false);
    const [map, setMap] = useState(null);
    const [zoom, setZoom] = useState(14);

    const [searchInput, setSearchInput] = useState("");
    const [placeSuggestions, setPlaceSuggestions] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false); // Prevent API calls during selection
    const [apiError, setApiError] = useState(null); // Track API errors

    const inputRef = useRef(null);

    // Default coordinates of user's location
    const DEFAULT_LAT = locationData?.lat;
    const DEFAULT_LNG = locationData?.lng;
    // Initialize marker position with parent coordinates or user's location
    const [markerPosition, setMarkerPosition] = useState(() => {
        // First priority: Parent provided coordinates
        if (latitude && longitude) {
            return {
                lat: Number(latitude),
                lng: Number(longitude)
            };
        }
        // Second priority: User's selected location from Redux
        if (DEFAULT_LAT && DEFAULT_LNG) {
            return {
                lat: Number(DEFAULT_LAT),
                lng: Number(DEFAULT_LNG)
            };
        }
        // Return null if no valid coordinates
        return null;
    });

    // Validate and convert coordinates to numbers
    const validateCoordinates = (lat, lng) => {

        // Handle null, undefined, or empty string inputs
        if (lat === null || lat === undefined || lat === "" ||
            lng === null || lng === undefined || lng === "") {
            return null;
        }

        const validLat = Number(lat);
        const validLng = Number(lng);


        if (isNaN(validLat) || isNaN(validLng) ||
            validLat < -90 || validLat > 90 ||
            validLng < -180 || validLng > 180) {
            return null;
        }

        return { lat: validLat, lng: validLng };
    };

    const initializeMap = async () => {
        try {
            let coordinates = null;
            let shouldReverseGeocode = false;

            // Priority 1: Parent provided coordinates
            if (latitude && longitude) {
                coordinates = validateCoordinates(latitude, longitude);
                shouldReverseGeocode = false;
            }
            // Priority 2: User's selected location from Redux
            else if (DEFAULT_LAT && DEFAULT_LNG) {
                coordinates = validateCoordinates(DEFAULT_LAT, DEFAULT_LNG);
                shouldReverseGeocode = true;
            }
            // Priority 3: Try getting current location
            else {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 5000,
                            maximumAge: 0,
                            enableHighAccuracy: true
                        });
                    });

                    coordinates = validateCoordinates(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    shouldReverseGeocode = true;
                } catch (error) {
                    console.log("Could not get current location:", error);
                }
            }

            // If we have valid coordinates, update position
            if (coordinates && coordinates.lat && coordinates.lng) {
                setMarkerPosition(coordinates);
                
                // Only reverse geocode for new locations (not parent-provided)
                if (shouldReverseGeocode) {
                    await reverseGeocode(coordinates.lat, coordinates.lng);
                }
            } else {
                // If no coordinates available, don't set any position
                // This will keep the map centered on the current position or show a blank state
                console.log("No valid coordinates available");
            }

        } catch (error) {
            console.error("Error initializing map:", error);
            // Don't set any fallback coordinates, let the map handle the null state
        }
    };

    // Track if marker has been dragged
    const hasBeenDragged = useRef(false);

    // Update map when coordinates change
    useEffect(() => {
        // If coordinates are empty strings or invalid, reset to default location
        if (!latitude || !longitude || latitude === "" || longitude === "") {
            if (DEFAULT_LAT && DEFAULT_LNG) {
                const defaultCoords = {
                    lat: Number(DEFAULT_LAT),
                    lng: Number(DEFAULT_LNG)
                };
                setMarkerPosition(defaultCoords);
                if (map) {
                    map.panTo(defaultCoords);
                }
                // Trigger reverse geocoding for default location
                reverseGeocode(defaultCoords.lat, defaultCoords.lng);
            } else {
                // If no default coordinates, try to get current location
                initializeMap();
            }
            return;
        }

        // Validate new coordinates
        const validCoords = validateCoordinates(latitude, longitude);
        if (!validCoords) return;

        // Update marker position and center map
        setMarkerPosition(validCoords);
        if (map) {
            map.panTo(validCoords);
        }

    }, [latitude, longitude, map, DEFAULT_LAT, DEFAULT_LNG]); // Dependencies include coordinates and map instance

    // ✅ Updated useEffect with better error handling like SearchLocationBox
    useEffect(() => {
        if (!searchInput.trim() || isSelecting) {
            setPlaceSuggestions([]);
            setActiveIndex(-1);
            setApiError(null);
            return;
        }

        const fetchSuggestions = async () => {
            setIsLoading(true);
            setApiError(null);
            try {
                const response = await getPlacesForWebApi({ input: searchInput });
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
        const debounce = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(debounce);
    }, [searchInput, isSelecting]);

    // ✅ Now return statements come AFTER hooks
    if (loadError) return <div>Error loading Google Maps</div>;
    if (!isLoaded) return <div>Loading...</div>;

    // 🔄 Updated reverseGeocode function to use custom API and extract area name
    const reverseGeocode = async (lat, lng) => {
        try {
            // Use your custom backend API for reverse geocoding
            const response = await getPlacesDetailsForWebApi({
                latitude: lat,
                longitude: lng,
            });

            const placeDetails = response?.data?.data?.results?.[0];

            if (placeDetails) {
                const address = placeDetails?.formatted_address || "Address not found";

                // Extract city from address components
                const city = placeDetails?.address_components?.find((c) =>
                    c.types.includes("locality")
                )?.long_name || "";

                // Extract area name (sublocality, neighborhood, or administrative_area_level_2)
                const area = placeDetails?.address_components?.find((c) =>
                    c.types.includes("sublocality") ||
                    c.types.includes("neighborhood") ||
                    c.types.includes("administrative_area_level_2")
                )?.long_name || "";

                // Extract street name and number for more detailed address
                const streetNumber = placeDetails?.address_components?.find((c) =>
                    c.types.includes("street_number")
                )?.long_name || "";

                const streetName = placeDetails?.address_components?.find((c) =>
                    c.types.includes("route")
                )?.long_name || "";

                // Create detailed address with available information
                let detailedAddress = address; // Default to formatted address

                if (streetNumber && streetName) {
                    // If we have both street number and name
                    detailedAddress = `${streetNumber} ${streetName}, ${area}, ${city}`;
                } else if (streetName) {
                    // If we only have street name
                    detailedAddress = `${streetName}, ${area}, ${city}`;
                } else if (area && area !== "") {
                    // If we have area but no street info
                    detailedAddress = `${area}, ${city}`;
                }

                // Only update fields that are empty or not filled by user
                const updateData = {
                    lat,
                    lng,
                    address: (currentFormValues?.address && currentFormValues.address.trim() !== "") ? currentFormValues.address : detailedAddress,
                    city: (currentFormValues?.city && currentFormValues.city.trim() !== "") ? currentFormValues.city : city,
                    area: (currentFormValues?.area && currentFormValues.area.trim() !== "") ? currentFormValues.area : area,
                    fullAddress: address // Keep original formatted address as well
                };

                // Call the parent component's callback with the enhanced location data
                onLocationChange(updateData);
            } else {
                // Fallback message
                onLocationChange({
                    lat,
                    lng,
                    address: "",
                    city: "",
                    area: "",
                    fullAddress: ""
                });
            }
        } catch (error) {
            console.error("Error with custom reverse geocoding API:", error);
            // Fallback error handling
            onLocationChange({
                lat,
                lng,
                address: "",
                city: "",
                area: "",
                fullAddress: ""
            });
        }
    };

    // 🔄 Updated handleMarkerDragEnd to use custom API
    const handleMarkerDragEnd = async (e) => {
        try {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();

            // Validate new coordinates
            const validCoords = validateCoordinates(newLat, newLng);
            if (!validCoords) {
                console.error("Invalid coordinates from drag");
                return;
            }

            // Mark that marker has been dragged and store position
            hasBeenDragged.current = true;

            // Update marker position immediately for better UX
            setMarkerPosition(validCoords);

            // Force map to center on new position
            if (map) {
                map.panTo(validCoords);
            }

            try {
                // Use custom API for reverse geocoding
                await reverseGeocode(validCoords.lat, validCoords.lng);
            } catch (error) {
                // If reverse geocoding fails, still keep the dragged position
                console.error("Reverse geocoding failed:", error);
                onLocationChange({
                    lat: validCoords.lat,
                    lng: validCoords.lng,
                    address: "",
                    city: "",
                    area: "",
                    fullAddress: ""
                });
            }
        } catch (error) {
            console.error("Error in drag handler:", error);
            // Even if there's an error, keep the dragged position
            onLocationChange({
                lat: newLat,
                lng: newLng,
                address: "",
                city: "",
                area: "",
                fullAddress: ""
            });
        }
    };

    // 🆕 Updated handlePlaceSelect with same logic as SearchLocationBox
    const handlePlaceSelect = async (place) => {
        setIsSelecting(true); // Mark as selecting to prevent API call
        setIsLoading(true); // Show loading state while fetching details

        try {
            const placeDetailsRes = await getPlacesDetailsForWebApi({
                place_id: place?.place_id,
            });
            const placeDetails = placeDetailsRes?.data?.data?.result || placeDetailsRes?.data?.data?.results?.[0];

            if (!placeDetails) {
                console.error("No place details found");
                return;
            }

            const lat = placeDetails.geometry?.location?.lat;
            const lng = placeDetails.geometry?.location?.lng;

            if (lat && lng) {
                setMarkerPosition({ lat, lng });
                setZoom(18);

                if (map) map.panTo({ lat, lng });

                // Extract enhanced address information for place selection
                const city = placeDetails.address_components.find((c) =>
                    c.types.includes("locality")
                )?.long_name || "";

                const area = placeDetails.address_components.find((c) =>
                    c.types.includes("sublocality") ||
                    c.types.includes("neighborhood") ||
                    c.types.includes("administrative_area_level_2")
                )?.long_name || "";

                const streetNumber = placeDetails.address_components.find((c) =>
                    c.types.includes("street_number")
                )?.long_name || "";

                const streetName = placeDetails.address_components.find((c) =>
                    c.types.includes("route")
                )?.long_name || "";

                // Create detailed address with available information
                let detailedAddress = placeDetails.formatted_address; // Default to formatted address

                if (streetNumber && streetName) {
                    // If we have both street number and name
                    detailedAddress = `${streetNumber} ${streetName}, ${area}, ${city}`;
                } else if (streetName) {
                    // If we only have street name
                    detailedAddress = `${streetName}, ${area}, ${city}`;
                } else if (area && area !== "") {
                    // If we have area but no street info
                    detailedAddress = `${area}, ${city}`;
                }

                // Only update fields that are empty or not filled by user
                const updateData = {
                    lat,
                    lng,
                    address: (currentFormValues?.address && currentFormValues.address.trim() !== "") ? currentFormValues.address : detailedAddress,
                    city: (currentFormValues?.city && currentFormValues.city.trim() !== "") ? currentFormValues.city : city,
                    area: (currentFormValues?.area && currentFormValues.area.trim() !== "") ? currentFormValues.area : area,
                    fullAddress: placeDetails.formatted_address
                };

                onLocationChange(updateData);

                setSearchInput("");
                setPlaceSuggestions([]);
                setActiveIndex(-1);
                inputRef.current?.blur();
                setIsInputFocused(false);
                setApiError(null);
            }
        } catch (error) {
            console.error("Failed to fetch place details:", error);
            setApiError("Error fetching place details");
        } finally {
            setIsLoading(false);
            // Delay allowing API calls after a short timeout
            setTimeout(() => setIsSelecting(false), 500);
        }
    };

    const handleKeyDown = (e) => {
        if (placeSuggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            setActiveIndex((prev) =>
                prev < placeSuggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            setActiveIndex((prev) =>
                prev > 0 ? prev - 1 : placeSuggestions.length - 1
            );
        } else if (e.key === "Enter" && activeIndex !== -1) {
            handlePlaceSelect(placeSuggestions[activeIndex]);
        }
    };

    // 🆕 Skeleton component same as SearchLocationBox
    const LocationSkeleton = () => (
        <div className="absolute z-10 w-full top-[40px] left-0 card_bg rounded-b-xl shadow-lg max-h-60 overflow-y-auto primary_text_color">
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

    // 🆕 Error message component same as SearchLocationBox
    const ErrorMessage = ({ message }) => (
        <div className="absolute z-50 w-full top-[40px] left-0 card_bg rounded-b-xl shadow-lg p-4 text-center description_color">
            <div className="flex items-center justify-center gap-2 primary_text_color mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Notice</span>
            </div>
            <p className="text-sm">{message}</p>
        </div>
    );

    // 🆕 Updated input change handler
    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);

        // Clear API error when input changes
        if (apiError) {
            setApiError(null);
        }
    };

    return (
        <div className="relative w-full h-full">
            <div
                className={cn("absolute z-10 w-full p-4 transition-all duration-700", {
                    "top-0 opacity-100": isClicked,
                    "-top-16 opacity-0": !isClicked,
                })}
            >
                <div className={`relative flex items-center gap-3 card_bg p-2 w-full border rounded-xl transition-all duration-300
        ${isLoading || placeSuggestions.length > 0 || apiError ? `rounded-b-none` : `rounded-xl`}`}>
                    <FaSearch />
                    <input
                        ref={inputRef}
                        className="ml-2 focus:outline-none w-full text-sm sm:text-base bg-transparent"
                        placeholder={t("enterLocation")}
                        value={searchInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                    />

                    {/* 🆕 Updated dropdown with same logic as SearchLocationBox */}
                    {searchInput.trim() && (isLoading || placeSuggestions.length > 0 || apiError) && (
                        <>
                            {isLoading ? (
                                <LocationSkeleton />
                            ) : apiError ? (
                                <ErrorMessage message={apiError} />
                            ) : (
                                <div
                                    className="absolute z-50 w-full top-[40px] left-0 card_bg rounded-b-xl shadow-lg max-h-60 overflow-hidden overflow-y-auto primary_text_color"
                                    style={{
                                        scrollbarWidth: "none",
                                        msOverflowStyle: "none",
                                    }}
                                >
                                    {placeSuggestions.length > 0 ? (
                                        placeSuggestions.map((place, index) => (
                                            <div
                                                key={place.place_id}
                                                className={`cursor-pointer  p-2 flex items-center gap-3 border-dashed border-b border-t-0 border-l-0 border-r-0 border last:border-none ${index === activeIndex ? "primary_bg_color text-white" : ""
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
            </div>

            <GoogleMap
                className="map_box w-full relative"
                center={markerPosition}
                zoom={zoom}
                mapContainerStyle={containerStyle}
                options={{
                    fullscreenControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    zoomControl: true,
                    styles: isDarkMode ? darkThemeStyles : [],
                }}
                onLoad={(mapInstance) => setMap(mapInstance)}
            >
                <MarkerF
                    position={markerPosition}
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                />
            </GoogleMap>
        </div>
    );
};

export default AddressMap;