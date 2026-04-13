
import MetaData from '@/components/Meta/MetaData'
import dynamic from 'next/dynamic'

const BookMarks = dynamic(
  () => import('@/components/PagesComponents/ProfilePages/BookMarks'),
  { ssr: false })
const index = () => {
  return (
    <div>
      <MetaData
        title={`Bookmarks - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/bookmarks"
      />
      <BookMarks />
    </div>
  )
}

export default index