import React from "react";
import { useTranslation } from '@/components/Layout/TranslationContext';
import { MdOutlineChatBubbleOutline } from "react-icons/md";
import { IoPersonOutline } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { RiChatOffLine } from "react-icons/ri";

const EmptyChatState = ({ type, chatList, appName }) => {
    const t = useTranslation();

    // Handle different empty states with appropriate messaging and icons
    const renderState = () => {
        switch (type) {
            case "no-selection":
                return (
                    <div className="flex flex-col items-center justify-center">
                        <div className="primary_text_color light_bg_color p-6 rounded-full mb-4">
                            <IoPersonOutline size={48} />
                        </div>
                        <h3 className="text-xl font-medium mb-2 text-center">
                            {t("welcomeTo")} {appName}
                        </h3>
                      
                        {chatList && chatList.length === 0 ? (
                            <p className="text-gray-500 text-center max-w-md mb-6">
                                {t("noChatsYet")}
                            </p>
                        ) : (
                            <p className="text-gray-500 text-center max-w-md mb-6">
                                {t("pickPersonFromLeftMenu")}
                            </p>
                        )}
                    </div>
                );

            case "loading":
                return (
                    <div className="flex flex-col items-center justify-center">
                        <div className="primary_text_color p-6 mb-4 animate-spin">
                            <AiOutlineLoading3Quarters size={48} />
                        </div>
                        <h3 className="text-xl font-medium mb-2">
                            {t("loading")}
                        </h3>
                    </div>
                );
                
            case "no-messages":
                return (
                    <div className="flex flex-col items-center justify-center">
                        <div className="primary_text_color light_bg_color p-6 rounded-full mb-4">
                            <MdOutlineChatBubbleOutline size={48} />
                        </div>
                        <h3 className="text-xl font-medium mb-2 text-center">
                            {t("sendFirstMessageToStart")}
                        </h3>
                    </div>
                );
                
            case "chat-ended":
                return (
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-gray-400 bg-gray-100 p-6 rounded-full mb-4">
                            <RiChatOffLine size={48} />
                        </div>
                        <h3 className="text-xl font-medium mb-2 text-center text-gray-600">
                            {t("chatHasEnded")}
                        </h3>
                    </div>
                );
                
            default:
                return (
                    <div className="flex flex-col items-center justify-center">
                        <div className="primary_text_color light_bg_color p-6 rounded-full mb-4">
                            <MdOutlineChatBubbleOutline size={48} />
                        </div>
                        <h3 className="text-xl font-medium mb-2">
                            {t("noChatMessageFound")}
                        </h3>
                    </div>
                );
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center h-[430px] md:h-[600px] p-4">
            {renderState()}
        </div>
    );
};

export default EmptyChatState; 