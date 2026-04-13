import MetaData from '@/components/Meta/MetaData';
import dynamic from 'next/dynamic';
import React from 'react'

const ProfilePage = dynamic(
    () =>
      import(
        "@/components/PagesComponents/ProfilePage/ProfilePage"
      ),
    { ssr: false }
  );
  

const index = () => {
  return (
    <div>
        <MetaData
        title={`Profile - ${process.env.NEXT_PUBLIC_META_TITLE}`}
        description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
        keywords={process.env.NEXT_PUBLIC_META_KEYWORDS}
        pageName="/profile"
      />
        <ProfilePage />
    </div>
  )
}

export default index