import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isReOrder: false,
  orderId: null,
  provider: null,
  items: [],
};

const reorderSlice = createSlice({
  name: "reorder",
  initialState,
  reducers: {
    setReorderMode: (state, action) => {
      const { isReOrder, orderId, provider, items } = action.payload;
      state.isReOrder = isReOrder;
      state.orderId = orderId;
      state.provider = provider;
      state.items = items;
      // Only modify overall_amount if delivery type is "store"
      if (isReOrder && provider?.dilveryAddressType === "store") {
        state.provider.overall_amount =
          Number(provider?.overall_amount) -
          Number(provider?.visiting_charges || 0); // Remove visiting charges
      }
      if (provider?.dilveryAddressType === "home") {
        state.provider.overall_amount =
          Number(provider?.sub_total) + Number(provider?.visiting_charges);
      }
    },
    clearReorder: (state) => {
      return initialState;
    },
  },
});

export const { setReorderMode, clearReorder } = reorderSlice.actions;

// Selectors
export const selectReorderMode = (state) => state.reorder.isReOrder;
export const selectReorderId = (state) => state.reorder.orderId;

export default reorderSlice.reducer;
