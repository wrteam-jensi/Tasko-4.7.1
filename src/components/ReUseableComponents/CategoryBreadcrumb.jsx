import React from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";
import { removeCategoryBySlug } from "@/redux/reducers/multiCategoriesSlice";
import { useTranslation } from "../Layout/TranslationContext";
import { useRTL } from "@/utils/Helper";
import CustomLink from "./CustomLink";

const CategoryBreadcrumb = ({ selectedCategories }) => {
  const t = useTranslation();
  const isRTL = useRTL();
  const dispatch = useDispatch();
  const router = useRouter();
  // Extract the last slug from the current path
  const pathSegments = router.asPath.split('/');
  const lastSlug = pathSegments[pathSegments.length - 1];

  
  const handleCategoryClick = (slug, event) => {
    event.preventDefault(); // Prevent default link behavior

    // Remove clicked category
    dispatch(removeCategoryBySlug(slug));

    // Redirect to the new trimmed path
    const currentPath = router.asPath;
    const pathSegments = currentPath.split("/");
    const clickedCategoryIndex = pathSegments.findIndex(
      (segment) => segment === slug
    );

    if (clickedCategoryIndex !== -1) {
      const newPath = pathSegments.slice(0, clickedCategoryIndex + 1).join("/");
      router.push(`/${newPath}`);
    }
  };

  return (
    <div className="custom-breadcrumb py-4 my-6 light_bg_color">
      <div className="container mx-auto">
        <Breadcrumb className="flex items-center flex-wrap gap-2 [&_li]:list-none [&_ol]:list-none">
          {/* Home breadcrumb */}
          <BreadcrumbItem>
            <CustomLink href="/" className="text-sm font-normal hover:primary_text_color" title={t("home")}>
              {t("home")}
            </CustomLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="separator w-6">
            <ChevronRight className={`${isRTL ? "rotate-180" : "rotate-0"}`} />
          </BreadcrumbSeparator>

          {/* Categories breadcrumb */}
          <BreadcrumbItem>
            <CustomLink
              href="/services"
              className="text-sm font-normal hover:primary_text_color"
              title={t("services")}
            >
              {t("services")}
            </CustomLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="separator w-6">
            <ChevronRight className={`${isRTL ? "rotate-180" : "rotate-0"}`} />
          </BreadcrumbSeparator>

          {/* Dynamically render category breadcrumbs */}
          {selectedCategories.map((category, index) => {
            const isActive = category?.slug === lastSlug; // Check if category is active
            return (
              <React.Fragment key={category?.id}>
                <BreadcrumbItem>
                  {isActive ? (
                    // Active category - Not clickable, styled as bold text
                    <span className="text-sm font-normal primary_text_color">
                      {category?.translated_name ? category?.translated_name : category?.name}
                    </span>
                  ) : (
                    // Non-active category - Clickable
                    <CustomLink
                      href="#"
                      title={category?.translated_name ? category?.translated_name : category?.name}
                      className="text-sm font-normal hover:primary_text_color"
                      onClick={(e) => handleCategoryClick(category?.slug, e)}
                    >
                      {category?.translated_name ? category?.translated_name : category?.name}
                    </CustomLink>
                  )}
                </BreadcrumbItem>

                {index < selectedCategories.length - 1 && (
                  <BreadcrumbSeparator className="separator w-6">
                    <ChevronRight className={`${isRTL ? "rotate-180" : "rotate-0"}`} />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            );
          })}
        </Breadcrumb>
      </div>
    </div>
  );
};

export default CategoryBreadcrumb;
