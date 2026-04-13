import MetaData from "@/components/Meta/MetaData";
import dynamic from "next/dynamic";

const PaymentHistory = dynamic(
  () => import("@/components/PagesComponents/ProfilePages/PaymentHistory"),
  { ssr: false }
);

const index = () => {
  return (
    <div>
      <MetaData
        title={`Payment History - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/payment-history"
      />
      <PaymentHistory />
    </div>
  )
}

export default index