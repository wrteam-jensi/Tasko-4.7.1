import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chatStep: 'list',
  selectedChatId: null, // Will store uniqueId: provider_id_bookingId or provider_id_pre
  selectedChat: null,
  chatType: null, // 'pre' or 'post' or 'admin'
  isAdmin: false, // Track if we're in admin chat
  lastChatId: null, // Track the last chat viewed for comparison
  unreadCounts: { pre_booking: 0, booking: 0, admin: 0 }, // Global unread user counts per tab
  isChatPageActive: false, // True when ChatPage is mounted - prevents duplicate API calls from PushNotification
};

const chatUISlice = createSlice({
  name: 'chatUI',
  initialState,
  reducers: {
    setChatStep: (state, action) => {
      state.chatStep = action.payload;
    },
    setSelectedChatId: (state, action) => {
      // Store the previous chat ID before changing
      state.lastChatId = state.selectedChatId;
      state.selectedChatId = action.payload;
      
      // Update chatType based on the unique identifier
      if (action.payload) {
        state.chatType = action.payload.includes('_pre') ? 'pre' : 'post';
      } else if (state.isAdmin) {
        state.chatType = 'admin';
      } else {
        state.chatType = null;
      }
    },
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
      
      // Update chatType based on booking_id
      if (action.payload) {
        state.chatType = action.payload.booking_id ? 'post' : 'pre';
      } else if (state.isAdmin) {
        state.chatType = 'admin';
      } else {
        state.chatType = null;
      }
    },
    setIsAdmin: (state, action) => {
      // Store the last state before changing
      state.lastChatId = state.selectedChatId;
      
      state.isAdmin = action.payload;
      
      // Update chatType based on new admin state
      if (action.payload) {
        state.chatType = 'admin';
      } else if (state.selectedChat) {
        state.chatType = state.selectedChat.booking_id ? 'post' : 'pre';
      } else {
        state.chatType = null;
      }
    },
    setChatPageActive: (state, action) => {
      state.isChatPageActive = action.payload;
    },
    setUnreadCounts: (state, action) => {
      state.unreadCounts = { ...state.unreadCounts, ...action.payload };
    },
    resetChatUI: (state) => {
      // Clear everything but preserve unread counts
      const counts = state.unreadCounts;
      state.chatStep = 'list';
      state.selectedChatId = null;
      state.selectedChat = null;
      state.chatType = null;
      state.isAdmin = false;
      state.lastChatId = null;
      state.unreadCounts = counts;
    },
  },
});

// Export actions
export const { setChatStep, setSelectedChatId, setSelectedChat, setIsAdmin, setChatPageActive, setUnreadCounts, resetChatUI } = chatUISlice.actions;

// Export selectors
export const selectChatUI = (state) => state.chatUI;
export const selectChatStep = (state) => state.chatUI.chatStep;
export const selectSelectedChatId = (state) => state.chatUI.selectedChatId;
export const selectSelectedChat = (state) => state.chatUI.selectedChat;
export const selectChatType = (state) => state.chatUI.chatType;
export const selectIsAdmin = (state) => state.chatUI.isAdmin;
export const selectLastChatId = (state) => state.chatUI.lastChatId;
export const selectUnreadCounts = (state) => state.chatUI.unreadCounts;
export const selectIsChatPageActive = (state) => state.chatUI.isChatPageActive;
export const selectTotalUnread = (state) =>
  (state.chatUI.unreadCounts?.pre_booking || 0) + (state.chatUI.unreadCounts?.booking || 0);
export const selectAdminUnread = (state) => state.chatUI.unreadCounts?.admin || 0;

export default chatUISlice.reducer; 