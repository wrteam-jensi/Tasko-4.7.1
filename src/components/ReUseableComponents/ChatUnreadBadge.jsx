import { useSelector } from "react-redux";
import { selectTotalUnread } from "@/redux/reducers/chatUISlice";
import { useRouter } from "next/router";

/**
 * Common chat unread count badge.
 * Automatically hides when the user is on the /chats page.
 *
 * @param {string} [variant="pill"] - "pill" (red rounded badge) or "inline" (text-only count)
 * @param {string} [className] - Additional CSS classes
 * @param {number} [max=99] - Maximum count before showing "99+"
 */
const ChatUnreadBadge = ({ variant = "pill", className = "", max = 99 }) => {
  const totalUnread = useSelector(selectTotalUnread);
  const router = useRouter();

  const isChatPage = router.pathname === "/chats";

  if (!totalUnread || totalUnread <= 0 || isChatPage) return null;

  const display = totalUnread > max ? `${max}+` : totalUnread;

  if (variant === "inline") {
    return <span className={className}>{display}</span>;
  }

  return (
    <span
      className={`bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center ${className}`}
    >
      {display}
    </span>
  );
};

export default ChatUnreadBadge;
