/**
 * Microsoft Clarity event name catalog for the web app.
 *
 * We mirror the taxonomy that already exists in the Customer App so that
 * product analytics dashboards stay unified across platforms.  Group the
 * names by logical areas to keep imports small and developer auto-complete
 * helpful.
 *
 * ⚠️  IMPORTANT:
 * - Keep the raw string values in sync with the values used inside the mobile app.
 * - Avoid renaming keys in these objects without coordinating with analytics.
 * - Export plain objects so developers can destructure or reference the names.
 */

export const APP_LIFECYCLE_EVENTS = Object.freeze({
  APP_LAUNCH: "app_launch",
  APP_RESUME: "app_resume",
  APP_BACKGROUND: "app_background",
});

export const AUTH_EVENTS = Object.freeze({
  OTP_SENT: "otp_sent",
  OTP_VERIFIED: "otp_verified",
  LOGIN_ATTEMPT: "login_attempt",
  LOGIN_SUCCESS: "login_success",
  LOGOUT: "logout",
  PROFILE_UPDATE_SAVED: "profile_update_saved",
  ADDRESS_ADDED: "address_added",
  ADDRESS_DELETED: "address_deleted",
  DELETE_ACCOUNT_CONFIRMED: "delete_account_confirmed",
  LANGUAGE_CHANGED: "language_changed",
  THEME_CHANGED: "theme_changed",
});

export const HOME_EVENTS = Object.freeze({
  HOME_BANNER_TAPPED: "home_banner_tapped",
  HOME_CATEGORY_SHORTCUT_TAPPED: "home_category_shortcut_tapped",
  HOME_POPULAR_SERVICE_TAPPED: "home_popular_service_tapped",
  SEARCH_SCREEN_OPENED: "search_screen_opened",
  SERVICE_SEARCH_SUBMITTED: "service_search_submitted",
});

export const SERVICE_EVENTS = Object.freeze({
  SERVICE_DETAIL_VIEWED: "service_detail_viewed",
  SERVICE_REVIEW_SUBMITTED: "service_review_submitted",
});

export const CART_EVENTS = Object.freeze({
  CART_VIEWED: "cart_viewed",
  CART_ITEM_ADDED: "cart_item_added",
  CART_ITEM_REMOVED: "cart_item_removed",
  CART_CLEARED: "cart_cleared",
  CART_CHECKOUT_TAPPED: "cart_checkout_tapped",
});

export const BOOKING_EVENTS = Object.freeze({
  TIMESLOT_PICKER_OPENED: "timeslot_picker_opened",
  TIMESLOT_SLOT_SELECTED: "timeslot_slot_selected",
  TIMESLOT_CUSTOM_TIME_ENTERED: "timeslot_custom_time_entered",
  TIMESLOT_VALIDATION_FAILED: "timeslot_validation_failed",
  BOOKING_REQUESTED: "booking_requested",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_COMPLETED: "booking_completed",
  BOOKING_RESCHEDULED: "booking_rescheduled",
  BOOKING_ADDITIONAL_CHARGE_APPROVED: "booking_additional_charge_approved",
});

export const PAYMENT_EVENTS = Object.freeze({
  PROMO_CODE_APPLIED: "promo_code_applied",
  PROMO_CODE_FAILED: "promo_code_failed",
  PAYMENT_METHOD_SELECTED: "payment_method_selected",
  PAYMENT_STARTED: "payment_started",
  PAYMENT_GATEWAY_REDIRECTED: "payment_gateway_redirected",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",
});

export const SUPPORT_EVENTS = Object.freeze({
  CUSTOM_JOB_REQUEST_CREATED: "custom_job_request_created",
  CUSTOM_JOB_REQUEST_CANCELLED: "custom_job_request_cancelled",
  CHAT_MESSAGE_SENT: "chat_message_sent",
  SUPPORT_TICKET_CREATED: "support_ticket_created",
});

export const MISC_EVENTS = Object.freeze({
  MAINTENANCE_MODE_VIEWED: "maintenance_mode_viewed",
  NOTIFICATION_OPENED: "notification_opened",
});

/**
 * A flatten copy helps in scenarios where we only need the event names without
 * importing every group individually (e.g. displaying a list).
 */
export const ALL_CLARITY_EVENTS = Object.freeze({
  ...APP_LIFECYCLE_EVENTS,
  ...AUTH_EVENTS,
  ...HOME_EVENTS,
  ...SERVICE_EVENTS,
  ...CART_EVENTS,
  ...BOOKING_EVENTS,
  ...PAYMENT_EVENTS,
  ...SUPPORT_EVENTS,
  ...MISC_EVENTS,
});


