import CustomLink from "../ReUseableComponents/CustomLink";

/**
 * Reusable navigation link component with consistent styling
 * Handles active state and hover animations
 */
const NavLink = ({ href, label, isActive, title }) => {
    return (
        <CustomLink
            href={href}
            className={`relative group text-base font-normal hover:primary_text_color transition-colors ${isActive ? "primary_text_color" : ""
                }`}
            title={title}
        >
            {label}
            <span
                className={`absolute left-1/2 -bottom-1 h-0.5 primary_bg_color transition-all duration-300 ease-in-out transform -translate-x-1/2 ${isActive ? "w-3/4" : "w-0 group-hover:w-3/4"
                    }`}
            ></span>
        </CustomLink>
    );
};

export default NavLink;
