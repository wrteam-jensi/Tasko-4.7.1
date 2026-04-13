import React from 'react'

const HighlightTag = ({text}) => {
    return (
        <span className="bg-blue-100 primary_text_color flex items-center gap-2 px-3 py-1 rounded-md ext-sm md:tag_lines w-fit font-medium">
            <div className="clip-star w-5 h-5 primary_bg_color" />
            <span className='text uppercase'>{text}</span>
            <div className="clip-star w-5 h-5 primary_bg_color" />
        </span>
    )
}

export default HighlightTag