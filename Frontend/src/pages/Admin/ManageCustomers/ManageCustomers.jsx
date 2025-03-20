import React from "react";
import { Table, TableCell } from "flowbite-react";
import { useState } from "react";
import { useEffect } from "react";
import Toast from "../../../components/Toast/Toast";
import { HiPencil, HiTrash } from "react-icons/hi";
import { initFlowbite } from "flowbite";

const ManageCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

useEffect(()=>{
  initFlowbite()
},[])
  const showToast = (type, message) => {
    setToast({ type, message });
    setIsToastVisible(true);
    // Auto-hide the toast after a few seconds
    // Clear any existing timeout to prevent multiple timeouts
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    // Set a new timeout
    const newTimeoutId = setTimeout(() => {
      setIsToastVisible(false);
      setToast({ type: "", message: "" });
    }, 10000);

    setTimeoutId(newTimeoutId);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/customers", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setCustomers(data);
      console.log("Customers:", data);
    } catch (error) {
      console.error("Error fetching recipes:", error.message);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);


  return (
    <div className="bg-white overflow-x-auto shadow-sm sm:rounded-lg">
      <div className="title flex justify-between p-9 items-center">
      <h2 className="text-lg font-bold text-gray-500">Customers</h2>
      <button
            type="button"
           
            className="flex items-center gap-1  text-secondary bg-amber-300 hover:bg-yellow-300 focus:ring-4 focus:ring-amber-300 font-medium rounded-lg text-sm px-3 py-2.5 me-2 mb-2 dark:bg-yellow-600 dark:hover:bg-yellow-700 focus:outline-none dark:focus:ring-yellow-800"
          >
            Add Customer
          </button>
      </div>
      <Table striped>
          <Table.Head>
            <Table.HeadCell>Customer Id</Table.HeadCell>
            <Table.HeadCell>Full name</Table.HeadCell>
            <Table.HeadCell>Email</Table.HeadCell>
            <Table.HeadCell>Phone Number</Table.HeadCell>
            <Table.HeadCell>Address</Table.HeadCell>
            <Table.HeadCell>Action</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {customers.map((customer, index) => (
              <Table.Row
                key={customer.customer_id}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <TableCell>{customer.customer_id}</TableCell>
                <TableCell>{customer.full_name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone_number}</TableCell>
                <TableCell>{customer.address}</TableCell>
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

export default ManageCustomers