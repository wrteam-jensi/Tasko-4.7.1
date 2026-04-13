"use client";
import CommanCenterText from "../ReUseableComponents/CommanCenterText";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";

const Progress = ({ title, desc, data }) => {
  return (
    <section id="progress" className="py-8 md:py-20">
      <div className="container mx-auto">
        <CommanCenterText
          highlightedText={""}
          title={title}
          description={desc}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {data?.map((step, index) => (
            <div
              key={step?.id}
              className="flex flex-col items-center text-center"
            >
              <div className="light_bg_color rounded-full mb-4">
                <CustomImageTag src={step?.image} alt={step?.title} />
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm description_color">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Progress;
