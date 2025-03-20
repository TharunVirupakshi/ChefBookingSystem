import React from "react";
import { Table, TableCell } from "flowbite-react";
import { useState } from "react";
import { useEffect } from "react";
import Toast from "../../../components/Toast/Toast";
import { HiPencil, HiTrash } from "react-icons/hi";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/orders", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setOrders(data);
      console.log("Orders:", data);
    } catch (error) {
      console.error("Error fetching recipes:", error.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);


  return (
    <div className="bg-white overflow-x-auto shadow-sm sm:rounded-lg">
      <div className="title flex justify-between p-9 items-center">
      <h2 className="text-lg font-bold text-gray-500">Orders</h2>
      <button
            type="button"
           
            className="flex items-center gap-1  text-secondary bg-amber-300 hover:bg-yellow-300 focus:ring-4 focus:ring-amber-300 font-medium rounded-lg text-sm px-3 py-2.5 me-2 mb-2 dark:bg-yellow-600 dark:hover:bg-yellow-700 focus:outline-none dark:focus:ring-yellow-800"
          >
            Add Order
          </button>
      </div>
      <Table striped>
          <Table.Head>
            <Table.HeadCell>Order Id</Table.HeadCell>
            <Table.HeadCell>Customer Id </Table.HeadCell>
            <Table.HeadCell>Chef Id</Table.HeadCell>
            <Table.HeadCell>Recipe Id</Table.HeadCell>
            <Table.HeadCell>OrderDate</Table.HeadCell>
            <Table.HeadCell>Start_Date_Time</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
            <Table.HeadCell>End_Date_Time</Table.HeadCell>
            <Table.HeadCell>Total Price</Table.HeadCell>
            <Table.HeadCell>Type</Table.HeadCell>   
          </Table.Head>
          <Table.Body className="divide-y">
            {orders.map((order, index) => (
              <Table.Row
                key={order.customer_id}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <TableCell>{order.order_id}</TableCell>
                <TableCell>{order.customer_id}</TableCell>
                <TableCell>{order.chef_id}</TableCell>
                <TableCell>{order.recipe_id}</TableCell>
                <TableCell>{order.order_date}</TableCell>
                <TableCell>{order.start_date_time}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{order.end_date_time}</TableCell>
                <TableCell>{order.total_price}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <button
                      // onClick={() => openEditModal(recipe.recipe_id, recipe)}
                      className="font-medium text-blue-600 hover:underline dark:text-cyan-500"
                    >
                      <HiPencil className="mx-auto mb-4 h-7 w-7 text-blue-500 dark:text-blue-600" />
                    </button>
                    <button
                      // onClick={() => handleDeleteRecipe(recipe.recipe_id)}
                      className="font-medium text-blue-600 hover:underline dark:text-cyan-500"
                    >
                      <HiTrash className="mx-auto mb-4 h-7 w-7 text-red-500 dark:text-red-600" />
                    </button>
                  </div>
                </TableCell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
    </div>
  )
}

export default ManageOrders