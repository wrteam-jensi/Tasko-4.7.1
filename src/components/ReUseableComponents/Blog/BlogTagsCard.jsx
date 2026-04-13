import { useTranslation } from "@/components/Layout/TranslationContext";
import { useRouter } from "next/router";
import React from "react";

const BlogTagsCard = ({ tags, onFilterChange }) => {
  const t = useTranslation();
  const router = useRouter();
  const { tag } = router.query;

  const isBlogDetails = router.pathname.includes("blog-details");

  const handleTagClick = (tagSlug) => {
    const query = { ...router.query };
    
    if (tagSlug === 'all') {
      delete query.tag;
    } else {
      query.tag = tagSlug;
    }

    // If on blog details page, navigate to blogs page with tag filter
    if (isBlogDetails) {
      router.push({
        pathname: '/blogs',
        query: {
          tag: tagSlug === 'all' ? undefined : tagSlug
        }
      });
    } else {
      // Use replace to avoid page reload on blogs listing page
      router.replace({
        pathname: router.pathname,
        query: query
      }, undefined, { shallow: true });
    }

    // Trigger loading state
    if (onFilterChange) {
      onFilterChange();
    }
  };

  return (
    <div className="border rounded-xl shadow-sm">
      {/* Header */}
      <h3 className="text-lg font-bold border-b border-gray-200 px-4 py-3">
        {t("tags")}
      </h3>

      {/* Tags grid */}
      <div className="flex flex-wrap gap-2 p-4">
        {/* All Tags Option */}
        {!isBlogDetails && (
        <button
          onClick={() => handleTagClick('all')}
          disabled={!tag || tag === 'all'}
          className={`px-3 py-1 rounded-lg border text-sm transition-colors duration-200 ${
            !tag || tag === 'all'
              ? "primary_bg_color border_color text-white cursor-not-allowed"
              : "bg-transparent description_color hover:light_bg_color hover:border_color hover:primary_text_color"
          }`}
        >
          {t("all")}
        </button>
        )}

        {/* Individual Tags */}
        {tags.map((tagItem) => {
          // Use the slug from the API response
          const tagSlug = tagItem.slug;
          const isActive = tag === tagSlug;
          const translatedTagName = tagItem?.translated_name ? tagItem?.translated_name : tagItem?.name;

          return (
            <button
              key={tagItem.id}
              disabled={isActive}
              onClick={() => handleTagClick(tagSlug)}
              className={`px-3 py-1 rounded-lg border text-sm transition-colors duration-200 capitalize ${
                isActive
                  ? "primary_bg_color border_color text-white cursor-not-allowed"
                  : "bg-transparent description_color hover:light_bg_color hover:border_color hover:primary_text_color"
              }`}
            >
              {translatedTagName}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BlogTagsCard;
