import MetaData from "@/components/Meta/MetaData";
import dynamic from "next/dynamic";

const BookingDetails = dynamic(
  () => import("@/components/PagesComponents/BookingDetails/BookingDetails"),
  { ssr: false }
);

const index = () => {
  return (
    <div>
      <MetaData
        title={`Booking Details - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/booking/[...slug]"
      />
      <BookingDetails />
    </div>
  );
};

export default index;
