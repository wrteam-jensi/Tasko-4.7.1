"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useGoogleMapsLoader } from "@/utils/Helper";

import { useDispatch, useSelector } from "react-redux";
import { MdClose, MdLocationOn } from "react-icons/md";
import Map from "./LocationMapBox/GoogleMap.jsx";
import {
  locationAddressData,
  setLatitude,
  setLongitude,
  setIsUpdatingLocation,
} from "@/redux/reducers/locationSlice";
import { toast } from "sonner";
import { providerAvailableApi } from "@/api/apiRoutes";
import { useTranslation } from "../Layout/TranslationContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/router";

const LocationModal = ({
  open,
  onClose,
  initialLocation = null,
  redirectToHome = false, // ✅ New prop for redirect behavior
  onLocationConfirmed = null, // ✅ New prop for custom callback
  forceChooseAddressOnOpen = false,
}) => {
  const t = useTranslation();
  const router = useRouter();
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const locationData = useSelector((state) => state.location);
  const dispatch = useDispatch();


  // Add state for selection mode and loading states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);



  // ✅ Fixed: Add local state for current address
  const [currentAddress, setCurrentAddress] = useState({
    lat: initialLocation?.lat || locationData?.lat || "",
    lng: initialLocation?.lng || locationData?.lng || "",
    address: initialLocation?.address || locationData?.locationAddress || "",
  });

  // ✅ Fixed: Memoize fullAddress to prevent unnecessary re-renders
  const fullAddress = useMemo(() => ({
    lat: currentAddress.lat || locationData?.lat || "",
    lng: currentAddress.lng || locationData?.lng || "",
    address: currentAddress.address || locationData?.locationAddress || "",
  }), [currentAddress.lat, currentAddress.lng, currentAddress.address, locationData?.lat, locationData?.lng, locationData?.locationAddress]);

  // ✅ New: Store current location to Redux when providers are fetched
  const onProvidersFetched = useCallback((location) => {
    if (location?.lat && location?.lng && location?.address) {
      dispatch(setLatitude(location.lat));
      dispatch(setLongitude(location.lng));
      dispatch(locationAddressData(location.address));
    }
  }, [dispatch]);

  // ✅ New: Auto-set location to Redux when on landing page
  const onLocationChange = useCallback(async (newAddresses) => {
    setCurrentAddress({
      lat: newAddresses?.lat,
      lng: newAddresses?.lng,
      address: newAddresses?.address,
    });

    // ✅ Auto-set to Redux if on landing page (redirectToHome is true)
    if (redirectToHome && newAddresses?.lat && newAddresses?.lng && newAddresses?.address) {
      dispatch(setLatitude(newAddresses.lat));
      dispatch(setLongitude(newAddresses.lng));
      dispatch(locationAddressData(newAddresses.address));
    }
  }, [dispatch, redirectToHome]);

  // ✅ Check if location has actually changed
  const hasLocationChanged = useMemo(() => {
    const currentLat = currentAddress.lat || locationData?.lat;
    const currentLng = currentAddress.lng || locationData?.lng;
    const currentAddressText = currentAddress.address || locationData?.locationAddress;

    const originalLat = initialLocation?.lat || locationData?.lat;
    const originalLng = initialLocation?.lng || locationData?.lng;
    const originalAddressText = initialLocation?.address || locationData?.locationAddress;
    
    // ✅ If we have a valid current location, allow confirmation (for landing page flow)
    if (currentLat && currentLng && currentAddressText) {
      return true;
    }

    const changed = (
      currentLat !== originalLat ||
      currentLng !== originalLng ||
      currentAddressText !== originalAddressText
    );

    return changed;
  }, [currentAddress, locationData, initialLocation]);

  // ✅ Optimized: Memoize handleConfirmLocation with redirect logic
  const handleConfirmLocation = useCallback(async () => {
    if (fullAddress.lat && fullAddress.lng && fullAddress.address) {
      setIsConfirming(true);
      try {
        const response = await providerAvailableApi({
          latitude: fullAddress?.lat,
          longitude: fullAddress?.lng,
        });

        if (response?.error === false) {

          // Update Redux state synchronously
          dispatch(setLatitude(fullAddress.lat));
          dispatch(setLongitude(fullAddress.lng));
          dispatch(locationAddressData(fullAddress.address));

          // ✅ New: Call custom callback if provided
          if (onLocationConfirmed) {
            onLocationConfirmed(fullAddress);
          }

          // Reset confirming state before closing/redirecting
          setIsConfirming(false);

          // ✅ NEW LOGIC: If location changed, close modal directly
          if (hasLocationChanged) {
            // Close modal directly after successful location update
            onClose();
          } else {
            // If same location, just switch back to provider view
            setIsSelectionMode(false);
          }

          // ✅ Handle redirect based on props (only if location changed)
          if (redirectToHome && hasLocationChanged) {
            setTimeout(() => {
              router.push("/");
            }, 100);
          }

        } else {
          toast.error(response?.message);
          setIsConfirming(false);
        }
      } catch (error) {
        toast.error(t("errorConfirmingLocation"));
        setIsConfirming(false);
      }
    } else {
      toast.error(t("pleaseSelectValidLocation"));
    }
  }, [fullAddress.lat, fullAddress.lng, fullAddress.address, dispatch, t, redirectToHome, router, onLocationConfirmed, hasLocationChanged, onClose]);

  // ✅ Optimized: Memoize handleDialogClose
  const handleDialogClose = useCallback(() => {
    if (isConfirming || locationData.isUpdatingLocation) {
      return; // Don't allow closing during confirmation or background update
    }
    onClose();
  }, [isConfirming, locationData.isUpdatingLocation, onClose]);

  // ✅ Optimized: Memoize toggleSelectionMode
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode);
  }, [isSelectionMode]);

  // ✅ Optimized: Memoize loading state component
  const AddressLoadingState = useMemo(() => (
    <div className="flex items-center gap-2">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-6 w-48" />
      </div>
    </div>
  ), []);

  // ✅ Optimized: Memoize map props with new callback
  const mapProps = useMemo(() => ({
    isClicked: isSelectionMode,
    latitude: fullAddress.lat || locationData.lat,
    longitude: fullAddress.lng || locationData.lng,
    isLoaded,
    loadError,
    onLocationChange,
    onProvidersFetched, // ✅ New: Pass callback to store location
    showProviders: !isSelectionMode,
    selectionMode: isSelectionMode,
    onFetchingStateChange: setIsFetchingLocation,
  }), [
    isSelectionMode,
    fullAddress.lat,
    fullAddress.lng,
    locationData.lat,
    locationData.lng,
    isLoaded,
    loadError,
    onLocationChange,
    onProvidersFetched
  ]);

  // ✅ Added: Update currentAddress when initialLocation changes
  useEffect(() => {
    if (initialLocation) {
      setCurrentAddress({
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        address: initialLocation.address,
      });
    }
  }, [initialLocation]);

  // ✅ Added: Auto-enter selection mode when forceChooseAddressOnOpen is true
  useEffect(() => {
    if (open && forceChooseAddressOnOpen) {
      setIsSelectionMode(true);
    }
  }, [open, forceChooseAddressOnOpen]);

  // ✅ Reset isUpdatingLocation flag when modal opens to prevent stuck state
  useEffect(() => {
    if (open && locationData.isUpdatingLocation) {
      dispatch(setIsUpdatingLocation(false));
    }
  }, [open, locationData.isUpdatingLocation, dispatch]);

  // Debug: Log button disabled conditions
  useEffect(() => {
  }, [isFetchingLocation, isConfirming, locationData.isUpdatingLocation, hasLocationChanged]);

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-5xl p-4 md:p-6 card_bg rounded-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            {isSelectionMode ? t("selectAddress") : t("map")}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              className=""
              disabled={isConfirming || locationData.isUpdatingLocation}
            >
              <MdClose size={20} />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="rounded-lg mb-6 h-[400px] lg:h-[550px] background_color overflow-hidden">
          <Map {...mapProps} />
        </div>

        <div className="flex items-center mb-6 gap-2 w-full">
          {isFetchingLocation ? (
            AddressLoadingState
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 w-full">
                <div className="p-2 w-[48px] h-[48px] flex items-center justify-center light_bg_color rounded-[12px]">
                  <MdLocationOn size={24} className="primary_text_color" />
                </div>
                <div className="flex-1">
                  <p className="text-sm description_color">{t("currentLocation")}</p>
                  <p className="font-semibold text-lg">
                    {isFetchingLocation
                      ? t("fetchingLocation")
                      : fullAddress?.address || t("noLocationSelected")}
                  </p>
                </div>
              </div>
              {!isSelectionMode && !isFetchingLocation && !isConfirming && !locationData.isUpdatingLocation && (
                <div className="flex gap-2 w-full md:w-fit">
                  <button
                    onClick={toggleSelectionMode}
                    className="border border-color-black hover:bg-[#212121] rounded-lg hover:text-white px-8 py-3 transition-all duration-300 w-full md:w-fit"
                  >
                    {t("change")}
                  </button>
                  {redirectToHome && fullAddress?.lat && fullAddress?.lng && fullAddress?.address && (
                    <button
                      onClick={handleConfirmLocation}
                      disabled={isConfirming || locationData.isUpdatingLocation}
                      className="primary_bg_color text-white hover:opacity-90 rounded-lg px-8 py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConfirming ? t("confirmingLocation") : t("confirm")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {isSelectionMode && (
          <div className="flex flex-row items-center justify-between gap-2 w-full">
            <Button
              onClick={() => setIsSelectionMode(false)}
              className="w-full border border-black dark:!border-white bg-transparent text-black dark:!text-white py-3 rounded-md transition-all text-lg font-semibold disabled:opacity-50 hover:bg-transparent"
              disabled={isConfirming || locationData.isUpdatingLocation}
            >
              {t("back")}
            </Button>
            <Button
              onClick={handleConfirmLocation}
              disabled={isFetchingLocation || isConfirming || locationData.isUpdatingLocation || !hasLocationChanged}
              className="w-full primary_bg_color text-white py-3 rounded-md transition-all text-lg font-semibold disabled:opacity-50"
            >
              {isConfirming
                ? t("confirmingLocation")
                : redirectToHome ? t("confirmAndGoHome") : t("confirmAddress")
              }
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
