import { useTranslation } from "@/components/Layout/TranslationContext";
import { useRouter } from "next/router";
import React from "react";

const BlogCategoriesCard = ({ categories, totalCount: propsTotalCount, onFilterChange }) => {
    const t = useTranslation();
    const router = useRouter();
    const { category } = router.query;

    const totalCount = propsTotalCount || categories.reduce((sum, category) => sum + (category.count || 0), 0);

    const handleCategoryClick = (categorySlug) => {
        if (category === categorySlug || (!category && categorySlug === 'all')) {
            return; // prevent clicking on active category
        }

        const query = { ...router.query };

        if (categorySlug === 'all') {
            delete query.category;
        } else {
            query.category = categorySlug;
        }

        router.replace({
            pathname: router.pathname,
            query: query
        }, undefined, { shallow: true });

        if (onFilterChange) {
            onFilterChange();
        }
    };



    return (
        <div className="border rounded-xl shadow-sm">
            <h3 className="text-lg font-bold mb-3 border-b border-gray-200 p-4">{t("categories")}</h3>

            {/* All Categories Option */}
            <button
                onClick={() => handleCategoryClick('all')}
                disabled={!category || category === 'all'}
                className={`w-full flex justify-between text-sm px-4 py-2 text-left ${
                    !category || category === 'all'
                        ? "primary_text_color font-semibold cursor-not-allowed"
                        : "description_color hover:primary_text_color"
                }`}
            >
                <span>{t("all")}</span>
                <span>({totalCount})</span>
            </button>

            {/* Individual Categories */}
            {categories.map((categoryItem, index) => {
                const isActive = category === categoryItem.slug;
                const translatedCategoryName  = categoryItem?.translated_name ? categoryItem?.translated_name : categoryItem?.name;
                return (
                    <button
                        key={categoryItem.id || index}
                        onClick={() => handleCategoryClick(categoryItem.slug)}
                        disabled={isActive}
                        className={`w-full flex justify-between text-sm px-4 py-2 text-left ${
                            isActive
                                ? "primary_text_color font-semibold cursor-not-allowed"
                                : "description_color hover:primary_text_color"
                        }`}
                    >
                        <span>{translatedCategoryName}</span>
                        <span>({categoryItem.count || 0})</span>
                    </button>
                );
            })}
        </div>
    );
};

export default BlogCategoriesCard;
