import { useTranslation } from '@/components/Layout/TranslationContext';
import React, { useEffect, useRef } from 'react'
import ChatQuestions from './ChatQuestions';
import MessageSkeleton from './MessageSkeleton';
import ChatInput from './ChatInput';

const AdminChat = ({ handleScroll, isLoading, chatMessages, attachedFiles, handleFileAttachment, message, handleMessageChange, MaxCharactersInTextMessage, handleSend, isSending, userData, renderMessage, renderFilePreview }) => {

    const t = useTranslation();
    const chatContentRef = useRef(null);

    // Auto scroll to bottom when messages change
    useEffect(() => {
        if (chatContentRef.current) {
            const chatScreen = document.querySelector('.chat_messages_screen');
            if (chatScreen) {
                chatScreen.scrollTop = chatScreen.scrollHeight;
            }
        }
    }, [chatMessages?.length]);

    // Handle direct question submission (auto-send)
    const handleQuestionSubmit = async (question) => {
        // First set the message in the input field
        if (typeof handleMessageChange === 'function') {
            const event = {
                target: {
                    value: question
                }
            };
            handleMessageChange(event);
        }

        // Directly call a custom send function that bypasses validation
        // since we know this is a valid message
        const customSendEvent = {
            preventDefault: () => { },
            target: {
                value: question
            }
        };

        // Small timeout to ensure state is updated before sending
        setTimeout(() => {
            handleSend(customSendEvent);
        }, 100);
    };

    return (
        <div className='flex-1 flex flex-col'>
            <div className='flex p-3 items-center border-b border-gray-300 gap-3'>
                <div className='flex flex-col gap-1 items-start'>
                    <h2 className='text-xl'>{t("customerSupport")}</h2>
                </div>
            </div>
            <div
                ref={chatContentRef}
                className='flex-1 flex flex-col gap-3 p-4 overflow-auto chatsWrapper justify-start chat_messages_screen'
                onScroll={handleScroll}
            >

                {isLoading ? (
                    <MessageSkeleton />
                ) : chatMessages.length === 0 ? (
                    // Show ChatQuestions when there are no messages
                    <ChatQuestions
                        selectedChatTab={null}
                        onQuestionSubmit={handleQuestionSubmit}
                        isAdmin={true}
                    />
                ) : (
                    <div className='flex flex-col-reverse'>
                        {chatMessages.map((message, index) => (
                            <div key={index} className={`flex ${(userData?.id === message?.sender_id || userData?.id === message?.sender_details?.id) ? 'justify-end senderMsg' : 'justify-start otherMsg'}`}>
                                {renderMessage(message)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat Input */}
            <ChatInput
                attachedFiles={attachedFiles}
                renderFilePreview={renderFilePreview}
                handleFileAttachment={handleFileAttachment}
                message={message}
                handleMessageChange={handleMessageChange}
                MaxCharactersInTextMessage={MaxCharactersInTextMessage}
                handleSend={handleSend}
                isSending={isSending}
                inputId="adminFileAttachment"
            />
        </div>
    );
};

export default AdminChat;