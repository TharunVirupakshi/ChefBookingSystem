import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import APIService from "../../API/APIService";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a52a2a"];

const OrdersChart = ({ insightType }) => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedOrderType, setSelectedOrderType] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await APIService.getOrderInsights();
        const rawOrders = response.orders || [];

        setOrdersData(rawOrders);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [insightType]);

  // Filter orders based on selected order type
  const getFilteredOrders = () => {
    if (selectedOrderType === "ALL") return ordersData;
    return ordersData.filter(
      (order) => order.type?.toUpperCase() === selectedOrderType
    );
  };

  const filteredOrders = getFilteredOrders();

  // Aggregation functions
  const aggregateOrdersByMonth = (orders) => {
    const result = {};
    orders.forEach((order) => {
      const date = new Date(order.order_date);
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      const key = `${month}-${year}`;
      result[key] = (result[key] || 0) + 1;
    });

    return Object.entries(result).map(([monthYear, orders]) => {
      const [month, year] = monthYear.split("-");
      return { month, year: parseInt(year), orders };
    });
  };

  const aggregateOrdersByRecipe = (orders) => {
    const result = {};
    orders.forEach((order) => {
      const recipeId = order.recipe_id || "Unknown Recipe";
      result[recipeId] = (result[recipeId] || 0) + 1;
    });

    return Object.entries(result).map(([recipeId, count]) => ({
      recipe: `Recipe ${recipeId}`,
      value: count,
    }));
  };
  const aggregateOrdersByChef = (orders) => {
    const result = {};
    orders.forEach((order) => {
      const chefId = order.chef_id || "Unknown Chef";
      result[chefId] = (result[chefId] || 0) + 1;
    });

    return Object.entries(result).map(([chefId, count]) => ({
      chef: `Chef ${chefId}`,
      value: count,
    }));
  };

  const aggregateOrdersByType = (orders) => {
    const result = {};
    orders.forEach((order) => {
      const type = order.type || "UNKNOWN";
      result[type] = (result[type] || 0) + 1;
    });

    return Object.entries(result).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  };

  // Derived data
  const ordersByMonth = aggregateOrdersByMonth(filteredOrders);
  const availableYears = Array.from(
    new Set(ordersByMonth.map((entry) => entry.year))
  ).sort((a, b) => b - a);

  const filteredOrdersData =
    selectedYear === "All"
      ? ordersByMonth
      : ordersByMonth.filter((entry) => entry.year === parseInt(selectedYear));

  const recipesData = aggregateOrdersByRecipe(filteredOrders);
  const orderTypeData = aggregateOrdersByType(filteredOrders);

  const mostOrderedRecipe = recipesData.reduce((max, current) => {
    return current.value > (max?.value || 0) ? current : max;
  }, null);

  const leastOrderedRecipe = recipesData.reduce((min, current) => {
    return min === null || current.value < min.value ? current : min;
  }, null);

  const chefsData = aggregateOrdersByChef(filteredOrders);

  const mostOrdersChef = chefsData.reduce((max, current) => {
    return current.value > (max?.value || 0) ? current : max;
  }, null);

  const leastOrdersChef = chefsData.reduce((min, current) => {
    return min === null || current.value < min.value ? current : min;
  }, null);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {/* Order Type Selector (Visible for all insights) */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="order-type-select">Filter by Order Type: </label>
        <select
          id="order-type-select"
          value={selectedOrderType}
          onChange={(e) => setSelectedOrderType(e.target.value)}
        >
          <option value="ALL">ALL</option>
          <option value="ADVANCE">ADVANCE</option>
          <option value="INSTANT">INSTANT</option>
        </select>
      </div>

      {insightType === "orders" && (
        <div>
          {/* Year Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="year-select">Filter by Year: </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="All">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          {filteredOrdersData.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <p>
                📈 Month with most orders:{" "}
                <strong>
                  {
                    filteredOrdersData.reduce((max, current) => {
                      return current.orders > (max?.orders || 0)
                        ? current
                        : max;
                    }, null)?.month
                  }{" "}
                  {
                    filteredOrdersData.reduce((max, current) => {
                      return current.orders > (max?.orders || 0)
                        ? current
                        : max;
                    }, null)?.year
                  }{" "}
                  (
                  {
                    filteredOrdersData.reduce((max, current) => {
                      return current.orders > (max?.orders || 0)
                        ? current
                        : max;
                    }, null)?.orders
                  }{" "}
                  orders)
                </strong>
              </p>
              <p>
                📉 Month with least orders:{" "}
                <strong>
                  {
                    filteredOrdersData.reduce((min, current) => {
                      return min === null || current.orders < min.orders
                        ? current
                        : min;
                    }, null)?.month
                  }{" "}
                  {
                    filteredOrdersData.reduce((min, current) => {
                      return min === null || current.orders < min.orders
                        ? current
                        : min;
                    }, null)?.year
                  }{" "}
                  (
                  {
                    filteredOrdersData.reduce((min, current) => {
                      return min === null || current.orders < min.orders
                        ? current
                        : min;
                    }, null)?.orders
                  }{" "}
                  orders)
                </strong>
              </p>
            </div>
          )}

          <PieChart width={600} height={400}>
            <Pie
              data={filteredOrdersData}
              cx="50%"
              cy="50%"
              outerRadius={150}
              dataKey="orders"
              nameKey="month"
              label={({ month, orders, percent }) =>
                `${month}: ${orders} orders (${(percent * 100).toFixed(0)}%)`
              }
              fill="#8884d8"
            >
              {filteredOrdersData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      )}

      {insightType === "recipe" && (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <p>
              🍽️ Most Ordered Recipe:{" "}
              <strong>
                {mostOrderedRecipe?.recipe} ({mostOrderedRecipe?.value} orders)
              </strong>
            </p>
            <p>
              🥄 Least Ordered Recipe:{" "}
              <strong>
                {leastOrderedRecipe?.recipe} ({leastOrderedRecipe?.value}{" "}
                orders)
              </strong>
            </p>
          </div>

          <PieChart width={600} height={400}>
            <Pie
              data={recipesData}
              cx="50%"
              cy="50%"
              outerRadius={150}
              dataKey="value"
              nameKey="recipe"
              label={({ recipe, value, percent }) =>
                `${recipe}: ${value} orders (${(percent * 100).toFixed(0)}%)`
              }
              fill="#8884d8"
            >
              {recipesData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      )}

      {insightType === "chef" && (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <p>
              👨‍🍳 Chef with Most Orders:{" "}
              <strong>
                {mostOrdersChef?.chef} ({mostOrdersChef?.value} orders)
              </strong>
            </p>
            <p>
              👨‍🍳 Chef with Least Orders:{" "}
              <strong>
                {leastOrdersChef?.chef} ({leastOrdersChef?.value} orders)
              </strong>
            </p>
          </div>

          <PieChart width={600} height={400}>
            <Pie
              data={chefsData}
              cx="50%"
              cy="50%"
              outerRadius={150}
              dataKey="value"
              nameKey="chef"
              label={({ chef, value, percent }) =>
                `${chef}: ${value} orders (${(percent * 100).toFixed(0)}%)`
              }
              fill="#8884d8"
            >
              {chefsData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      )}
    </div>
  );
};

export default OrdersChart;
