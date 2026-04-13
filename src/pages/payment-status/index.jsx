import MetaData from "@/components/Meta/MetaData";
import dynamic from "next/dynamic";

const PaymentStatus = dynamic(
  () => import("@/components/ReUseableComponents/PaymentStatus/PaymentStatus"),
  { ssr: false }
);
const index = () => {
  return (
    <div>
      <MetaData
        title={`Payment Status - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/payment-status"
      />
    <PaymentStatus />
  </div>
  )
}

export default index