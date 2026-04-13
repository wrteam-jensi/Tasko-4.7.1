"use client"
import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
  settings: [],
  fcmToken: "",
};

export const settingSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setSettings: (state, action) => {
      state.settings = action.payload;
    },
    setFcmToken: (state, action) => {
      state.fcmToken = action.payload.data;
    },
  },
});

export const { setSettings, setFcmToken } = settingSlice.actions;

export default settingSlice.reducer;

// load fcmToken - this should be called with dispatch from components
export const setFcmTokenData = (data) => {
  return setFcmToken({ data });
}

export const getFcmToken = createSelector(
  (state) => state?.Settings?.fcmToken,
  (fcmToken) => fcmToken
);
