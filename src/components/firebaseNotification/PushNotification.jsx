'use client'
import React, { useEffect, useState, useRef } from 'react'
import 'firebase/messaging'
import { useSelector, useDispatch } from 'react-redux'
import FirebaseData from '../../utils/Firebase'
import { toast } from 'sonner'
import { useRouter } from 'next/router'
import { getNotificationRedirectUrl } from '@/utils/notificationRedirect'
import { setFcmToken } from '@/redux/reducers/userDataSlice'
import { store } from '@/redux/store'
import { setUnreadCounts } from '@/redux/reducers/chatUISlice'
import { fetch_providr_chat_list, getUserInfoApi } from '@/api/apiRoutes'

const CHAT_NOTIFICATION_TYPES = ['chat', 'message', 'new_message', 'new message'];

const PushNotificationLayout = ({ children, onNotificationReceived = () => { } }) => {
  const [notification, setNotification] = useState(null)
  const [userToken, setUserToken] = useState(null)
  const [isTokenFound, setTokenFound] = useState(false)
  // Local state for FCM token (renamed to avoid conflict with Redux action)
  const [localFcmToken, setLocalFcmToken] = useState('')
  const { fetchToken, onMessageListener } = FirebaseData()
  const router = useRouter()
  const dispatch = useDispatch()
  const chatUnreadTimerRef = useRef(null)

  // Get FCM token from userDataSlice (not settingsData)
  const getfcmToken = useSelector((state) => state?.userData?.fcmToken)

  // Debug: Log Redux state changes
  useEffect(() => {
  }, [getfcmToken]);

  // Debounced refresh of global unread chat counts when a chat notification arrives
  // Skipped when ChatPage is active - it handles counts locally
  const refreshChatUnreadCounts = (notificationData) => {
    const nType = (notificationData?.type || notificationData?.notification_type || '').toLowerCase();
    const hasChatMessage = !!notificationData?.chat_message;
    if (!CHAT_NOTIFICATION_TYPES.includes(nType) && !hasChatMessage) return;

    // Skip API calls if ChatPage is mounted - it manages counts locally
    const isChatPageActive = store?.getState?.()?.chatUI?.isChatPageActive;
    if (isChatPageActive) return;

    // Debounce: if multiple notifications arrive quickly, only fetch once
    if (chatUnreadTimerRef.current) clearTimeout(chatUnreadTimerRef.current);
    chatUnreadTimerRef.current = setTimeout(async () => {
      try {
        // Double-check in case ChatPage mounted during the debounce delay
        const stillActive = store?.getState?.()?.chatUI?.isChatPageActive;
        if (stillActive) return;

        // Check if this is an admin chat notification (chat_user is empty)
        const isAdminNotification = !notificationData?.chat_user;

        const [preRes, bookingRes, userInfoRes] = await Promise.all([
          fetch_providr_chat_list({ limit: '1', offset: '0', filter_type: 'pre_booking' }),
          fetch_providr_chat_list({ limit: '1', offset: '0', filter_type: 'booking' }),
          isAdminNotification ? getUserInfoApi().catch(() => null) : Promise.resolve(null),
        ]);
        const counts = {};
        if (preRes?.total_unread_users !== undefined) counts.pre_booking = preRes.total_unread_users;
        if (bookingRes?.total_unread_users !== undefined) counts.booking = bookingRes.total_unread_users;
        if (userInfoRes?.data?.unread_chats_count !== undefined) {
          counts.admin = Number(userInfoRes.data.unread_chats_count) || 0;
        }
        if (Object.keys(counts).length > 0) dispatch(setUnreadCounts(counts));
      } catch (err) {
        console.error('Error refreshing chat unread counts:', err);
      }
    }, 500);
  };

  useEffect(() => {
    handleFetchToken()
  }, [])

  const handleFetchToken = async () => {
    // Custom callback to store FCM token in userDataSlice
    const handleFcmToken = (token) => {
      // Update local state
      setLocalFcmToken(token);
      // Dispatch to userDataSlice - use the Redux action creator
      if (token) {
        // Use the Redux action creator (setFcmToken from userDataSlice)
        // This creates an action object with type and payload
        dispatch(setFcmToken(token));

        // Verify the dispatch worked by checking state after a short delay
        setTimeout(() => {
          const currentState = store?.getState?.();
        }, 100);
      }
    };

    await fetchToken(setTokenFound, handleFcmToken);
  }

  useEffect(() => {
    if (typeof window !== undefined) {
      // FCM token is now directly in userData, not nested
      setUserToken(getfcmToken)
    }
  }, [getfcmToken])

  // Handle notification redirect when notification is received
  // Note: For better UX, we show the notification first and redirect when user clicks
  // The redirect is handled in the notification click handler in the service worker
  // For foreground notifications, we store the redirect URL for potential future use
  useEffect(() => {
  }, [notification]);

  const onNotificationReceivedRef = React.useRef(onNotificationReceived);
  useEffect(() => {
    onNotificationReceivedRef.current = onNotificationReceived;
  }, [onNotificationReceived]);

  useEffect(() => {
    let unsubscribe = null;

    const setupListener = async () => {
      try {
        unsubscribe = await onMessageListener((payload) => {
          if (payload && payload.data) {
            // Calculate redirect URL
            const redirectUrl = getNotificationRedirectUrl(payload.data);
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            let absoluteRedirectUrl = redirectUrl;

            if (redirectUrl) {
              if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
                absoluteRedirectUrl = redirectUrl;
              } else {
                const cleanUrl = redirectUrl.startsWith("/") ? redirectUrl : "/" + redirectUrl;
                absoluteRedirectUrl = origin + cleanUrl;
              }
            }

            setNotification(payload.data);
            refreshChatUnreadCounts(payload.data);
            if (onNotificationReceivedRef.current) {
              onNotificationReceivedRef.current(payload.data);
            }
          }
        });
      } catch (err) {
        console.log(err);
        console.error('Error handling foreground notification:', err);
        toast.error('Error handling notification.');
      }
    };

    setupListener();

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Listen for messages from service worker (for debugging background notifications and navigation)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Listen for messages from service worker
    const handleServiceWorkerMessage = (event) => {

      const msg = event.data;
      if (!msg) {
        return;
      }

      // 1. Manually forwarded foreground messages from SW
      if (msg.type === "FOREGROUND_MESSAGE" && msg.payload) {
        const payload = msg.payload;
        if (payload && payload.data) {
          setNotification(payload.data);
          refreshChatUnreadCounts(payload.data);
          if (onNotificationReceivedRef.current) {
            onNotificationReceivedRef.current(payload.data);
          }
        }
      }

      // Handle navigation messages from service worker (when browser notification popup is clicked)
      // Check for both formats: { type: 'NAVIGATE' } and { action: 'navigate' }
      const isNavigateMessage =
        (msg.type === 'NAVIGATE' && msg.url) ||
        (msg.action === 'navigate' && msg.url);

      if (isNavigateMessage) {
        const url = msg.url;

        const currentOrigin = window.location.origin;
        let targetUrl = url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          targetUrl = `${currentOrigin}${url.startsWith("/") ? url : "/" + url}`;
        }

        try {
          // Use router.push for client-side navigation
          router.push(url).catch((error) => {
            // Fallback to window.location for hard navigation
            window.location.href = targetUrl;
          });
        } catch (error) {
          // Last resort: hard navigation
          window.location.href = targetUrl;
        }
      }

      // Handle debug data storage
      if (msg.type === 'NOTIFICATION_DEBUG') {
        // Store notification debug data in localStorage
        try {
          const existing = JSON.parse(localStorage.getItem('sw_notification_debug') || '[]');
          existing.unshift(msg.data);
          // Keep only last 20 notifications
          if (existing.length > 20) {
            existing.pop();
          }
          localStorage.setItem('sw_notification_debug', JSON.stringify(existing));

          if (process.env.NODE_ENV !== "production") {
          }
        } catch (error) {
          console.error("[PushNotification] Error storing notification debug data:", error);
        }
      }

    };

    // Wait for service worker to be ready
    navigator.serviceWorker.ready.then((registration) => {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }).catch((error) => {
      console.error("🔀 [PushNotification] Error waiting for service worker:", error);
      // Still try to add listener
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };

    // (Removed: Development-only push notification debug helpers)
  }, []);

  // Service worker registration (production-ready)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js', { scope: '/' })
        .then((registration) => {

          // Check for updates immediately
          registration.update();

          // Listen for service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  // Service worker will activate automatically due to skipWaiting()
                  // No need to reload - it will take control on next navigation or refresh
                }
              });
            }
          });

          // Periodic update check (every 60 seconds)
          setInterval(() => {
            registration.update();
          }, 60000);
        })
        .catch((err) => {
        });
    };

    // Register immediately if page is already loaded, otherwise wait for load
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker);
    }

    return () => {
      window.removeEventListener('load', registerServiceWorker);
    };
  }, [])
  return <div>{React.cloneElement(children)}</div>;
}

export default PushNotificationLayout
