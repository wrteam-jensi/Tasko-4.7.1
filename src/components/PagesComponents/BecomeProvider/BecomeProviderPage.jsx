"use client"
import dynamic from 'next/dynamic'

const ProviderPage = dynamic(
  () => import('@/components/BecomeProviderPage'),
  { ssr: false })
  
const BecomeProviderPage = () => {
  return (
    <><ProviderPage /></>
  )
}

export default BecomeProviderPage