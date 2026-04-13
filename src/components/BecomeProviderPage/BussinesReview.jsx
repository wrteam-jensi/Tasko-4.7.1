import React from 'react'
import CommanSection from './CommanSection'


const BussinesReview = ({isReversed, headline, title, description, img, buttonText}) => {
    return (
        <section className="relative">
            <div className='py-8 md:py-10'>
                <CommanSection
                    isReversed={isReversed}
                    headline={headline}
                    title={title}
                    description={description}
                    buttonText={buttonText}
                    img={img} />
            </div>
        </section>
    )
}

export default BussinesReview