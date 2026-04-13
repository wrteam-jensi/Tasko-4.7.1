import React from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { darkThemeStyles, useGoogleMapsLoader, useIsDarkMode } from "@/utils/Helper";
import { FaCheckCircle} from "react-icons/fa";

const AddressCard = ({ data, onDelete, onEdit, t }) => {

  const { isLoaded, loadError } = useGoogleMapsLoader();

  const mapContainerStyle = {
    width: "100%",
    height: "150px",
    borderRadius: "12px 12px 0 0",
  };

  const defaultCenter = {
    lat: Number(data?.lattitude) || 0, // Replace with actual lattitude
    lng: Number(data?.longitude) || 0, // Replace with actual longitude
  };
  const isDarkMode = useIsDarkMode()

  return (
    <div
      className={`relative group border rounded-2xl p-4 ${data.isDefault ? "border_color" : ""
        } w-full h-full`}
    >
      {/* Map Section */}
      <div className="relative h-36 rounded-t-xl overflow-hidden">
        {loadError ? (
          <p className="text-sm text-red-500">Failed to load map</p>
        ) : isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={17}
            options={{
              streetViewControl: false,
              styles: isDarkMode ? darkThemeStyles : [],
            }}
  
          >
            <MarkerF position={defaultCenter} />
          </GoogleMap>
        ) : (
          <p className="text-sm description_color">{t("loadingMap")}</p>
        )}
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="card_bg py-1 px-3 rounded-md mx-2"
            onClick={onDelete}
          >
            {t("delete")}
          </button>
          <button
            className="card_bg py-1 px-3 rounded-md mx-2"
            onClick={onEdit}
          >
            {t("edit")}
          </button>
        </div>
      </div>
      {/* Address Details */}
      <div className="mt-4 flex flex-col lg:flex-row  md:items-end justify-between gap-2">
        <div className="flex flex-col items-start justify-center w-full">
          <span className="text-xl font-semibold">{data?.city_name || data?.city} - {data?.type}</span>
          <span className="text-sm description_color break-all line-clamp-2">{data?.area} {data?.address ? "," : ""} {data?.address}</span>
        </div>
        <div className="w-full lg:w-1/3">

          {data?.is_default === "1" ? (
            <div className="flex items-center justify-center gap-1 light_bg_color primary_text_color text-sm p-3 rounded-[8px]">
              <span>{t("default")}</span>
              <span>
                <FaCheckCircle size={18} />
              </span>
            </div>
          ) : ( null
            // <button className="background_color description_color text-sm p-3 rounded-[8px]">
            //   {t("setDefault")}
            // </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressCard;
