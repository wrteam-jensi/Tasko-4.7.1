import React from 'react'
import { Skeleton } from '../ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProviderDetailsServiceCardSkeleton from './ProviderDetailsServiceCardSkeleton';

const HeaderSkeleton = () => (
  <>
    {/* Top header */}
    <div className="w-full border-b border-gray-50 py-4">
      <div className="container flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>

    {/* Main header */}
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Skeleton className="h-8 w-32" />

        {/* Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>

        {/* Right side buttons */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </header>
  </>
);

const FooterSkeleton = () => (
  <footer className="border-t py-8 md:py-12">
    <div className="container grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {/* Footer columns */}
      {[1, 2, 3, 4].map((col) => (
        <div key={col} className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-4 w-32" />
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Bottom bar */}
    <div className="container mt-8 pt-8 border-t">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  </footer>
);

const ProviderDetailsSkeleton = () => {
  return (
    <>
      <HeaderSkeleton />
      <div className="min-h-screen flex flex-col py-6">
        <main className="flex-1">
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6">
              {/* Left Section */}
              <div className="col-span-12 lg:col-span-4">
                <div className="sticky top-36">
                  <div className="flex flex-col gap-4">
                    {/* Service Details Skeleton */}
                    <div className="rounded-[18px] bg-[#F5FAFF] dark:card_bg shadow-sm border border-gray-200 p-5">
                      <Skeleton className="w-full h-[220px] rounded-xl" />
                      <div className="flex items-start gap-3 mt-4">
                        <Skeleton className="w-14 h-14 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <Skeleton className="w-10 h-10 rounded-sm" />
                        <Skeleton className="w-10 h-10 rounded-sm" />
                        <Skeleton className="w-10 h-10 rounded-sm" />
                      </div>
                    </div>

                    {/* Photo Gallery Skeleton */}
                    <div className="light_bg_color rounded-lg overflow-hidden mt-4 p-5">
                      <Skeleton className="h-6 w-20 mb-4" />
                      <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-[80px] rounded-md w-full" />
                        <Skeleton className="h-[80px] rounded-md w-full" />
                        <Skeleton className="h-[80px] rounded-md w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="col-span-12 lg:col-span-8">
                <Tabs className="w-full" defaultValue="services">
                  <TabsList className="light_bg_color rounded-md w-full flex flex-wrap sm:flex-nowrap items-center gap-3 py-3 px-2 h-full">
                    {[...Array(4)].map((_, index) => (
                      <Skeleton key={index} className="h-10 w-full rounded-md" />
                    ))}
                  </TabsList>

                  <TabsContent value="services">
                    <div className="space-y-4">
                      {[...Array(6)].map((_, index) => (
                        <ProviderDetailsServiceCardSkeleton key={index} />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="about">
                    <Skeleton className="h-20 w-full" />
                  </TabsContent>

                  <TabsContent value="reviews">
                    <div className="space-y-4">
                      {[...Array(2)].map((_, index) => (
                        <div key={index} className="p-4 border rounded-md shadow-sm">
                          <Skeleton className="h-4 w-2/3 mb-2" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="offers">
                    <Skeleton className="h-20 w-full" />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>
        </main>
      </div>
        <FooterSkeleton />
    </>
  )
}

export default ProviderDetailsSkeleton
