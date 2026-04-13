
import MetaData from '@/components/Meta/MetaData'
import dynamic from 'next/dynamic'
const Addresses = dynamic(
  () => import('@/components/PagesComponents/ProfilePages/Addresses'),
  { ssr: false })


const index = () => {
  return (
    <div>
      <MetaData
        title={`Addresses - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/addresses"
      />
      <Addresses />
    </div>
  )
}

export default index