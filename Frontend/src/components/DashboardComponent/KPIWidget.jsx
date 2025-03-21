import React from "react";

const KPIWidget = ({ title, value }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow text-center">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

export default KPIWidget;
