"use client";

/**
 * Notification Redirect Utility
 * 
 * This utility function maps notification types to their respective redirect URLs.
 * It handles all customer notification types and de[termines the appropriate route
 * based on the notification data structure.
 * 
 * Notification types that require redirects:
 * - Booking-related notifications -> /booking/[booking_id]
 * - Job request notifications -> /my-service-request-details/[job_id]
 * - Blog notifications -> /blog-details/[blog_slug]
 * - Provider notifications -> /provider-details/[provider_slug]
 * - Service details -> /provider-details/[provider_slug]/[service_slug]
 * - Category notifications -> /service/[category_slug] or /service/[parent1]/[parent2]/...[category_slug]
 * - Chat notifications -> /chats
 * - Privacy Policy -> /privacy-policy
 * - Terms and Conditions -> /terms-and-conditions
 * 
 * NOTE: The `click_action` field (e.g., "FLUTTER_NOTIFICATION_CLICK") is Flutter-specific
 * and is IGNORED on web. Web notifications use the service worker's 'notificationclick' 
 * event handler instead. You don't need to ask backend to change this - it works fine on web.
 */

/**
 * Get redirect URL based on notification type and data
 * @param {Object} notificationData - The notification payload data
 * @returns {string|null} - The redirect URL or null if no redirect needed
 */
export const getNotificationRedirectUrl = (notificationData) => {
  // Return null if no notification data provided
  if (!notificationData) {
    return null;
  }

  // Get notification type from data
  // Firebase notifications typically have type in data.type or data.notification_type
  // Also check web_click_type and redirect_type (backend may send these)
  const notificationType = notificationData.type || 
                           notificationData.notification_type || 
                           notificationData.notificationType ||
                           notificationData.web_click_type ||
                           notificationData.redirect_type;

  // If no type specified, return null (no redirect)
  if (!notificationType) {
    return null;
  }

  // Convert type to lowercase for case-insensitive matching
  const type = notificationType.toLowerCase().trim();
  
  // Also get redirect_type/web_click_type for fallback matching
  const redirectType = (notificationData.redirect_type || notificationData.web_click_type || "").toLowerCase().trim();

  // Booking-related notifications - redirect to booking details
  // These all redirect to the same booking details page
  const bookingRelatedTypes = [
    'booking_status',
    'booking status',
    'booking_confirmed',
    'booking_rescheduled',
    'booking_cancelled',
    'booking_completed',
    'booking_started',
    'booking_ended',
    'added_additional_charges',
    'added additional charges',
    'online_payment_failed',
    'online payment failed',
    'online_payment_success',
    'online payment success',
    'online_payment_pending',
    'online payment pending',
    'review_request_after_booking_completion',
    'review the request after booking completion',
    'payment_refund_executed',
    'payment refund executed',
    'payment_refund_successful',
    'payment refund successful',
  ];

  if (bookingRelatedTypes.includes(type)) {
    // Get booking ID from notification data
    // Check multiple possible field names
    const bookingId = notificationData.booking_id || 
                      notificationData.bookingId || 
                      notificationData.order_id || 
                      notificationData.orderId ||
                      notificationData.id;

    if (bookingId) {
      return `/booking/inv-${bookingId}`;
    }
    // If no booking ID, return null (can't redirect without ID)
    return null;
  }

  // Job request notification - redirect to job details
  if (type === 'bid_on_custom_job_request' || type === 'bid on a custom job request') {
    // Get job ID from notification data
    const jobId = notificationData.custom_job_request_id
    
    if (jobId) {
      return `/my-service-request-details/${jobId}`;
    }
    // If no job ID, return null (can't redirect without ID)
    return null;
  }

  // Blog notification - redirect to blog details
  if (type === 'new_blog' || type === 'new blog') {
    // Get blog slug from notification data
    const blogSlug = notificationData.blog_slug || 
                     notificationData.blogSlug || 
                     notificationData.slug ||
                     notificationData.blog_id ||
                     notificationData.blogId ||
                     notificationData.id;

    if (blogSlug) {
      return `/blog-details/${blogSlug}`;
    }
    return null;
  }

  // Privacy Policy notification - redirect to privacy policy page
  if (type === 'privacy_policy_changed' || type === 'privacy policy changed') {
    return '/privacy-policy';
  }

  // Terms and Conditions notification - redirect to terms and conditions page
  if (type === 'terms_and_conditions_changed' || 
      type === 'terms and conditions changed' ||
      type === 'terms_and_conditions' ||
      type === 'terms and conditions') {
    return '/terms-and-conditions';
  }

  // Notifications that don't require redirects (marked with ✅ in requirements):
  // - User Account Activated
  // - User Account Deactivated
  // - Report
  // - Block
  // - Maintenance Mode
  // These return null (no redirect needed)

  // Service details notification - redirect to provider-details/provider-slug/service-slug
  // This handles notifications for specific services from a provider
  if (type === 'service' || type === 'service_details' || type === 'service details') {
    const providerSlug = notificationData.provider_slug || 
                         notificationData.providerSlug ||
                         notificationData.provider_id ||
                         notificationData.providerId;
    
    const serviceSlug = notificationData.service_slug || 
                        notificationData.serviceSlug ||
                        notificationData.slug ||
                        notificationData.service_id ||
                        notificationData.serviceId;

    if (providerSlug && serviceSlug) {
      return `/provider-details/${providerSlug}/${serviceSlug}`;
    }
    return null;
  }

  // Provider notification - redirect to provider-details/provider-slug
  // Priority: provider_slug (for URL) > providerSlug > slug > provider_id (fallback, but not ideal for URL)
  // Also check redirect_type/web_click_type for "provider-details"
  if (type === 'provider' || redirectType === 'provider-details') {
    // Prefer slug over ID since we need slug for the URL route
    const providerSlug = notificationData.provider_slug || 
                         notificationData.providerSlug ||
                         notificationData.slug ||
                         // Fallback to ID only if slug is not available (will need conversion)
                         notificationData.provider_id ||
                         notificationData.providerId ||
                         notificationData.id;

    if (providerSlug) {
      return `/provider-details/${providerSlug}`;
    }
    return null;
  }

  // Category notification - redirect to service/parent1/parent2/.../categoryslug
  // Example: parent_category_slugs: ["home", "cleaning"], category_slug: "kitchen"
  // Result: /service/home/cleaning/kitchen
  // Supports nested categories with n number of parent categories
  if (type === 'category' || redirectType === 'category') {
    let categoryRoute = '/service';
    
    // Try multiple field name variations for parent slugs
    // Can be array of slugs: ['parent1', 'parent2', 'subcategory']
    let parentSlugs = notificationData.parent_category_slugs || 
                     notificationData.parentCategorySlugs ||
                     notificationData.parent_slugs ||
                     notificationData.parent_categories || // Alternative field name
                     [];
    
    // If parentSlugs is a string, try to parse it as JSON array
    if (typeof parentSlugs === "string") {
      try {
        parentSlugs = JSON.parse(parentSlugs);
      } catch (e) {
        // If not JSON, treat as comma-separated string
        parentSlugs = parentSlugs.split(",").map(p => p.trim()).filter(p => p);
      }
    }
    
    // Ensure parentSlugs is an array
    if (!Array.isArray(parentSlugs)) {
      parentSlugs = [];
    }
    
    // Get the final category slug
    const categorySlug = notificationData.category_slug || 
                         notificationData.categorySlug ||
                         notificationData.slug ||
                         notificationData.category_id ||
                         notificationData.categoryId;

    // Build route: /service/parent1/parent2/.../categoryslug
    // If parent slugs exist, join them with '/'
    if (parentSlugs && Array.isArray(parentSlugs) && parentSlugs.length > 0) {
      // Filter out empty values, convert to strings, and join
      const validParentSlugs = parentSlugs
        .map(slug => String(slug).trim())
        .filter(slug => slug && slug.length > 0);
      
      if (validParentSlugs.length > 0) {
        categoryRoute += `/${validParentSlugs.join('/')}`;
      }
      
      // Add final category slug if provided
      if (categorySlug) {
        const cleanSlug = String(categorySlug).trim();
        if (cleanSlug) {
          categoryRoute += `/${cleanSlug}`;
        }
      }
    } else if (categorySlug) {
      // No parent categories, just the category slug
      const cleanSlug = String(categorySlug).trim();
      if (cleanSlug) {
        categoryRoute += `/${cleanSlug}`;
      }
    } else {
      // No category slug found
      return null;
    }

    return categoryRoute;
  }

  // Chat notification - redirect to /chats
  if (type === 'chat' || type === 'message' || type === 'new_message' || type === 'new message') {
    return '/chats';
  }

  // Direct URL redirect
  if (type === 'url' && notificationData.url) {
    return notificationData.url;
  }

  // Default: no redirect
  return null;
};

/**
 * Check if a notification type requires a redirect
 * @param {Object} notificationData - The notification payload data
 * @returns {boolean} - True if redirect is needed, false otherwise
 */
export const isNotificationRedirectable = (notificationData) => {
  const redirectUrl = getNotificationRedirectUrl(notificationData);
  return redirectUrl !== null;
};

/**
 * Debug helper function to test notification redirects
 * Exposes a global function in development mode for easy testing
 * Usage in browser console: window.testNotificationRedirect({ type: 'new_blog', blog_slug: 'test-slug' })
 * 
 * @param {Object} notificationData - The notification payload to test
 * @returns {Object} - Debug information about the redirect
 */
export const debugNotificationRedirect = (notificationData) => {
  if (process.env.NODE_ENV !== "production") {
    
    const redirectUrl = getNotificationRedirectUrl(notificationData);
    const isRedirectable = isNotificationRedirectable(notificationData);

    
    return {
      redirectUrl,
      isRedirectable,
      willRedirect: redirectUrl !== null,
    };
  }
  
  return {
    redirectUrl: getNotificationRedirectUrl(notificationData),
    isRedirectable: isNotificationRedirectable(notificationData),
    willRedirect: getNotificationRedirectUrl(notificationData) !== null,
  };
};

// Expose debug helper globally (always available for debugging)
// This runs immediately when the module is loaded
(function exposeNotificationHelpers() {
  if (typeof window === "undefined") {
    return; // Not in browser environment
  }

  // Only attach once to avoid duplicate assignments
  if (window.__notificationRedirectHelpersAttached) {
    return; // Already attached
  }

  // Main functions with correct casing
  window.testNotificationRedirect = debugNotificationRedirect;
  window.getNotificationRedirectUrl = getNotificationRedirectUrl;
  window.isNotificationRedirectable = isNotificationRedirectable;
  
  // Add case-insensitive aliases for convenience
  window.testNotificationredirect = debugNotificationRedirect; // lowercase 'r'
  window.testnotificationredirect = debugNotificationRedirect; // all lowercase
  
  // Helper to show available functions
  window.__showNotificationHelpers = () => {
  };
  
  window.__notificationRedirectHelpersAttached = true;
  
})();

