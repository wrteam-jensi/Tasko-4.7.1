import MetaData from "@/components/Meta/MetaData";
import dynamic from "next/dynamic";

const CheckoutPage = dynamic(
  () => import("@/components/PagesComponents/CheckoutPage/CheckoutPage"),
  { ssr: false }
);

const index = () => {
  return (
    <>
      <MetaData
        title={`Checkout - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/checkout"
      />
      <CheckoutPage />
    </>
  );
};

export default index;
