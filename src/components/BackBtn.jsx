import React from 'react'
import { FaChevronLeft } from 'react-icons/fa'
import { useRouter } from 'next/router'

const BackBtn = () => {

    const router = useRouter()


  return (
    <span className='rounded-full border p-2 cursor-pointer' onClick={router.back()}><FaChevronLeft/></span>
  )
}

export default BackBtn