import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetch_providr_chat_list, getUserInfoApi } from '@/api/apiRoutes';
import { setUnreadCounts, selectUnreadCounts } from '@/redux/reducers/chatUISlice';
import { getUserData } from '@/redux/reducers/userDataSlice';

/**
 * Hook to fetch and keep global unread chat counts in Redux.
 * Lightweight: uses limit=1 per tab just to read total_unread_users.
 * Automatically refetches every 60 seconds while the tab is visible.
 */
const useChatUnreadCounts = () => {
  const dispatch = useDispatch();
  const userData = useSelector(getUserData);
  const unreadCounts = useSelector(selectUnreadCounts);
  const intervalRef = useRef(null);

  const fetchCounts = async () => {
    if (!userData?.id) return;

    try {
      const [preRes, bookingRes, userInfoRes] = await Promise.all([
        fetch_providr_chat_list({ limit: '1', offset: '0', filter_type: 'pre_booking' }),
        fetch_providr_chat_list({ limit: '1', offset: '0', filter_type: 'booking' }),
        getUserInfoApi().catch(() => null),
      ]);

      const counts = {};
      if (preRes?.total_unread_users !== undefined) {
        counts.pre_booking = preRes.total_unread_users;
      }
      if (bookingRes?.total_unread_users !== undefined) {
        counts.booking = bookingRes.total_unread_users;
      }
      if (userInfoRes?.data?.unread_chats_count !== undefined) {
        counts.admin = Number(userInfoRes.data.unread_chats_count) || 0;
      }

      if (Object.keys(counts).length > 0) {
        dispatch(setUnreadCounts(counts));
      }
    } catch (error) {
      console.error('Error fetching chat unread counts:', error);
    }
  };

  useEffect(() => {
    if (!userData?.id) return;

    // Fetch immediately
    fetchCounts();

    // Poll every 60 seconds
    intervalRef.current = setInterval(fetchCounts, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userData?.id]);

  return unreadCounts;
};

export default useChatUnreadCounts;
