import React from 'react'
import Application from '../ReUseableComponents/Application'

const GetProviderApp = ({isReview}) => {
    return (
        <section className='get_provider_app relative'>
            <div className="container mx-auto">
                <Application isReview={isReview} />
            </div>
        </section>
    )
}

export default GetProviderApp