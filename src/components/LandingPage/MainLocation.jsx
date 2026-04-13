"use client";
import { useState, useEffect } from "react";
import LocationModal from "../ReUseableComponents/LocationModal";
import { useDispatch } from "react-redux";
import { setIsBrowserSupported } from "@/redux/reducers/locationSlice";
import SearchLocationBox from "../ReUseableComponents/SearchLocationBox/SearchLocationBox";
import { useTranslation } from "../Layout/TranslationContext";
const MainLocation = ({ landingPageBg, landingPageLogo, title }) => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const handleClose = () => setIsModalOpen(false);

  // Handle current location detection from SearchLocationBox
  const handleCurrentLocationDetected = (location) => {
    setCurrentLocation(location);
  };

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    } else {
      console.log("This browser does not support desktop notifications.");
    }

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      dispatch(setIsBrowserSupported(false));
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          dispatch(setIsBrowserSupported(true));
        },
        (error) => {
          console.error("Geolocation error:", error);
          dispatch(setIsBrowserSupported(true));
        },
      );
    } else {
      console.log("Geolocation not supported");
      dispatch(setIsBrowserSupported(true));
    }
  }, [dispatch]);

  return (
    <>


      <section>
        <div className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[800px]">
          <div
            className="main_bg relative h-full bg-cover bg-no-repeat bg-center"
            style={{ backgroundImage: `url(${landingPageBg})` }}
          >
            <div className="absolute inset-0 bg-black opacity-60"></div>

            <div className="container relative mx-auto h-full w-full">
              <div className="searchbox absolute top-[50%] left-0 right-0 transform -translate-y-1/2 mx-auto flex items-center justify-center border-none h-auto z-10">
                <div className="detail flex flex-col items-center justify-center px-4">
                  <span className="text-[24px] sm:text-[28px] md:text-[32px] lg:text-[40px] xl:text-[50px] font-extrabold text-white text-center w-full md:w-[80%] lg:w-[60%] block">
                    {title}
                  </span>
                  <div className="w-full max-w-[600px]">
                    <SearchLocationBox
                      isModalOpen={isModalOpen}
                      setIsModalOpen={setIsModalOpen}
                      onCurrentLocationDetected={handleCurrentLocationDetected}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {isModalOpen && (
        <LocationModal
          open={isModalOpen}
          onClose={handleClose}
          redirectToHome={true} // ✅ New: Redirect to home page when location is confirmed
          forceChooseAddressOnOpen={true}
          initialLocation={currentLocation} // ✅ Pass current location to modal
        />
      )}
    </>
  );
};

export default MainLocation;
