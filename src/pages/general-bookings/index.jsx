import MetaData from '@/components/Meta/MetaData'
import dynamic from 'next/dynamic'

const GeneralBookings = dynamic(
  () => import('@/components/PagesComponents/ProfilePages/GeneralBookings'),
  { ssr: false })
const index = () => {
  return (
    <div>
    <MetaData
        title={`General Bookings - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/general-bookings"
      />
        <GeneralBookings />
    </div>
  )
}

export default index