import React from "react";
import CustomImageTag from "../CustomImageTag";
import { useTranslation } from "@/components/Layout/TranslationContext";

const BlogRelatedCard = ({ recentPosts }) => {
  const t = useTranslation();
  
  return (
    <div className="border rounded-xl shadow-sm">
      {/* Header */}
      <h3 className="text-lg font-bold border-b px-4 py-3">
        {t("relatedBlog")}
      </h3>

      {/* Blog list */}
      <div className="space-y-4 p-4">
        {recentPosts?.map((post, index) => {
          const translatedTitle = post?.translated_title ? post?.translated_title : post?.title;
          const translatedShortDescription = post?.translated_short_description ? post?.translated_short_description : post?.short_description;
          
          return (
            <a
              key={index}
              href={`/blog-details/${post?.slug}`}
              className="flex items-start gap-3 rounded-lg p-2 transition"
            >
              {/* Thumbnail */}
              <CustomImageTag
                src={post?.image}
                alt={post?.title}
                className="w-32 aspect-blog-related rounded-lg object-cover"
                imgClassName="rounded-lg"
              />

              {/* Text Content */}
              <div className="flex-1">
                <h4 className="text-sm font-semibold line-clamp-1">
                  {translatedTitle}
                </h4>
                <p className="text-xs line-clamp-2 description_color">
                  {translatedShortDescription}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default BlogRelatedCard;
