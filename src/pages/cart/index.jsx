import MetaData from "@/components/Meta/MetaData";
import dynamic from "next/dynamic";

const CartPage = dynamic(
  () => import("@/components/PagesComponents/CartPage/CartPage"),
  { ssr: false }
);
const index = () => {
  return (
    <>
      <MetaData
        title={`Cart - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/cart"
      />
      <CartPage />
    </>
  );
};

export default index;
