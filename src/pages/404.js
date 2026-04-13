
import React from 'react';
import dynamic from 'next/dynamic';
const PageNotFound = dynamic(() => import("@/components/ReUseableComponents/Error/PageNotFound"), { ssr: false });

const NotFoundPage = () => {

  return (
    <PageNotFound />
  );
};

export default NotFoundPage;