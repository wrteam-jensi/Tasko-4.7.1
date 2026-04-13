"use client"
import HighlightTag from '../ReUseableComponents/HighlightTag';
import CustomImageTag from '../ReUseableComponents/CustomImageTag';

const CommanSection = ({ isReversed, headline, title, description, buttonText, img }) => {
    return (
        <section className="container mx-auto px-4">
            <div className={`flex flex-col md:flex-row items-center justify-between ${isReversed ? 'md:flex-row-reverse' : ''}`}>
                {/* Text Section */}
                <div className="md:w-1/2 flex flex-col justify-center items-start text-left gap-4">
                    <HighlightTag text={headline} />
                    <h2 className="text-2xl md:main_headlines  font-bold mb-4">
                        {title}
                    </h2>
                    <p className="text-sm md:description_text opacity-45 font-normal mb-6">
                        {description}
                    </p>
                </div>

                {/* Image Section */}
                <div className="w-full md:w-1/2 flex items-center justify-center relative p-6">
                    <div className="relative w-full h-fit md:h-[645px] aspect-square">
                        <CustomImageTag
                            src={img}
                            alt={title}
                            className="z-10  !w-full"
                            imgClassName="object-contain"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CommanSection;
