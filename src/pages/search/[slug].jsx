import MetaData from "@/components/Meta/MetaData";
import dynamic from "next/dynamic";

const SearchPage = dynamic(
  () => import("@/components/PagesComponents/SearchPage/SearchPage"),
  { ssr: false }
);
const index = () => {
  return (
    <div>
      <MetaData
        title={`Search - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/search"
      />
      <SearchPage />
    </div>
  );
};

export default index;
