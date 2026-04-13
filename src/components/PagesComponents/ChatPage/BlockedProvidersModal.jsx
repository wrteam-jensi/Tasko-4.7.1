import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/components/Layout/TranslationContext';
import CustomImageTag from '@/components/ReUseableComponents/CustomImageTag';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog";
import { RiUserForbidFill } from 'react-icons/ri';
import { X } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

const BlockedProviderSkeleton = () => {
    return Array(3).fill(0).map((_, index) => (
        <div key={index}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border rounded-lg gap-3 sm:gap-0"
        >
            <div className="flex items-center gap-3 sm:gap-6">
                <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
            </div>
            <Skeleton className="w-16 h-7 rounded-full" />
        </div>
    ));
};

const BlockedProvidersModal = ({ isOpen, onClose, blockedProviders, onUnblock, selectedChatTab, setBlockedStatus, fetchChatMessages }) => {
    const t = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [localBlockedProviders, setLocalBlockedProviders] = useState([]);

    // Update local state when blockedProviders prop changes
    useEffect(() => {
        if (blockedProviders?.length > 0) {
            setLocalBlockedProviders(blockedProviders);
        }
    }, [blockedProviders]);

    // Enhanced unblock handler to update both modal and chat states
    const handleUnblock = async (provider) => {
        try {
            await onUnblock(provider);

            // Update local state by removing the unblocked provider
            setLocalBlockedProviders(prev =>
                prev.filter(p => p.id !== provider.id)
            );

            // If this is the currently selected chat, update its blocked status
            if (selectedChatTab?.partner_id === provider.id) {
                setBlockedStatus({
                    isBlocked: false,
                    blockedByUser: false,
                    blockedByProvider: false,
                    message: ""
                });

                // Refresh chat messages to show unblocked state
                fetchChatMessages(selectedChatTab, 0, false);
            }

            // Close modal if this was the last blocked provider
            if (localBlockedProviders.length <= 1) {
                onClose();
            }
        } catch (error) {
            console.error('Error unblocking provider:', error);
        }
    };

    // Show loading skeleton for 1 second when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl w-[95%] mx-auto">
                <DialogHeader className="relative rtl:flex-reverse">
                    <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <RiUserForbidFill className="primary_text_color text-xl sm:text-2xl" />
                        {t("blockedProviders")}
                    </DialogTitle>
                    <DialogClose className="absolute rtl:left-0 rtl:right-auto top-0 w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </DialogClose>
                </DialogHeader>

                <div className="max-h-[350px] sm:max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-3 sm:space-y-4">
                            <BlockedProviderSkeleton />
                        </div>
                    ) : localBlockedProviders?.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                            {localBlockedProviders.map((provider) => {

                                const translatedProviderName = provider?.translated_provider_name ? provider?.translated_provider_name : provider?.provider_name;
                                const translatedReason = provider?.translated_reason ? provider?.translated_reason : provider?.reason;

                                return (
                                    <div key={provider.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border rounded-lg gap-3 sm:gap-0"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-6">
                                            <div className="w-10 aspect-square sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0">
                                                <CustomImageTag
                                                    src={provider.image}
                                                    alt={translatedProviderName}
                                                    className="w-full h-full object-cover rounded-full"
                                                    imgClassName="object-cover rounded-full"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-medium text-sm sm:text-base text-wrap">{translatedProviderName}</h3>
                                                <p className="text-xs sm:text-sm text-gray-500 text-wrap">{translatedReason}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnblock(provider)}
                                            className="px-3 py-1 text-xs sm:text-sm text-white rounded-full primary_bg_color hover:bg-opacity-90 transition-all duration-300 w-fit ml-auto sm:ml-0"
                                        >
                                            {t("unblock")}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-gray-500">
                            {t("noBlockedProviders")}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BlockedProvidersModal; 