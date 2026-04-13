"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProviderDetails from "@/components/Provider/ProviderDetails";
import ProviderServiceDetails from "@/components/Provider/ProviderServiceDetails/ProviderServiceDetails";
import Loader from "@/components/ReUseableComponents/Loader";

const ProviderDetailsPage = () => {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { slug } = router.query;
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (!router.isReady) return;
  }, [router.isReady]);
  
  if (!mounted || !router.isReady) {
    return <Loader />;
  }
  
  return (
    <>
      {slug?.length > 1 ? (
        <ProviderServiceDetails />
      ) : (
        <ProviderDetails /> 
      )}
    </>
  );
};

export default ProviderDetailsPage;
