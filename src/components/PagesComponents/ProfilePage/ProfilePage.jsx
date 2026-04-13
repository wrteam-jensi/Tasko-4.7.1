import withAuth from '@/components/Layout/withAuth'
import Profile from '@/components/ReUseableComponents/Profile/Profile'
import React from 'react'

const ProfilePage = () => {
  return (
    <div className=''>
        <Profile />
    </div>
  )
}

export default withAuth(ProfilePage)