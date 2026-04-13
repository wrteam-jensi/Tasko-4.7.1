import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { FaStar } from "react-icons/fa";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IoClose } from "react-icons/io5";
import CustomImageTag from "../CustomImageTag";
import { MdClose } from "react-icons/md";
import { logClarityEvent } from "@/utils/clarityEvents";
import { SERVICE_EVENTS } from "@/constants/clarityEventNames";

const RateServiceDialog = ({ 
    open, 
    onClose, 
    onSubmit, 
    t,
    isEditMode = false,
    existingReview = null,
    selectedServiceId = null,
}) => {
    
    const [formData, setFormData] = useState({
        rating: existingReview?.rating || 0,
        comment: existingReview?.comment || "",
        images: existingReview?.images || [],
        reviewId: existingReview?._id || null
    });

    const [previewImages, setPreviewImages] = useState(() => {
        if (existingReview?.images && existingReview.images.length > 0) {
            return existingReview.images.map(img => {
                if (typeof img === 'string') return img;
                if (img instanceof File) return URL.createObjectURL(img);
                if (img.url) return img.url;
                return img;
            });
        }
        return [];
    });

    // ✅ New: Track removed images separately
    const [removedImages, setRemovedImages] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (files) => {
        const newFiles = Array.from(files);
        
        // ✅ Fixed: Create object URLs for new files
        const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
        
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newFiles]
        }));
        
        setPreviewImages(prev => [...prev, ...newPreviewUrls]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        handleImageChange(files);
    };

    const removeImage = (index) => {
        const imageToRemove = formData.images[index];
        const previewUrl = previewImages[index];
        
        // ✅ Track removed image URL if it's an existing image (string)
        if (typeof imageToRemove === 'string') {
            setRemovedImages(prev => [...prev, imageToRemove]);
        }
        
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
        
        // ✅ Fixed: Revoke object URL before removing
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
    };

    // ✅ Added: Reset form function
    const resetForm = () => {
        // Clean up object URLs before reset
        previewImages.forEach(url => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });

        setFormData({
            rating: 0,
            comment: "",
            images: [],
            reviewId: null
        });

        setPreviewImages([]);
        setRemovedImages([]); // ✅ Clear removed images
        setIsSubmitting(false);
    };

    const handleSubmit = async () => {
        // Check if rating and comment are provided
        if (!formData.rating || !formData.comment.trim()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // ✅ Fixed: Separate new files from existing images
            let newFiles = [];
            let existingImages = [];
            
            formData.images.forEach(img => {
                if (img instanceof File) {
                    // New file - pass as File object
                    newFiles.push(img);
                } else if (typeof img === 'string') {
                    // Existing image URL - keep as string
                    existingImages.push(img);
                }
            });

            // ✅ Only pass images_to_delete if there are removed images
            const imagesToDelete = removedImages.length > 0 ? removedImages : [];

            // Call the parent's onSubmit with processed data
            await onSubmit({
                ...formData,
                images: newFiles, // ✅ Pass only new files
                existingImages: existingImages, // ✅ Pass existing images separately
                images_to_delete: imagesToDelete, // ✅ Pass removed images
                isEdit: isEditMode
            });
            logClarityEvent(SERVICE_EVENTS.SERVICE_REVIEW_SUBMITTED, {
                service_id: selectedServiceId,
                rating: formData.rating,
                is_edit: isEditMode,
            });

            // ✅ Fixed: Only reset form after successful submission
            // The parent component should handle the API call and success/error
            // We'll let the parent decide when to close the modal
            
        } catch (error) {
            console.error('Error submitting review:', error);
            setIsSubmitting(false);
        }
    };

    // ✅ Added: Cleanup function for component unmount
    const handleClose = () => {
        // Clean up object URLs
        previewImages.forEach(url => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <div className="flex justify-between items-center">
                    <DialogTitle className="text-xl font-semibold">
                        {isEditMode ? t("editReview") : t("rateService")}
                    </DialogTitle>
                    <MdClose size={20} className="cursor-pointer" onClick={handleClose} />
                </div>

                {/* Rating Stars */}
                <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                            className="focus:outline-none"
                            disabled={isSubmitting}
                        >
                            <FaStar
                                size={24}
                                className={star <= formData.rating ? "rating_icon_color" : "text-gray-300"}
                            />
                        </button>
                    ))}
                </div>

                {/* Review Text */}
                <Textarea
                    placeholder={t("writeReview")}
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    className="min-h-[100px] focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={isSubmitting}
                />

                {/* Image Upload */}
                <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                        {previewImages.map((preview, index) => (
                            <div
                                key={index}
                                className="relative transform scale-0 animate-in slide-in-from-left-5 duration-300 group"
                                style={{
                                    animation: `slideIn 0.3s ease-out ${index * 0.1}s forwards`
                                }}
                            >
                                <CustomImageTag
                                    src={preview}
                                    alt={t("preview")}
                                    className="w-20 aspect-square object-cover rounded-lg"
                                    onError={(e) => {
                                        console.error('Image failed to load:', preview);
                                        e.target.style.display = 'none';
                                    }}
                                />
                                <button
                                    onClick={() => removeImage(index)}
                                    className="absolute inset-0 rounded-lg hidden group-hover:flex items-center justify-center bg-gradient-to-t from-black/70 to-black/30 text-white transition-all duration-200"
                                    disabled={isSubmitting}
                                >
                                    <IoClose size={20} />
                                </button>
                            </div>
                        ))}
                        <label
                            className="relative transform scale-0 animate-in slide-in-from-left-5 duration-300"
                            style={{
                                animation: `slideIn 0.3s ease-out ${previewImages.length * 0.1}s forwards`
                            }}
                        >
                            <div
                                className={`w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-primary bg-primary/10 scale-105' : 'border-gray-300'
                                    }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            handleImageChange(e.target.files);
                                        }
                                    }}
                                    disabled={isSubmitting}
                                />
                                <span
                                    className="text-3xl text-gray-400 transition-transform duration-300"
                                    style={{
                                        transform: isDragging ? 'rotate(45deg)' : 'rotate(0deg)'
                                    }}
                                >
                                    +
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    className="w-full primary_bg_color text-white disabled:!bg-gray-300 disabled:!description_color disabled:cursor-not-allowed dark:disabled:text-black"
                    disabled={!formData.rating || !formData.comment.trim() || isSubmitting}
                >
                    {isSubmitting ? t("submitting") : t("submitReview")}
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default RateServiceDialog;

// Update the keyframe animations
const styles = `
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px) scale(0);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}