"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { cn } from "@/lib/utils";
import { IoLocationOutline } from "react-icons/io5";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { getPlacesDetailsForWebApi, getPlacesForWebApi, getProvidersOnMapApi } from '@/api/apiRoutes';
import { darkThemeStyles, useIsDarkMode, useRTL } from "@/utils/Helper";
import { Skeleton } from "@/components/ui/skeleton";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import NearbyProviderCard from "@/components/Cards/NearbyProviderCard";
import { FaSearch } from "react-icons/fa";
import CustomLink from "../CustomLink";
import { useSelector } from "react-redux";

const containerStyle = { width: "100%", height: "100%" };

// Map Loading Skeleton Component
const MapLoadingSkeleton = () => (
  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
    <div className="w-full h-full relative">
      {/* Map Background */}
      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

// Provider pin SVG as a data URL
const PROVIDER_PIN_SVG = `data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20x%3D%227%22%20y%3D%224%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22white%22/%3E%3Cpath%20d%3D%22M12%201C16.9706%201%2021%204.64613%2021%209.14355C20.9998%2013.6057%2015.1271%2019.8127%2013.6455%2021.6748C12.6009%2023.1083%2011.3991%2023.1083%2010.3545%2021.6748C8.87285%2019.8127%203.00022%2013.6057%203%209.14355C3%204.64613%207.02944%201%2012%201ZM12%205C11.6047%205%2011.4069%204.99968%2011.251%205.06055C11.0431%205.14174%2010.8781%205.29812%2010.792%205.49414C10.7528%205.58352%2010.7375%205.68736%2010.7314%205.83887C10.7226%206.06194%2010.6006%206.26924%2010.3955%206.38086C10.1907%206.49214%209.94054%206.48785%209.73145%206.38379C9.58912%206.31286%209.48556%206.27342%209.38379%206.26074C9.16067%206.23305%208.93439%206.28978%208.75586%206.41895C8.62213%206.51583%208.52365%206.67751%208.32617%207C8.12861%207.32262%208.02895%207.48392%208.00684%207.6416C7.97746%207.85196%208.03878%208.06506%208.17578%208.2334C8.2383%208.31015%208.32564%208.37532%208.46191%208.45605C8.66242%208.57485%208.792%208.77676%208.79199%209C8.79198%209.22324%208.6624%209.42519%208.46191%209.54395C8.32565%209.6247%208.2383%209.68986%208.17578%209.7666C8.03878%209.93492%207.97746%2010.148%208.00684%2010.3584C8.02896%2010.5161%208.12863%2010.6774%208.32617%2011C8.52366%2011.3225%208.62211%2011.4842%208.75586%2011.5811C8.93439%2011.7102%209.16067%2011.7669%209.38379%2011.7393C9.48554%2011.7266%209.58915%2011.6871%209.73145%2011.6162C9.94056%2011.5122%2010.1907%2011.5079%2010.3955%2011.6191C10.6006%2011.7308%2010.7226%2011.938%2010.7314%2012.1611C10.7375%2012.3126%2010.7528%2012.4165%2010.792%2012.5059C10.8781%2012.7019%2011.0431%2012.8583%2011.251%2012.9395C11.4069%2013.0003%2011.6047%2013%2012%2013C12.3953%2013%2012.5931%2013.0003%2012.749%2012.9395C12.9569%2012.8583%2013.1219%2012.7019%2013.208%2012.5059C13.2472%2012.4165%2013.2625%2012.3126%2013.2686%2012.1611C13.2774%2011.9381%2013.3994%2011.7308%2013.6045%2011.6191C13.8093%2011.5078%2014.0594%2011.5121%2014.2686%2011.6162C14.4109%2011.6871%2014.5144%2011.7266%2014.6162%2011.7393C14.8393%2011.767%2015.0656%2011.7102%2015.2441%2011.5811C15.3779%2011.4842%2015.4764%2011.3225%2015.6738%2011C15.8714%2010.6774%2015.971%2010.5161%2015.9932%2010.3584C16.0225%2010.148%2015.9612%209.93492%2015.8242%209.7666C15.7617%209.68985%2015.6744%209.62466%2015.5381%209.54395C15.3376%209.42519%2015.208%209.22322%2015.208%209C15.208%208.77676%2015.3376%208.57481%2015.5381%208.45605C15.6744%208.37531%2015.7617%208.31017%2015.8242%208.2334C15.9612%208.06509%2016.0225%207.85196%2015.9932%207.6416C15.971%207.48394%2015.8714%207.32259%2015.6738%207C15.4763%206.67752%2015.3779%206.51582%2015.2441%206.41895C15.0656%206.28978%2014.8393%206.23305%2014.6162%206.26074C14.5144%206.27342%2014.4108%206.31288%2014.2686%206.38379C14.0594%206.48783%2013.8093%206.49216%2013.6045%206.38086C13.3994%206.26924%2013.2774%206.06196%2013.2686%205.83887C13.2625%205.68736%2013.2472%205.58352%2013.208%205.49414C13.1219%205.29812%2012.9569%205.14174%2012.749%205.06055C12.5931%204.99968%2012.3953%205%2012%205ZM12%207.7998C12.7029%207.79981%2013.2725%208.33724%2013.2725%209C13.2725%209.66276%2012.7029%2010.2002%2012%2010.2002C11.2971%2010.2002%2010.7275%209.66276%2010.7275%209C10.7275%208.33724%2011.2971%207.7998%2012%207.7998Z%22%20fill%3D%22%230079FF%22/%3E%3C/svg%3E`;


const Map = ({
  latitude,
  longitude,
  isLoaded,
  loadError,
  isClicked,
  onLocationChange,
  showProviders = true,
  selectionMode = false,
  onFetchingStateChange = () => { }, // Add callback for fetching state
}) => {
  // ✅ All hooks must be called first, before any return
  const t = useTranslation();
  const isRTL = useRTL();
  const isDarkMode = useIsDarkMode();

  const locationData = useSelector((state) => state?.location);

  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(14);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [providers, setProviders] = useState([]); // Add state for providers

  const [searchInput, setSearchInput] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false); // Prevent API calls during selection
  const [apiError, setApiError] = useState(null); // Track API errors

  const [visibleProviders, setVisibleProviders] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [providerSearch, setProviderSearch] = useState("");

  useEffect(() => {
    if (providers.length > 0) {
      const filtered = providers.filter((provider) => {
        const name = provider?.company_name?.toLowerCase() || "";
        const city = provider?.city?.toLowerCase() || "";
        const address = provider?.address?.toLowerCase() || "";
        const search = providerSearch.toLowerCase();

        return name.includes(search) || city.includes(search) || address.includes(search);
      });

      setVisibleProviders(filtered);
    } else {
      setVisibleProviders([]);
    }
  }, [providers, providerSearch]);

  const inputRef = useRef(null);

  // ✅ Optimized: Memoize marker position to prevent unnecessary re-renders
  const markerPosition = useMemo(() => {
    if (latitude && longitude) {
      return { lat: parseFloat(latitude), lng: parseFloat(longitude) };
    }
    return { lat: locationData?.lat, lng: locationData?.lng }; // Default Bhuj
  }, [latitude, longitude]);

  // ✅ Optimized: Memoize map options
  const mapOptions = useMemo(() => ({
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    zoomControl: false,
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    styles: isDarkMode ? darkThemeStyles : [],
  }), [isDarkMode]);

  // 🔄 Optimized: Simplified reverseGeocode function
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await getPlacesDetailsForWebApi({
        latitude: lat,
        longitude: lng,
      });

      const placeDetails = response?.data?.data?.results?.[0];

      if (placeDetails) {
        const address = placeDetails?.formatted_address;
        const city = placeDetails?.address_components?.find((c) =>
          c.types.includes("locality")
        )?.long_name;

        onLocationChange({ lat, lng, address, city });
      } else {
        onLocationChange({
          lat,
          lng,
          address: "",
          city: ""
        });
      }
    } catch (error) {
      console.error("Error with custom reverse geocoding API:", error);
      onLocationChange({
        lat,
        lng,
        address: "",
        city: ""
      });
    }
  };

  // ✅ Optimized: Function to fetch providers based on location
  const fetchProviders = async (lat, lng) => {
    if (!showProviders || selectionMode) return;

    try {
      const response = await getProvidersOnMapApi({
        latitude: lat,
        longitude: lng
      });

      if (response?.error === false && Array.isArray(response?.data)) {
        setProviders(response.data.map(provider => ({
          ...provider,
          position: {
            lat: parseFloat(provider.latitude),
            lng: parseFloat(provider.longitude)
          }
        })));
      } else {
        setProviders([]);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      setProviders([]);
    }
  };

  // ✅ Optimized: Simplified initialization - only fetch providers if needed
  const initializeMap = async () => {
    if (!markerPosition.lat || !markerPosition.lng) return;

    setIsFetchingLocation(true);
    onFetchingStateChange(true);

    try {
      // Always call reverseGeocode to get address when map initializes
      await reverseGeocode(markerPosition.lat, markerPosition.lng);

      // Only fetch providers if not in selection mode and providers should be shown
      if (!selectionMode && showProviders) {
        await fetchProviders(markerPosition.lat, markerPosition.lng);
      }
    } catch (error) {
      console.error("Error initializing map:", error);
    } finally {
      setIsFetchingLocation(false);
      onFetchingStateChange(false);
    }
  };

  // ✅ Optimized: Only run initialization when necessary
  useEffect(() => {
    if (isLoaded && markerPosition.lat && markerPosition.lng) {
      initializeMap();
    }
  }, [isLoaded, markerPosition.lat, markerPosition.lng, selectionMode, showProviders]);

  // ✅ Optimized: Update visible providers - show all from API
  useEffect(() => {
    if (providers.length > 0) {
      setVisibleProviders(providers);
    } else {
      setVisibleProviders([]);
    }
  }, [providers]);

  // ✅ Optimized: Debounced search with better performance
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

        if (data.error_message || data.status === "REQUEST_DENIED") {
          setApiError("Location search is temporarily unavailable");
          setPlaceSuggestions([]);
        } else {
          setPlaceSuggestions(data.predictions || []);
        }

        setActiveIndex(-1);
      } catch (error) {
        console.error("Error fetching places:", error);
        setApiError("Location search is temporarily unavailable");
        setPlaceSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(debounce);
  }, [searchInput, isSelecting]);

  // ✅ Now return statements come AFTER hooks
  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <MapLoadingSkeleton />;

  // 🔄 Optimized: Simplified handleMarkerDragEnd
  const handleMarkerDragEnd = async (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();

    setIsFetchingLocation(true);
    onFetchingStateChange(true);

    try {
      await reverseGeocode(newLat, newLng);
      if (!selectionMode && showProviders) {
        await fetchProviders(newLat, newLng);
      }
    } finally {
      setIsFetchingLocation(false);
      onFetchingStateChange(false);
    }
  };

  // 🆕 Optimized: Updated handlePlaceSelect
  const handlePlaceSelect = async (place) => {
    setIsSelecting(true);
    setIsLoading(true);
    setIsFetchingLocation(true);
    onFetchingStateChange(true);

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
        setZoom(18);

        if (map) map.panTo({ lat, lng });

        onLocationChange({
          lat,
          lng,
          address: placeDetails.formatted_address,
          city:
            placeDetails.address_components.find((c) =>
              c.types.includes("locality")
            )?.long_name || "City not found",
        });

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
      setIsFetchingLocation(false);
      onFetchingStateChange(false);
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

    if (apiError) {
      setApiError(null);
    }
  };

  // Handle provider marker click
  const handleProviderClick = (provider) => {
    const index = visibleProviders.findIndex(p => p.id === provider?.id);
    if (index !== -1) {
      setActiveSlideIndex(index);
      if (map) {
        map.panTo(provider?.position);
        map.setZoom(17);
      }
    }
  };

  // Handle slide change in Swiper - only update active index
  const handleSlideChange = (swiper) => {
    setActiveSlideIndex(swiper.activeIndex);
  };

  // Handle slider card click - focus on provider
  const handleSliderCardClick = (provider) => {
    if (map) {
      map.panTo(provider?.position);
      map.setZoom(17);
    }
  };

  return (
    <div className="relative w-full h-full">
      {selectionMode && (
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
      )}

      <GoogleMap
        className="map_box w-full xl:h-[650px] h-[500px] relative rounded-lg"
        center={markerPosition}
        zoom={zoom}
        mapContainerStyle={containerStyle}
        options={mapOptions}
        onLoad={(mapInstance) => setMap(mapInstance)}
        onClick={() => {
          if (map) {
            map.setZoom(14);
          }
        }}
      >
        {/* User location marker */}
        <MarkerF
          position={markerPosition}
          draggable={selectionMode}
          onDragEnd={handleMarkerDragEnd}
        />

        {/* Provider markers */}
        {showProviders && visibleProviders.map((provider) => (
          <MarkerF
            key={provider?.id}
            position={provider?.position}
            onClick={() => handleProviderClick(provider)}
            icon={{
              url: PROVIDER_PIN_SVG,
              scaledSize: window.google?.maps?.Size ?
                new window.google.maps.Size(
                  40,
                  40
                ) : null,
            }}
          >

          </MarkerF>
        ))}
        {!selectionMode && (
          <div className="absolute z-10 top-3 left-1/2 transform -translate-x-1/2 w-full px-4">
            <div className={`relative flex items-center gap-3 card_bg p-2 w-full border transition-all duration-300 rounded-xl
            ${providerSearch.trim() && visibleProviders.length === 0 && providers.length > 0 ? `rounded-b-none border-t-none` : `rounded-xl`}`}>
              <FaSearch />
              <input
                type="text"
                placeholder={t("searchProviders")}
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                className="ml-2 focus:outline-none w-full text-sm sm:text-base bg-transparent"
              />
            </div>

            {/* Show "no providers found" message when search has no results */}
            {providerSearch.trim() && visibleProviders.length === 0 && providers.length > 0 && (
              <div className="mt-0 p-3 card_bg border rounded-b-lg shadow-b-lg">
                <div className="flex items-center justify-center gap-2 text-center">
                  <span className="description_color text-sm font-medium">
                    {t("noProvidersFound") || "No providers found matching your search"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </GoogleMap>

      {/* Providers Display - Swiper for more than 3, Grid for 3 or fewer */}
      {showProviders && visibleProviders.length > 0 && (
        <div className="absolute bottom-3 left-0 right-0 px-4 z-10 block">
          <Swiper
            key={visibleProviders.length}
            modules={[Autoplay]}
            spaceBetween={16}
            slidesPerView={3}
            centeredSlides={true}
            loop={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            onSlideChange={handleSlideChange}
            initialSlide={activeSlideIndex}
            className="provider-swiper"
            breakpoints={{
              320: {
                slidesPerView: 1,
              },
              768: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              }
            }}
          >
            {visibleProviders.map((provider) => (
              <SwiperSlide
                key={provider?.id}
                className="cursor-pointer transition-transform"
              >
                <CustomLink href={`/provider-details/${provider?.slug}`} title={provider?.company_name}>
                  <NearbyProviderCard provider={provider} />
                </CustomLink>
              </SwiperSlide>
            ))}
          </Swiper>

        </div>
      )}
    </div>
  );
};

export default Map;

