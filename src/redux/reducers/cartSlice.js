import { createSlice } from "@reduxjs/toolkit";

// Initial state
const initialState = {
  items: [], // Stores cart items
  itemsTotalPrice: 0, // Total price of the items
  totalItems: 0, // Number of unique items in the cart
  currentProvider: {
    provider_id: "",
    provider_name: "",
    provider_image: "",
    visiting_charges: 0,
    at_doorstep: "1",
    at_store: "1",
    is_pay_later_allowed: "0",
    is_online_payment_allowed: "0",
    sub_total: 0,
    overall_amount: 0,
  },
  promocode_discount: 0, // New field for promocode discount,
  // for checkout details
  dilveryDetails: {
    dilveryAddressType: "",
    dilevryLocation: {},
    dilveryDate: "",
    dilveryTime: "",
    dilveryTimeMessage: "", // Add field for time slot message
    dilveryNote: "",
    dilevryPymentMethod: "",
    isReOrder: false,
    reOrderId: "",
    customJobId: "",
    customJobBidId: "",
  },
  // Add custom job fields
  customJobData: {
    bidId: null,
    providerId: null,
    counterPrice: 0,
    jobId: null,
  },
  appliedCoupon: null, // Add this new field to store the coupon details,
  tax_value: 0,
};

// Redux Slice
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Set cart data (items and provider)
    setCartData: (state, action) => {
      // If a custom job checkout is in progress, skip overwriting cart state
      // Custom job data (customJobData + currentProvider) was set by setCustomJobData
      // and must not be replaced by regular cart API responses
      if (state.customJobData?.custom_job_request_id) {
        return;
      }

      const { provider, items } = action.payload;

      // Check if provider_id is different, reset promocode_discount and appliedCoupon if so
      if (state.currentProvider?.provider_id !== provider?.provider_id) {
        state.promocode_discount = 0;
        state.appliedCoupon = null; // Reset the applied coupon as well
        state.dilveryDetails = initialState.dilveryDetails;
      }
      state.currentProvider = provider
        ? { ...provider }
        : { ...initialState.currentProvider };
      state.items = items || [];
      state.totalItems = items?.length || 0;

      // Recalculate total price excluding visiting charges if delivery address exists
      const basePrice = state.items.reduce((total, item) => {
        const price =
          item.discounted_price > 0
            ? item.price_with_tax
            : item.original_price_with_tax;
        return total + price * item.qty;
      }, 0);

      state.itemsTotalPrice = basePrice;

      state.currentProvider.overall_amount =
        basePrice - state.promocode_discount;

      state.customJobData = initialState.customJobData;
    },
    setPromocodeDiscount: (state, action) => {
      state.promocode_discount = action.payload;

      // Calculate the new overall amount and store it in currentProvider
      state.currentProvider.overall_amount =
        state.itemsTotalPrice - state.promocode_discount;
    },
    setDilveryDetails: (state, action) => {
      state.dilveryDetails = {
        ...state.dilveryDetails,
        ...action.payload,
      };
      const basePrice = state.itemsTotalPrice;

      // Calculate final amount including visiting charges if applicable
      const visitingCharges =
        action.payload.dilveryAddressType === "home"
          ? Number(state.currentProvider.visiting_charges || 0)
          : 0;

      // Update overall amount with all components
      state.currentProvider.overall_amount =
        basePrice + visitingCharges - state.promocode_discount;
    },

    // Remove item from the cart
    removeFromCart: (state, action) => {
      const itemId = action.payload; // ID of the item to remove
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === itemId
      );

      if (existingItemIndex !== -1) {
        const item = state.items[existingItemIndex];
        if (item.qty > 1) {
          // Reduce quantity if greater than 1
          item.qty -= 1;
        } else {
          // Remove the item if its quantity is 1
          state.items = state.items.filter((item) => item.id !== itemId);
        }
      }

      // If the cart becomes empty, reset the provider ID
      if (state.items.length === 0) {
        state.currentProvider = initialState.currentProvider;
      }

      // Update totalItems count
      state.totalItems = state.items.length;

      // Recalculate total price including items' price only
      state.itemsTotalPrice = state.items.reduce((total, item) => {
        const price =
          item.discounted_price > 0
            ? item.price_with_tax
            : item.original_price_with_tax;
        return total + price * item.qty;
      }, 0);

      // Update sub_total and overall_amount to reflect the new totals
      if (state.items.length > 0) {
        state.currentProvider.sub_total = state.itemsTotalPrice;
        state.currentProvider.overall_amount =
          state.itemsTotalPrice - state.promocode_discount;
      }
    },

    // Remove item from the cart
    removeItemFromCart: (state, action) => {
      const itemId = action.payload; // ID of the item to remove
      // Remove the item directly by filtering it out
      state.items = state.items.filter((item) => item.id !== itemId);

      // Explicitly update totalItems count
      state.totalItems = state.items.length;

      // If the cart becomes empty, reset all relevant states
      if (state.items.length === 0) {
        Object.assign(state, {
          items: [],
          totalItems: 0,
          itemsTotalPrice: 0,
          promocode_discount: 0,
          currentProvider: { ...initialState.currentProvider },
          dilveryDetails: { ...initialState.dilveryDetails },
          customJobData: { ...initialState.customJobData },
        });
      } else {
        // Recalculate total price after removing the item
        state.itemsTotalPrice = state.items.reduce((total, item) => {
          const price =
            item.discounted_price > 0
              ? item.price_with_tax
              : item.original_price_with_tax;
          return total + price * item.qty;
        }, 0);

        // Update sub_total to match the recalculated itemsTotalPrice
        state.currentProvider.sub_total = state.itemsTotalPrice;

        // Update overall amount after recalculating total price
        state.currentProvider.overall_amount =
          state.itemsTotalPrice - state.promocode_discount;
      }
    },

    // Clear the entire cart
    clearCart: (state) => {
      state.items = []; // Empty the items array
      state.totalItems = 0; // Reset the total items count
      state.itemsTotalPrice = 0; // Reset the total price
      state.currentProvider = initialState.currentProvider; // Reset provider info
      state.promocode_discount = 0;
      state.customJobData = initialState.customJobData;
      state.appliedCoupon = null;
    },
    clearCheckoutData: (state) => {
      state.dilveryDetails = initialState.dilveryDetails;
      state.customJobData = initialState.customJobData;
    },
    // Add new reducer for custom job
    setCustomJobData: (state, action) => {
      state.customJobData = action.payload;

      // Set the provider and amount details for custom job
      state.currentProvider = {
        provider_id: action.payload.providerId,
        provider_name: action.payload.providerDetails?.name,
        provider_image: action.payload.providerDetails?.image,
        visiting_charges: Number(
          action.payload.providerDetails?.visiting_charges || 0
        ),
        at_doorstep: action.payload.at_doorstep,
        at_store: action.payload.at_store,
        is_pay_later_allowed: action.payload.is_pay_later_allowed,
        is_online_payment_allowed: action.payload.is_online_payment_allowed,
        advance_booking_days: action.payload.advance_booking_days,
        // Set base amounts
        sub_total: Number(action.payload.counterPrice),
        sub_total_without_tax: Number(action.payload.counterPrice),
        overall_amount: Number(action.payload.counterPrice), // Initialize with counter price
      };

      // Clear regular cart items since this is a custom job
      state.items = [];
      state.itemsTotalPrice = Number(action.payload.counterPrice);

      // Reset promocode discount when switching providers
      state.promocode_discount = 0;

      // Calculate initial overall amount (will be updated by setDilveryDetails if needed)
      state.currentProvider.overall_amount = Number(
        action.payload.counterPrice
      );
    },
    clearCustomJobData: (state) => {
      state.customJobData = initialState.customJobData;
    },
    setAppliedCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
    },
    setTaxValue: (state, action) => {
      state.tax_value = action.payload;
    },
  },
});

// Export actions
export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  removeItemFromCart,
  clearCart,
  setCartData,
  setPromocodeDiscount,
  setDilveryDetails,
  clearCheckoutData,
  setCustomJobData,
  clearCustomJobData,
  setAppliedCoupon,
  setTaxValue,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart?.items || [];
export const selectCartProvider = (state) => state.cart?.currentProvider || {};
export const selectTotalItems = (state) => state.cart?.totalItems || 0;
export const selectCartTotalPrice = (state) => state.cart?.itemsTotalPrice || 0;
export const selectDeliveryDetails = (state) =>
  state.cart?.dilveryDetails || {};
export const selectPromoDiscount = (state) =>
  state.cart?.promocode_discount || 0;
export const selectCustomJobData = (state) => state.cart.customJobData;
export const selectAppliedCoupon = (state) => state.cart.appliedCoupon;
export const selectTaxValue = (state) => state.cart.tax_value;
// Export the reducer
export default cartSlice.reducer;
