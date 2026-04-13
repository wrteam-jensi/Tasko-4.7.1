import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { FaPlus, FaImage, FaFile } from "react-icons/fa";
import { RiSendPlaneFill } from "react-icons/ri";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";
import { useRTL } from "@/utils/Helper";

const ChatInput = ({
  attachedFiles,
  renderFilePreview,
  handleFileAttachment,
  message,
  handleMessageChange,
  MaxCharactersInTextMessage,
  handleSend,
  isSending,
  isDisabled,
  disabledMessage,
  blockedStatus,
  inputId = "chatFileAttachment",
}) => {
  const t = useTranslation();
  const isRTL = useRTL();

  const settingsData = useSelector((state) => state?.settingsData);
  const generalSettings = settingsData?.settings?.general_settings;
  const isImageUploadEnabled =
    Number(generalSettings?.enable_chat_image_upload) === 1;
  const isFileUploadEnabled =
    Number(generalSettings?.enable_chat_file_upload) === 1;

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAttachmentClick = () => {
    if (isImageUploadEnabled && isFileUploadEnabled) {
      setShowDropdown((prev) => !prev);
    } else if (isImageUploadEnabled) {
      handleImageClick();
    } else if (isFileUploadEnabled) {
      handleFileClick();
    }
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
    setShowDropdown(false);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
    setShowDropdown(false);
  };

  if (blockedStatus?.blockedByUser || blockedStatus?.blockedByProvider) {
    return (
      <div
        className="p-3 border-t text-center"
        style={{
          backgroundColor: blockedStatus.blockedByUser ? "#FEE2E2" : "#FEF3C7",
          color: blockedStatus.blockedByUser ? "#991B1B" : "#92400E",
        }}
      >
        {blockedStatus.message}
      </div>
    );
  }

  if (isDisabled) {
    return (
      <div className="p-3 bg-yellow-50 border-t text-center text-amber-800">
        {disabledMessage || t("sorryYouCantSendMessage")}
      </div>
    );
  }

  return (
    <div>
      {attachedFiles.length > 0 && (
        <div className="w-full border-t px-3 py-2 flex-wrap flex gap-2 overflow-auto max-h-[200px] card_bg">
          {attachedFiles.map((file, index) => renderFilePreview(file, index))}
        </div>
      )}
      <div className="w-full p-2 md:p-3 card_bg border-t flex gap-2 items-center rounded-b-lg">
        {(isImageUploadEnabled || isFileUploadEnabled) && (
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={handleAttachmentClick}
              className="md:h-10 md:w-10 h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer"
            >
              <FaPlus className="text-gray-600" />
            </div>

            {showDropdown && (
              <div
                className={`absolute bottom-full mb-2 ${isRTL ? "right-0" : "left-0"
                  } bg-white shadow-lg rounded-lg p-2 flex flex-col gap-2 min-w-[150px] z-20 border border-gray-100`}
              >
                {isImageUploadEnabled && (
                  <div
                    onClick={handleImageClick}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer text-gray-700"
                  >
                    <FaImage className="text-gray-500" />
                    <span>{t("images")}</span>
                  </div>
                )}
                {isFileUploadEnabled && (
                  <div
                    onClick={handleFileClick}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer text-gray-700"
                  >
                    <FaFile className="text-gray-500" />
                    <span>{t("documents")}</span>
                  </div>
                )}
              </div>
            )}

            <input
              type="file"
              id={`${inputId}_image`}
              ref={imageInputRef}
              multiple
              accept=".png, .jpg, .jpeg, .gif, .webp, .svg"
              onChange={(e) => handleFileAttachment(e, "image")}
              className="hidden"
            />
            <input
              type="file"
              id={`${inputId}_file`}
              ref={fileInputRef}
              multiple
              accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv, .zip, .rar"
              onChange={(e) => handleFileAttachment(e, "file")}
              className="hidden"
            />
          </div>
        )}
        <div className="relative w-full border dark:border_color rounded-md flex flex-col items-center justify-end">
          <textarea
            className="w-full input-like p-2 md:p-3 rounded-md bg-transparent  resize-none overflow-hidden min-h-[40px] focus:outline-none"
            placeholder={t("typeMessage")}
            style={{ direction: isRTL ? "rtl" : "ltr" }}
            value={message}
            onChange={handleMessageChange}
            maxLength={MaxCharactersInTextMessage}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          ></textarea>
          {/* <small className="counter absolute hidden md:block  right-5 bottom-2 text-xs text-gray-500">
                        {message.length}/{MaxCharactersInTextMessage}
                    </small> */}

          <small className="counter text-xs description_color w-full text-right mr-5">
            {message.length}/{MaxCharactersInTextMessage}
          </small>
        </div>
        <button
          onClick={handleSend}
          className="md:h-10 md:w-10 h-8 w-8 flex items-center justify-center rounded-lg primary_bg_color text-white"
          disabled={isSending}
        >
          {isSending ? <MiniLoader /> : <RiSendPlaneFill />}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
