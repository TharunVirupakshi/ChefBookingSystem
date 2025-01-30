import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
//   const { id: req_id } = useParams();

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       try {
//         console.log("Request ID:", req_id);
//         const response = await fetch(
//           `http://localhost:3000/api/orders/${req_id}`
//         );
//         if (response.ok) {
//           const data = await response.json();
//           setOrders(data);
//         } else {
//           console.error("Failed to fetch orders");
//         }
//       } catch (error) {
//         console.error("Error fetching orders:", error);
//       }
//     };

//     if (req_id) {
//       fetchOrderDetails();
//     }
//   }, [req_id]);

//   if (orders.length === 0) {
//     return <p>Loading orders...</p>;
//   }

  return (
    <div className="container mx-auto my-6">
      <Table striped>
        <TableHead>
          <TableHeadCell>Order ID</TableHeadCell>
          <TableHeadCell>Recipe ID</TableHeadCell>
          <TableHeadCell>Order Date</TableHeadCell>
          <TableHeadCell>Total Price</TableHeadCell>
          <TableHeadCell>Start Date/Time</TableHeadCell>
          <TableHeadCell>Type</TableHeadCell>
          <TableHeadCell>End Date/Time</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableBody>
            {/* {orders.map((order) => (
              <TableRow className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <TableCell>{order.order_id}</TableCell>
                <TableCell>{order.customer_id}</TableCell>
                <TableCell>{order.chef_id}</TableCell>
                <TableCell>{order.recipe_id}</TableCell>
                <TableCell>
                  {new Date(order.order_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {order.start_date_time
                    ? new Date(order.start_date_time).toLocaleString()
                    : "N/A"}
                </TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>${order.total_price.toFixed(2)}</TableCell>
                <TableCell>{order.type}</TableCell>
              </TableRow>
            ))} */}
          </TableBody>
        </TableHead>
      </Table>
    </div>
  );
};

export default OrderPage;
