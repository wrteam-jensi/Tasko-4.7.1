import React from "react";
import { useTranslation } from '@/components/Layout/TranslationContext';
import CustomImageTag from '@/components/ReUseableComponents/CustomImageTag';

const ChatQuestions = ({ selectedChatTab, onQuestionSubmit, isAdmin = false }) => {
    const t = useTranslation();

    // Determine chat type
    const isPreBooking = selectedChatTab?.booking_id === null;
    const isPostBooking = selectedChatTab?.booking_id !== null;
    
    // Get the appropriate title based on chat type
    const getTitle = () => {
        if (isAdmin) {
            return t("troubleChatWithSupportTeam");
        } else if (isPostBooking) {
            return t("letsChatAboutYourBooking");
        } else {
            return t("preBookingQuestions");
        }
    };
    
    // Pre-booking questions with emoji icons
    const preBookingQuestions = [
        { question: t("areYouLicensedAndInsured"), icon: "✅" },
        { question: t("howLongDoesTheServiceUsuallyTake"), icon: "⌛" },
        { question: t("doYouProvideASatisfactionGuarantee"), icon: "😊" },
        { question: t("doYouBringYourOwnToolsAndSupplies"), icon: "🔧" },
        { question: t("doYouOfferAnyDiscountsOrPromotions"), icon: "🎉" }
    ];
    
    // Post-booking questions with emoji icons
    const postBookingQuestions = [
        { question: t("whatIsTheStatusOfMyBooking"), icon: "📋" },
        { question: t("whenCanIExpectTheServiceToBeCompleted"), icon: "⏱️" },
        { question: t("doYouNeedAnyAdditionalInformation"), icon: "📝" },
        { question: t("willThereBeAnyDelayInTheService"), icon: "⚠️" }
    ];
    
    // Admin chat questions
    const adminChatQuestions = [
        { question: t("chatPreDefineMessageForAdmin1"), icon: "🔍" },
        { question: t("chatPreDefineMessageForAdmin2"), icon: "📅" },
        { question: t("chatPreDefineMessageForAdmin3"), icon: "💰" },
        { question: t("chatPreDefineMessageForAdmin4"), icon: "🔄" },
        { question: t("chatPreDefineMessageForAdmin5"), icon: "🔄" },
        { question: t("chatPreDefineMessageForAdmin6"), icon: "🔄" }
    ];
    
    // Select which questions to display based on chat type
    const questionsToDisplay = isAdmin 
        ? adminChatQuestions 
        : (isPreBooking ? preBookingQuestions : postBookingQuestions);
    
    // Handle question click with emoji included in message
    const handleQuestionClick = (item) => {
        // Combine emoji and question text for sending
        const messageWithEmoji = `${item.icon} ${item.question}`;
        onQuestionSubmit(messageWithEmoji);
    };

   
    
    return (
        <div className="flex flex-col items-center w-full h-full">
            
            <div className="w-full rounded-lg p-4 mb-4">
                <h3 className="text-lg md:text-xl font-medium mb-4 text-center primary_text_color">
                    {getTitle()}
                </h3>
                <div className="flex flex-col gap-4 max-w-md mx-auto">
                    {questionsToDisplay.map((item, index) => (
                        <button 
                            key={index}
                            onClick={() => handleQuestionClick(item)}
                            className="text-left py-3 px-4 light_bg_color hover:primary_bg_color hover:text-white rounded-lg transition-all flex items-center
                                     shadow-sm hover:shadow transform hover:-translate-y-1 duration-200"
                        >
                            <span className="mr-3 text-xl">{item.icon}</span>
                            <span>{item.question}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                {isAdmin ? t("clickToSendQuestionAdmin") : t("clickToSendQuestionProvider")}
            </p>
        </div>
    );
};

export default ChatQuestions; 