import React from "react";
import { noDataFoundImage } from "./Images";

const NoDataFound = ({ title, desc }) => {

  return (
    <div className="flex flex-col items-center justify-center gap-3 max-w-3xl">
      {noDataFoundImage}
      <div className="text-center">
        <h1 className="text-3xl">{title}</h1>
        <p className="text-sm">{desc}</p>
      </div>
    </div>
  );
};

export default NoDataFound;
