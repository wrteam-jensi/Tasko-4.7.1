import React from "react";
import { useRouter } from "next/router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "../Layout/TranslationContext";
import { useRTL } from "@/utils/Helper";
import CustomLink from "./CustomLink";

const BreadCrumb = ({
  firstEle,
  secEle,
  thirdEle,
  firstEleLink,
  SecEleLink,
  thirdEleLink,
  isMobile,
}) => {
  const t = useTranslation();
  const isRTL = useRTL();
  const router = useRouter();

  // Helper function to check if the link matches the current route
  const isActive = (link) => router.asPath === link;

  const getClassName = (link) => {
    const baseClass = "text-sm md:text-base font-normal";
    if (isActive(link)) {
      return `${baseClass} primary_text_color cursor-default pointer-events-none`;
    }
    return `${baseClass} hover:primary_text_color`;
  };

  const BreadcrumbLink = ({ link, children, title }) =>
    isActive(link) ? (
      <span className={getClassName(link)} title={title}>
        {children}
      </span>
    ) : (
      <CustomLink href={link} className={getClassName(link)} title={title}>
        {children}
      </CustomLink>
    );

  return (
    <div className="custom-breadcrumb py-4 my-6 light_bg_color">
      <div className="container mx-auto">
        <Breadcrumb className="flex flex-wrap items-center gap-1 sm:gap-2 [&_li]:list-none [&_ol]:list-none">
          {/* Home Breadcrumb */}
          <BreadcrumbItem>
            {isMobile && isMobile() ? (
              <CustomLink href="/profile" title={t("profile")}>
                {t("profile")}
              </CustomLink>
            ) : (
              <BreadcrumbLink link="/" title={t("home")}>
                {t("home")}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>

          {/* First Element */}
          {firstEle && (
            <>
              <BreadcrumbSeparator className="separator w-6">
                <ChevronRight className={`${isRTL ? "rotate-180" : "rotate-0"}`} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {firstEleLink ? (
                  <BreadcrumbLink link={firstEleLink} title={firstEle}>
                    {firstEle}
                  </BreadcrumbLink>
                ) : (
                  <span className="text-sm md:text-base font-normal description_color">
                    {firstEle}
                  </span>
                )}
              </BreadcrumbItem>
            </>
          )}

          {/* Second Element */}
          {secEle && (
            <>
              <BreadcrumbSeparator className="separator w-6">
                <ChevronRight className={`${isRTL ? "rotate-180" : "rotate-0"}`} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {SecEleLink ? (
                  <BreadcrumbLink link={SecEleLink} title={secEle}>
                    {secEle}
                  </BreadcrumbLink>
                ) : (
                  <span className="text-sm md:text-base font-normal description_color">
                    {secEle}
                  </span>
                )}
              </BreadcrumbItem>
            </>
          )}

          {/* Third Element */}
          {thirdEle && (
            <>
              <BreadcrumbSeparator className="separator w-6">
                <ChevronRight className={`${isRTL ? "rotate-180" : "rotate-0"}`} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {thirdEleLink ? (
                  <BreadcrumbLink link={thirdEleLink} title={thirdEle}>
                    {thirdEle}
                  </BreadcrumbLink>
                ) : (
                  <span className="text-sm md:text-base font-normal description_color">
                    {thirdEle}
                  </span>
                )}
              </BreadcrumbItem>
            </>
          )}
        </Breadcrumb>
      </div>
    </div>
  );
};

export default BreadCrumb;
