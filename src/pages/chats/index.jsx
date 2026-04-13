import MetaData from '@/components/Meta/MetaData'
import dynamic from 'next/dynamic'
const ChatApp = dynamic(
  () => import('@/components/PagesComponents/ChatPage/ChatApp'),
  { ssr: false })

const index = () => {
  return (
    <>
    <MetaData
        title={`Chats - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/chats"
      />
      <ChatApp />
    </>
  )
}

export default index