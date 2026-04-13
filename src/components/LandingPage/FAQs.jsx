import CommanCenterText from '../ReUseableComponents/CommanCenterText';
import FaqAccordion from '../ReUseableComponents/FaqAccordion';

const FAQs = ({ title, desc, data }) => {

  // Sort the data in descending order based on the array index or any other property
  const sortedData = data?.slice().reverse();  // Reverse the data to make it descending

  const half = Math.ceil(sortedData?.length / 2);

  return (
    <section className="light_bg_color py-8 md:py-20">
      <div className='container mx-auto'>
        <CommanCenterText
          highlightedText={""}
          title={title}
          description={desc}
        />
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full flex flex-col gap-4">
              {/* First column - first half of the sorted data */}
              {sortedData?.slice(0, half).map((faq, index) => (
                <FaqAccordion faq={faq} key={index} />
              ))}
            </div>
            <div className="w-full flex flex-col gap-4">
              {/* Second column - second half of the sorted data */}
              {sortedData?.slice(half).map((faq, index) => (
                <FaqAccordion faq={faq} key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQs;
