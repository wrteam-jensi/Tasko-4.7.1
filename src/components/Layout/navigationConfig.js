// Navigation configuration based on location state
// This makes it easy to understand what links appear in each mode

/**
 * Navigation items configuration
 * Two modes:
 * 1. Without Location (no lat/long): Home, Blogs, FAQs, About Us, Contact Us
 * 2. With Location (has lat/long): Home, Services, Providers, About Us, Contact Us
 */

/**
 * Get navigation items based on location availability
 * @param {boolean} hasLocation - Whether user has set their location (lat/long exists)
 * @returns {Array} Array of navigation item objects
 */
export const getNavigationItems = (hasLocation) => {
    // Common items that appear in both modes
    const commonItems = [
        {
            key: 'home',
            href: hasLocation ? '/' : '/home',
            labelKey: 'home',
            order: 1
        },
        {
            key: 'about-us',
            href: '/about-us',
            labelKey: 'aboutUs',
            order: 4
        },
        {
            key: 'contact-us',
            href: '/contact-us',
            labelKey: 'contactUs',
            order: 5
        }
    ];

    // Location-specific items (shown when user has set location)
    const withLocationItems = [
        {
            key: 'services',
            href: '/services',
            labelKey: 'services',
            order: 2
        },
        {
            key: 'providers',
            href: '/providers',
            labelKey: 'providers',
            order: 3
        }
    ];

    // Landing page items (shown when user hasn't set location)
    const withoutLocationItems = [
        {
            key: 'blogs',
            href: '/blogs',
            labelKey: 'blogs',
            order: 2
        },
        {
            key: 'faqs',
            href: '/faqs',
            labelKey: 'faqs',
            order: 3
        }
    ];

    // Combine common items with mode-specific items
    const navigationItems = [
        ...commonItems,
        ...(hasLocation ? withLocationItems : withoutLocationItems)
    ];

    // Sort by order to ensure correct display sequence
    return navigationItems.sort((a, b) => a.order - b.order);
};
