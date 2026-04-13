"use client"
import React from 'react'
import CustomImageTag from '../ReUseableComponents/CustomImageTag'

const ServiceCard = ({ data }) => {
    return (
        <>
            <div className="service_card light_bg_color py-[34px] px-[30px] rounded-[20px] flex flex-col gap-3 items-center justify-center h-[230px] w-full text-center">
                <div className="service_item_img_div bg-white rounded-[14px] p-1">
                <CustomImageTag 
                src={data?.image} 
                alt={data?.name}
                className='w-[80px] aspect-square' 
                />
                </div>
                <div className="service_title font-bold text-base w-1/2 text-center">
                    <span>
                        {data?.name}
                    </span>
                </div>
            </div>
        </>
    )
}

export default ServiceCard