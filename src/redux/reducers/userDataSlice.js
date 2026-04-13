import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  data: {},
  userAuthData: {},
  fcmToken: null,
};

export const profileSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    // Action to set the user token
    setToken(state, action) {
      state.token = action.payload;
    },

    // Action to update user data
    setUserData(state, action) {
      state.data = { ...state.data, ...action.payload };
    },
    // Action to update only specific properties of user data
    updateUserData(state, action) {
      state.data = { ...state.data, ...action.payload };
    },
    setUserAuthData(state, action) {
      state.userAuthData = action.payload;
    },
    clearAuthData(state) {
      state.userAuthData = {};
    },
    // Action to clear user data (e.g., on logout)
    clearUserData(state) {
      state.token = null;
      state.data = {};
      state.fcmToken = null;
    },

    // Action to set FCM token
    setFcmToken(state, action) {
      state.fcmToken = action.payload;
    },
  },
});

// Export actions
export const {
  setToken,
  setUserData,
  clearUserData,
  setFcmToken,
  setUserAuthData,
  clearAuthData,
  updateUserData
} = profileSlice.actions;

// Export selectors
export const getUserToken = (state) => state.userData.token;
export const getUserData = (state) => state.userData.data;
export const getUserAuthData = (state) => state.userData.setUserAuthData;
export const getFcmToken = (state) => state.userData.fcmToken;

// Export reducer
export default profileSlice.reducer;
