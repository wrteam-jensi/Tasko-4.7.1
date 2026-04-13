import CustomImageTag from "@/components/ReUseableComponents/CustomImageTag";

const OfferCard = ({ offer, actionLabel, onAction }) => (
    <div className="border border_color rounded-xl flex items-center justify-between gap-3 px-2 py-3 my-6">
        <div className="flex items-center gap-3 w-10/12">
            <div className="relative aspect-square w-16 flex-shrink-0">
                <CustomImageTag
                    src={offer?.image}
                    alt={offer?.promo_code}
                    className="w-full h-full rounded-md"
                    imgClassName="rounded-md"
                />
            </div>
            <div className="flex flex-col items-start justify-between mb-2">
                <h3 className="primary_color font-bold text-lg">{offer?.promo_code}</h3>
                <p className="description_color text-sm line-clamp-2">{offer?.message}</p>
            </div>
        </div>
        <div className="transition-all duration-150">
            <button
                onClick={onAction}
                className="light_bg_color primary_text_color text-base font-normal px-4 py-1 rounded-md dark:bg-white"
            >
                {actionLabel}
            </button>
        </div>
    </div>
);

export default OfferCard;
