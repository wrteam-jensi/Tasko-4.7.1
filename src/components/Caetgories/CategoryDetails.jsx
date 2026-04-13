"use client";
import {
  getProviders,
  getSubCategory,
  getParentCategorySlugApi,
} from "@/api/apiRoutes";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "swiper/css";
import { Autoplay, FreeMode, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { addCategory } from "../../redux/reducers/multiCategoriesSlice";
import BlurredServiceCard from "../Cards/BlurredServiceCard";
import NearbyProviderCard from "../Cards/NearbyProviderCard";
import Layout from "../Layout/Layout";
import CategoryBreadcrumb from "../ReUseableComponents/CategoryBreadcrumb";
import BlurredServiceCardSkeleton from "../Skeletons/BlurredServiceCardSkeleton";
import NearbyProviderCardSkeleton from "../Skeletons/NearbyProviderCardSkeleton";
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import { useTranslation } from "../Layout/TranslationContext";
import { useRTL } from "@/utils/Helper";
import CustomLink from "../ReUseableComponents/CustomLink";
import { useQuery } from "@tanstack/react-query";
import { buildLanguageAwareKey } from "@/lib/react-query-client";

const CategoryDetails = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const t = useTranslation();
  const isRTL = useRTL();
  const { catslug } = router.query;

  // Get slug dynamically
  const slug = router.query.slug;
  const lastSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;

  const locationData = useSelector((state) => state?.location);
  const selectedCategories = useSelector(
    (state) => state.multiCategories.selectedCategories
  );
  const currentCategory = selectedCategories.find(
    (cat) => cat?.slug === lastSlug
  );
  const currentCategoryTranslatedName = currentCategory
    ? currentCategory?.translated_name
    : currentCategory?.name;
  const currentCategoryName = currentCategory
    ? currentCategoryTranslatedName
    : lastSlug;

  // Query for subcategories
  const { data: subCategoriesData, isLoading: isLoadingSubCategories } =
    useQuery({
      queryKey: buildLanguageAwareKey([
        "subCategories",
        locationData?.lat,
        locationData?.lng,
        lastSlug,
      ]),
      queryFn: async () => {
        const response = await getSubCategory({
          latitude: locationData?.lat,
          longitude: locationData?.lng,
          slug: lastSlug,
        });
        return response;
      },
      enabled:
        !!locationData?.lat &&
        !!locationData?.lng &&
        !!lastSlug &&
        router.isReady,
    });

  // Query for providers
  const { data: providersData, isLoading: isLoadingProviders } = useQuery({
    queryKey: buildLanguageAwareKey([
      "categoryProviders",
      locationData?.lat,
      locationData?.lng,
      lastSlug,
    ]),
    queryFn: async () => {
      const response = await getProviders({
        latitude: locationData?.lat,
        longitude: locationData?.lng,
        category_slug: lastSlug,
      });
      return response;
    },
    enabled:
      !!locationData?.lat &&
      !!locationData?.lng &&
      !!lastSlug &&
      router.isReady,
  });

  // Query for parent categories
  useQuery({
    queryKey: buildLanguageAwareKey(["parentCategories", lastSlug]),
    queryFn: async () => {
      const response = await getParentCategorySlugApi({ slug: lastSlug });

      if (response?.error === false && response?.data?.length > 0) {
        const categoryData = response.data[0];

        // Clear existing categories
        dispatch({ type: "multiCategories/clearCategories" });

        // Add parent categories
        if (categoryData.parent_categories) {
          categoryData.parent_categories.forEach((parent) => {
            dispatch(addCategory(parent));
          });
        }

        // Add current category with complete data
        dispatch(addCategory(categoryData));
      }
      return response;
    },
    enabled: !!lastSlug && router.isReady,
    staleTime: 10 * 60 * 1000, // Parent categories stay fresh longer
  });

  const handleRouteCategory = (category) => {
    const isCategorySelected = selectedCategories.some(
      (cat) => cat?.slug === category?.slug
    );

    if (!isCategorySelected) {
      // Pass the complete category object to store all data
      dispatch(addCategory(category));
      router.push(`${pathname}/${category?.slug}`);
    }
  };

  const breakpoints = {
    320: { slidesPerView: 1 },
    375: { slidesPerView: 1.5 },
    576: { slidesPerView: 2 },
    768: { slidesPerView: 2.5 },
    992: { slidesPerView: 3 },
    1200: { slidesPerView: 3.5 },
    1400: { slidesPerView: 4 },
    1600: { slidesPerView: 4.5 },
  };

  const isLoading = isLoadingSubCategories || isLoadingProviders;
  const subCategories = subCategoriesData?.data || [];
  const subCatTotal = subCategoriesData?.total || 0;
  const providers = providersData?.data || [];
  const providerstTotal = providersData?.total || 0;

  return (
    <Layout>
      <CategoryBreadcrumb selectedCategories={selectedCategories} />
      <section className="category-details">
        <div className="container mx-auto">
          <div className="sub-cateSec">
            {isLoadingSubCategories ||
            (subCategories && subCategories.length > 0) ? (
              <>
                <div className="commanSec mt-12 flex flex-col items-start justify-center gap-6 w-full">
                  <div className="Headlines flex flex-col w-full">
                    <span className="text-2xl font-semibold">
                      {t("categoriesIn")} {currentCategoryName}
                    </span>
                    <span className="description_color">
                      {subCatTotal} {t("subCategories")}
                    </span>
                  </div>
                </div>
                <div className="sub-cate-swiper my-6">
                  <Swiper
                    key={isRTL}
                    modules={[Autoplay, FreeMode, Navigation, Pagination]}
                    pagination={{ clickable: true }}
                    spaceBetween={30}
                    loop={false}
                    autoplay={{ delay: 3000 }}
                    freeMode={true}
                    breakpoints={breakpoints}
                    dir={isRTL ? "rtl" : "ltr"}
                    className="mySwiper"
                  >
                    {isLoadingSubCategories
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <SwiperSlide key={`skeleton-${index}`}>
                            <BlurredServiceCardSkeleton />
                          </SwiperSlide>
                        ))
                      : subCategories?.map((service) => (
                          <SwiperSlide key={service.id}>
                            <BlurredServiceCard
                              elem={service}
                              handleRouteChange={handleRouteCategory}
                            />
                          </SwiperSlide>
                        ))}
                  </Swiper>
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div className="providerSec">
          {isLoadingProviders || (providers && providers?.length > 0) ? (
            <>
              <div className="commanSec mt-12 flex flex-col items-start justify-center gap-6 w-full container mx-auto">
                <div className="Headlines flex flex-col w-full">
                  <span className="text-2xl font-semibold">
                    {t("providersIn")} {currentCategoryName}
                  </span>
                  <span className="description_color">
                    {providerstTotal}{" "}
                    {providerstTotal === 1 ? t("provider") : t("providers")}
                  </span>
                </div>
              </div>
              <div className="commanDataSec light_bg_color p-4 w-full mt-6">
                <div className="container mx-auto py-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoadingProviders
                      ? Array.from({ length: 6 }).map((_, index) => (
                          <div key={`skeleton-${index}`}>
                            <NearbyProviderCardSkeleton />
                          </div>
                        ))
                      : providers.map((provider, index) => (
                          <div key={provider.id || index}>
                            <CustomLink
                              href={`/provider-details/${provider?.slug}`}
                              title={provider?.name}
                            >
                              <NearbyProviderCard provider={provider} />
                            </CustomLink>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
              {providers?.length > 6 && (
                <div className="loadmore my-6 flex items-center justify-center">
                  <button className="light_bg_color primary_text_color py-3 px-8 rounded-xl">
                    {t("loadMore")}
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* No Data Found */}
        {!isLoading && !subCategories?.length && !providers?.length && (
          <div className="no-data-found my-12 flex flex-col items-center justify-center">
            <NoDataFound title={t("noDataFound")} desc={t("noDataFoundText")} />
          </div>
        )}
      </section>
    </Layout>
  );
};

export default CategoryDetails;
