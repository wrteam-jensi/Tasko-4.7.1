// locationSlice.js
import { createSlice, createSelector } from "@reduxjs/toolkit";

export const locationSlice = createSlice({
  name: "locationData",
  initialState: {
    lat: null,
    lng: null,
    locationAddress: null,
    IsBrowserSupported: false, // Ensure this matches
    isUpdatingLocation: false, // Add flag for background updates
  },
  reducers: {
    setLatitude: (state, action) => {
      state.lat = action.payload;
    },
    setLongitude: (state, action) => {
      state.lng = action.payload;
    },
    locationAddressData: (state, action) => {
      state.locationAddress = action.payload;
    },
    setIsBrowserSupported: (state, action) => {
      state.IsBrowserSupported = action.payload;
    },
    setIsUpdatingLocation: (state, action) => {
      state.isUpdatingLocation = action.payload;
    },
    clearLocationData: (state) => {
      state.lat = "";
      state.lng = "";
      state.locationAddress = "";
      state.isUpdatingLocation = false;
    },
  },
});

export const { setLatitude, setLongitude, locationAddressData, setIsBrowserSupported, setIsUpdatingLocation, clearLocationData } = locationSlice.actions;

export default locationSlice.reducer;

export const getIsBrowserSupported = createSelector(
  (state) => state.location,
  (location) => location?.IsBrowserSupported // Optional chaining
);
