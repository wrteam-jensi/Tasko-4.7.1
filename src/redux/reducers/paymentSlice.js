import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  paymentInProgress: false,
  currentPayment: null
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    trackPaymentStart: (state, action) => {
      state.paymentInProgress = true;
      state.currentPayment = action.payload;
    },
    
    trackPaymentComplete: (state) => {
      state.paymentInProgress = false;
      state.currentPayment = null;
    }
  }
});

export const { trackPaymentStart, trackPaymentComplete } = paymentSlice.actions;

export const selectPaymentInProgress = (state) => state.payment.paymentInProgress;
export const selectCurrentPayment = (state) => state.payment.currentPayment;

export default paymentSlice.reducer; 