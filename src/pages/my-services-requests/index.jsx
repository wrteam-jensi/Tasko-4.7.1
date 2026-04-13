import MetaData from "@/components/Meta/MetaData";
import dynamic from "next/dynamic";

const MyServiceRequest = dynamic(
  () => import("@/components/PagesComponents/ProfilePages/MyServiceRequest"),
  { ssr: false }
);

const index = () => {
  return (
    <div>
      <MetaData
        title={`My Service Requests - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/my-services-requests"
      />
      <MyServiceRequest />
    </div>
  );
};

export default index;
