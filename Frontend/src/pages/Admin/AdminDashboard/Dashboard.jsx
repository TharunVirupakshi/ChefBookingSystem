import React, { useState } from "react";
import InsightSelector from "../../../components/DashboardComponent/InsightSelector";
import OrdersChart from "../../../components/DashboardComponent/OrdersChart";

const Dashboard = () => {
  const [selectedInsight, setSelectedInsight] = useState("orders");
  const [orderType, setOrderType] = useState("all");

  const [ordersData, setOrdersData] = useState(); // Unused now but we can hook it later if needed
  const [revenue, setRevenue] = useState(); // Same here

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard Insights</h1>

      {/* Insight & Order Type Select */}
      <InsightSelector
        selected={selectedInsight}
        onChange={setSelectedInsight}
        orderType={orderType}
        onOrderTypeChange={setOrderType}
      />

      {/* Chart Section */}
      <div>
        <OrdersChart insightType={selectedInsight} />
      </div>
    </div>
  );
};

export default Dashboard;
