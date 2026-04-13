import React from 'react'
import { Skeleton } from '../ui/skeleton'
import { Card, CardContent } from '../ui/card'

const BookingDetailsPage = () => {
  return (
    <div className="col-span-12 lg:col-span-9">
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <main className="w-full space-y-6">
          {/* Provider Skeleton */}
          <section className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-[52px] w-[52px] rounded-[4px]" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </section>

          <Skeleton className="h-[1px] w-full" />

          {/* Schedule Skeleton */}
          <section className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </section>

          <Skeleton className="h-[1px] w-full" />

          {/* Services Skeleton */}
          <section className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="space-y-6">
              {[1, 2].map((item) => (
                <div key={item} className="flex items-center gap-6">
                  <Skeleton className="h-12 w-12 rounded-[4px]" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Skeleton className="h-[1px] w-full" />

          {/* Payment Summary Skeleton */}
          <Card className="light_bg_color border-color">
            <CardContent className="space-y-6 p-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
              <Skeleton className="h-[1px] w-full" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  </div>
  )
}

export default BookingDetailsPage