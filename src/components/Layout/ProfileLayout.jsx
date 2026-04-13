"use client";
import React, { memo, useMemo } from "react";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/ReUseableComponents/BreadCrumb";
import SideNavigation from "@/components/PagesComponents/ProfilePages/SideNavigation";
import { isMobile } from "@/utils/Helper";

/**
 * ProfileLayout Component
 * 
 * A reusable layout component for profile/dashboard pages that includes:
 * - Layout wrapper
 * - Optional BreadCrumb
 * - SideNavigation (memoized to prevent unnecessary re-renders)
 * - Main content area for children
 * 
 * This component is optimized to prevent re-renders of SideNavigation
 * when navigating between profile pages. Only the content area re-renders.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Main content to display
 * @param {string} props.breadcrumbTitle - Title for breadcrumb (optional)
 * @param {string} props.breadcrumbLink - Link for breadcrumb (optional)
 * @param {boolean} props.showBreadcrumb - Whether to show breadcrumb (default: true)
 * @param {string} props.containerClassName - Additional classes for container (optional)
 * @param {string} props.contentClassName - Additional classes for content area (optional)
 */
const ProfileLayout = ({
  children,
  breadcrumbTitle,
  breadcrumbLink,
  showBreadcrumb = true,
  containerClassName = "",
  contentClassName = "",
}) => {
  // Memoize breadcrumb to prevent unnecessary re-renders
  // Only re-render breadcrumb if title or link actually changes
  const breadcrumb = useMemo(() => {
    if (showBreadcrumb && breadcrumbTitle) {
      return (
        <BreadCrumb
          firstEle={breadcrumbTitle}
          firstEleLink={breadcrumbLink}
          isMobile={isMobile}
        />
      );
    }
    return null;
  }, [showBreadcrumb, breadcrumbTitle, breadcrumbLink]);

  // Memoize container classes to prevent string concatenation on every render
  const containerClasses = useMemo(
    () => `container mx-auto ${containerClassName}`,
    [containerClassName]
  );

  const contentClasses = useMemo(
    () => `lg:col-span-9 col-span-12 ${contentClassName}`,
    [contentClassName]
  );

  return (
    <Layout>
      {breadcrumb}
      <section className="profile_sec md:my-12">
        <div className={containerClasses}>
          {/* Grid layout with items-start to align sidebar to top */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sidebar - Memoized to prevent re-renders, sticky positioned */}
            <div className="lg:col-span-3 hidden md:block">
              <MemoizedSideNavigation />
            </div>

            {/* Main Content - Only this area re-renders when children change */}
            {/* Content area scrolls independently while sidebar stays fixed */}
            <div className={contentClasses}>
              {children}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

// Memoize SideNavigation to prevent unnecessary re-renders when navigating between profile pages
// SideNavigation has no props, so it should never re-render during navigation
// This ensures the sidebar remains stable while only the content area updates
const MemoizedSideNavigation = memo(SideNavigation);

// Export ProfileLayout without memoizing it
// ProfileLayout needs to re-render when children change so content updates
// But SideNavigation inside is memoized, so it won't re-render unnecessarily
export default ProfileLayout;

