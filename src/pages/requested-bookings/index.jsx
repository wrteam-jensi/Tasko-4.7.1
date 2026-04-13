import MetaData from '@/components/Meta/MetaData'
import dynamic from 'next/dynamic'

const RequestedBookings = dynamic(
  () => import('@/components/PagesComponents/ProfilePages/RequestedBookings'),
  { ssr: false })
const index = () => {
  return (
    <div>
      <MetaData
        title={`Requested Bookings - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/requested-bookings"
      />
        <RequestedBookings />
    </div>
  )
}

export default index