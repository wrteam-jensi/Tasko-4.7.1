import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/components/Layout/TranslationContext";

/**
 * Reusable Confirmation Dialog Component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Controls dialog visibility
 * @param {Function} props.onOpenChange - Handler for dialog open/close state changes
 * @param {Function} props.onConfirm - Handler when user confirms the action
 * @param {string} props.title - Dialog title (translation key or text)
 * @param {string} props.description - Dialog description/message (translation key or text)
 * @param {string} props.confirmText - Text for confirm button (translation key or text, defaults to "confirm")
 * @param {string} props.cancelText - Text for cancel button (translation key or text, defaults to "cancel")
 * @param {string} props.variant - Button style variant: "destructive" (red) or "primary" (theme color, default)
 * @param {string} props.confirmButtonClass - Custom CSS classes for confirm button (overrides variant)
 * @param {string} props.cancelButtonClass - Custom CSS classes for cancel button
 */
const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "confirm",
  cancelText = "cancel",
  variant = "primary",
  confirmButtonClass,
  cancelButtonClass = "",
}) => {
  const t = useTranslation();

  // Handle confirm action
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  // Get translated or plain text
  const getText = (text) => {
    if (!text) return "";
    const translated = t(text);
    // If translation returns something different from the key, use it
    // Otherwise, use the text as-is
    return translated && translated !== text ? translated : text;
  };

  // Determine button styling based on variant
  const getConfirmButtonClass = () => {
    // If custom class provided, use it
    if (confirmButtonClass) return confirmButtonClass;

    // Otherwise use variant-based styling
    if (variant === "destructive") {
      return "bg-red-600 hover:bg-red-700 text-white";
    }
    // Default: primary theme color
    return "primary_bg_color hover:opacity-90 text-white";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getText(title)}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>
              {getText(description)}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => onOpenChange?.(false)}
            className={cancelButtonClass}
          >
            {getText(cancelText)}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={getConfirmButtonClass()}
          >
            {getText(confirmText)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;

