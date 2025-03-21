import React from "react";

const InsightSelector = ({
  selected,
  onChange,
  orderType,
  onOrderTypeChange,
}) => {
  return (
    <div className="mb-6">
      {/* Main Insight Select */}
      <label
        htmlFor="insight"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Select Insight
      </label>
      <select
        id="insight"
        name="insight"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-64 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="orders">Orders</option>
        <option value="recipe">Recipe</option>
        <option value="chef">Chef</option>
      </select>
    </div>
  );
};

export default InsightSelector;
