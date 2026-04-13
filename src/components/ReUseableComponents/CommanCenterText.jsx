import React from 'react'
import HighlightTag from './HighlightTag'

const CommanCenterText = ({ highlightedText, title, description }) => {
    return (
        <div className="text-center flex flex-col gap-4 items-center justify-center mb-12">
            {highlightedText &&
            <HighlightTag text={highlightedText} />
            }
            <span className="text-2xl md:main_headlines  font-bold w-full xl:w-[60%] mx-auto text_color">
                {title}
            </span>
            <p className="text-sm md:description_text text_color font-normal w-full md:w-[70%] lg:w-[50%] mx-auto opacity-60">
                {description}
            </p>
        </div>
    )
}

export default CommanCenterText