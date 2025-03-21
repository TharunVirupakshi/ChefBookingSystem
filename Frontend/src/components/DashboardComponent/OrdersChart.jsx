import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import APIService from "../../API/APIService";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a52a2a"];

const OrdersChart = ({ insightType }) => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedOrderType, setSelectedOrderType] = useState("ALL");

  const [recipesData, setRecipesData] = useState([]);
  const [chefsData, setChefsData] = useState([]);

  const [mostOrderedRecipe, setMostOrderedRecipe] = useState(null);
  const [leastOrderedRecipe, setLeastOrderedRecipe] = useState(null);
  const [mostOrdersChef, setMostOrdersChef] = useState(null);
  const [leastOrdersChef, setLeastOrdersChef] = useState(null);

  // Fetch orders when insight type or order type changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await APIService.getOrderInsights();
        const rawOrders = response.orders || [];

        setOrdersData(rawOrders);

        const filteredOrders = getFilteredOrders(rawOrders);

        if (insightType === "recipe") {
          const recipes = await aggregateOrdersByRecipe(filteredOrders);
          setRecipesData(recipes);

          setMostOrderedRecipe(
            recipes.reduce(
              (max, current) =>
                current.value > (max?.value || 0) ? current : max,
              null
            )
          );

          setLeastOrderedRecipe(
            recipes.reduce(
              (min, current) =>
                min === null || current.value < min.value ? current : min,
              null
            )
          );
        }

        if (insightType === "chef") {
          const chefs = await aggregateOrdersByChef(filteredOrders);
          setChefsData(chefs);

          setMostOrdersChef(
            chefs.reduce(
              (max, current) =>
                current.value > (max?.value || 0) ? current : max,
              null
            )
          );

          setLeastOrdersChef(
            chefs.reduce(
              (min, current) =>
                min === null || current.value < min.value ? current : min,
              null
            )
          );
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [insightType, selectedOrderType]);

  const getFilteredOrders = (orders = ordersData) => {
    if (selectedOrderType === "ALL") return orders;
    return orders.filter(
      (order) => order.type?.toUpperCase() === selectedOrderType
    );
  };

  // Aggregation Functions
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

  const aggregateOrdersByRecipe = async (orders) => {
    const result = {};
    for (const order of orders) {
      const recipeId = order.recipe_id || "Unknown";
      const recipe = await APIService.fetchRecipesByRecipeId(recipeId);
      const recipeName = recipe?.title || `Recipe ${recipeId}`;

      result[recipeName] = (result[recipeName] || 0) + 1;
    }

    return Object.entries(result).map(([recipe, count]) => ({
      recipe,
      value: count,
    }));
  };

  const aggregateOrdersByChef = async (orders) => {
    const result = {};
    for (const order of orders) {
      const chefId = order.chef_id || "Unknown";
      const chef = await APIService.fetchChefById(chefId);
      const chefName = chef?.full_name || `Chef ${chefId}`;

      result[chefName] = (result[chefName] || 0) + 1;
    }

    return Object.entries(result).map(([chef, count]) => ({
      chef,
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

  // Derived Data
  const filteredOrders = getFilteredOrders();
  const ordersByMonth = aggregateOrdersByMonth(filteredOrders);

  const availableYears = Array.from(
    new Set(ordersByMonth.map((entry) => entry.year))
  ).sort((a, b) => b - a);

  const filteredOrdersData =
    selectedYear === "All"
      ? ordersByMonth
      : ordersByMonth.filter((entry) => entry.year === parseInt(selectedYear));

  const orderTypeData = aggregateOrdersByType(filteredOrders);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {/* Order Type Filter */}
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

      {/* Orders Insight */}
      {insightType === "orders" && (
        <div>
          {/* Year Filter */}
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
                    filteredOrdersData.reduce(
                      (max, current) =>
                        current.orders > (max?.orders || 0) ? current : max,
                      null
                    )?.month
                  }{" "}
                  {
                    filteredOrdersData.reduce(
                      (max, current) =>
                        current.orders > (max?.orders || 0) ? current : max,
                      null
                    )?.year
                  }{" "}
                  (
                  {
                    filteredOrdersData.reduce(
                      (max, current) =>
                        current.orders > (max?.orders || 0) ? current : max,
                      null
                    )?.orders
                  }{" "}
                  orders)
                </strong>
              </p>
              <p>
                📉 Month with least orders:{" "}
                <strong>
                  {
                    filteredOrdersData.reduce(
                      (min, current) =>
                        min === null || current.orders < min.orders
                          ? current
                          : min,
                      null
                    )?.month
                  }{" "}
                  {
                    filteredOrdersData.reduce(
                      (min, current) =>
                        min === null || current.orders < min.orders
                          ? current
                          : min,
                      null
                    )?.year
                  }{" "}
                  (
                  {
                    filteredOrdersData.reduce(
                      (min, current) =>
                        min === null || current.orders < min.orders
                          ? current
                          : min,
                      null
                    )?.orders
                  }{" "}
                  orders)
                </strong>
              </p>
            </div>
          )}

          {/* Pie Chart */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "40px",
            }}
          >
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
        </div>
      )}

      {/* Recipe Insight */}
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "40px",
            }}
          >
            <PieChart width={700} height={500}>
              <Pie
                data={recipesData}
                cx="50%"
                cy="50%"
                outerRadius={200}
                dataKey="value"
                nameKey="recipe"
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  index,
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="black"
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      style={{ fontSize: "12px" }}
                    >
                      {`${recipesData[index].recipe}: ${recipesData[index].value} orders`}
                    </text>
                  );
                }}
                labelLine={false}
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
        </div>
      )}

      {/* Chef Insight */}
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

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "40px",
            }}
          >
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
        </div>
      )}
    </div>
  );
};

export default OrdersChart;
