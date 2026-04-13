import MetaData from "@/components/Meta/MetaData";
import dynamic from "next/dynamic";

const ServiceRequestDetails = dynamic(
  () =>
    import("@/components/PagesComponents/BookingDetails/ServiceRequestDetails"),
  { ssr: false }
);

const index = () => {
  return (
    <div>
      <MetaData
        title={`Service Request Details - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/my-service-request-details/[...slug]"
      />
      <ServiceRequestDetails />
    </div>
  );
};
export default index;
