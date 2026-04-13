import React from 'react'
import CommanHeadline from '../ReUseableComponents/CommanHeadline';
import { Swiper, SwiperSlide } from "swiper/react";
import 'swiper/css';
import { Autoplay, FreeMode } from 'swiper/modules';
import ProviderCard from '../Cards/ProviderCard';
import { useRTL } from '@/utils/Helper';

const PopularProvider = () => {

    const isRTL = useRTL();
    const providers = [
        {
            name: "PlumbService Pvt Ltd",
            location: "Katira Complex, B/A, Sanskar Nagar",
            rating: 4.8,
            orders: 150,
            services: ["Water Leaks", "Bathroom Installation", "+6"],
            imageUrl: "",
        },
        {
            name: "Piston Car Service",
            location: "Katira Complex, B/A, Sanskar Nagar",
            rating: 4.6,
            orders: 143,
            services: ["Car Repair", "Car Wash", "+8"],
            imageUrl: "",
        },
        {
            name: "The Barber Shop",
            location: "Katira Complex, B/A, Sanskar Nagar",
            rating: 4.3,
            orders: 140,
            services: ["Women Hair Highlights", "Pedicure", "+12"],
            imageUrl: "",
        },
        {
            name: "The Barber Shop",
            location: "Katira Complex, B/A, Sanskar Nagar",
            rating: 4.3,
            orders: 140,
            services: ["Women Hair Highlights", "Pedicure", "+12"],
            imageUrl: "",
        },
        {
            name: "The Barber Shop",
            location: "Katira Complex, B/A, Sanskar Nagar",
            rating: 4.3,
            orders: 140,
            services: ["Women Hair Highlights", "Pedicure", "+12"],
            imageUrl: "",
        },
    ];
    const breakpoints = {
        320: {
            slidesPerView: 1,
        },
        375: {
            slidesPerView: 1.2,
        },
        576: {
            slidesPerView: 1.5,
        },
        768: {
            slidesPerView: 1.5,
        },
        992: {
            slidesPerView: 1.7,
        },
        1200: {
            slidesPerView: 2,
        },
        1400: {
            slidesPerView: 2.5,
        },
        1600: {
            slidesPerView:3,
        },
    };

    return (
        <div className='py-8'>
            <div className='container mx-auto px-4 md:px-8'>
                <CommanHeadline
                    headline={"Popular Providers"}
                    subHeadline={"Get Quality Services with our"}
                    link={""}
                />
                <div>
                    <Swiper
                        dir={isRTL ? "rtl" : "ltr"}
                        modules={[Autoplay, FreeMode]} // Include FreeMode module
                        spaceBetween={30}
                        loop={true}
                        key={isRTL}
                        autoplay={{ delay: 3000 }} // Autoplay functionality
                        freeMode={true} // Enable free mode
                        breakpoints={breakpoints} // Add breakpoints here
                        className="mySwiper"
                    >
                        {providers.map(provider => (
                            <SwiperSlide key={provider.id}>
                                <ProviderCard provider={provider} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

            </div>
        </div>
    )
}

export default PopularProvider