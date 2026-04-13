import MetaData from '@/components/Meta/MetaData'
import dynamic from 'next/dynamic'

const Notifications = dynamic(
  () => import('@/components/PagesComponents/ProfilePages/Notifications'),
  { ssr: false })
const index = () => {
  return (
    <div>
      <MetaData
        title={`Notifications - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/notifications"
      />
      <Notifications />
    </div>
  )
}

export default index