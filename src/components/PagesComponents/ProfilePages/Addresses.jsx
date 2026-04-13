"use client";
import ProfileLayout from "@/components/Layout/ProfileLayout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import React, { useState, useEffect } from "react";
import AddressCard from "@/components/Cards/AddressCard";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { DeleteAddressApi, getAddressApi } from "@/api/apiRoutes";
import { toast } from "sonner";
import AddressDrawer from "@/components/ReUseableComponents/Drawers/AddressDrawer";
import withAuth from "@/components/Layout/withAuth";
import NoDataFound from "@/components/ReUseableComponents/Error/NoDataFound";
import { FaCirclePlus } from "react-icons/fa6";
import AddressCardSkeleton from "@/components/Skeletons/AddressCardSkeleton";
import { logClarityEvent } from "@/utils/clarityEvents";
import { AUTH_EVENTS } from "@/constants/clarityEventNames";

const Addresses = () => {
  const t = useTranslation();

  const [addresses, setAddresses] = useState([]);
  const [addressDrawerOpen, setAddressDrawerOpen] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  const fetchAddresses = async () => {
    setLoading(true); // Set loading to true when starting fetch
    try {
      const response = await getAddressApi();
      if (response.error === false) {
        // Sort addresses to show default addresses first
        const sortedAddresses = response.data.sort((a, b) => {
          return b.is_default - a.is_default; // This will put is_default="1" first
        });
        setAddresses(sortedAddresses);
      }
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    } finally {
      setLoading(false); // Set loading to false when fetch completes
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDeleteAddress = async (id) => {
    try {
      const response = await DeleteAddressApi({ address_id: id });
      if (response.error === false) {
        setAddresses(addresses.filter((address) => address.id !== id));
        toast.success(response.message);
        logClarityEvent(AUTH_EVENTS.ADDRESS_DELETED, {
          address_id: id,
        });
      }
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleEditAddress = (id) => {
    setDefaultAddress(addresses.find((address) => address.id === id));
    setAddressDrawerOpen(true);
  };

  const handleUpdateAddress = (updatedAddress) => {
    setAddresses((prevAddresses) =>
      prevAddresses.map((address) => {
        if (address.id === updatedAddress.id) {
          // Update the edited address
          return updatedAddress;
        } else if (
          updatedAddress.is_default === "1" &&
          address.is_default === "1"
        ) {
          // If the updated address is set as default, ensure no other address remains default
          return { ...address, is_default: "0" };
        } else {
          // Return the address as is
          return address;
        }
      })
    );
  };

  return (
    <ProfileLayout
      breadcrumbTitle={t("addresses")}
      breadcrumbLink="/addresses"
    >
      <div className="flex flex-col gap-6 border-b pb-3 md:pb-0 md:border-none">
        <div className="flex items-center justify-between w-full">
          <div className="page-headline text-lg md:text-2xl sm:text-3xl font-semibold">
            <span>{t("myAddresses")}</span>
          </div>
          {/* {addresses.length === 0 && */}
          <div>

            <button
              onClick={() => {
                setDefaultAddress(null); // Clear any existing default address
                setAddressDrawerOpen(true);

              }}
              className="mt-2 w-full border border-dashed border_color flex items-center justify-center gap-3 primary_text_color p-2 md:p-4 rounded-xl"
            >
              <span>
                <FaCirclePlus size={22} />
              </span>
              <span>{t("addAddress")}</span>
            </button>
          </div>
          {/* } */}
        </div>
        {/* Responsive Grid for Address Cards */}
        {loading ? (
          // Show skeleton loaders while data is being fetched
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {[...Array(4)].map((_, index) => (
              <AddressCardSkeleton key={index} />
            ))}
          </div>
        ) : addresses.length > 0 ? (
          // Show address cards when data is loaded
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {addresses?.map((address, index) => (
              <AddressCard
                key={index}
                data={address}
                onDelete={() => handleDeleteAddress(address.id)}
                onEdit={() => handleEditAddress(address.id)}
                t={t}
              />
            ))}
          </div>
        ) : (
          // Show "No Data Found" only when loading is complete and there's no data
          <div className="w-full h-[60vh] flex items-center justify-center">
            <NoDataFound
              title={t("noAddressesFound")}
              desc={t("noAddressesText")}
            />
          </div>
        )}
      </div>
      {addressDrawerOpen && (
        <AddressDrawer
          addresses={addresses}
          setAddresses={setAddresses}
          open={addressDrawerOpen}
          onClose={() => setAddressDrawerOpen(false)}
          defaultAddress={defaultAddress}
          setDefaultAddress={setDefaultAddress}
          onUpdateAddress={handleUpdateAddress} // Pass the update function
        />
      )}
    </ProfileLayout>
  );
};

export default withAuth(Addresses);
