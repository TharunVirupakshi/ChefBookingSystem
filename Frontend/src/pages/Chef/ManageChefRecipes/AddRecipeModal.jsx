// import React, { useEffect, useState } from "react";
// import { Formik, useFormik } from "formik";
// import { recipeCreateValidationSchema,recipeUpdateValidationSchema } from "./ValidationRecipeSchema";
// import Toast from "../../../components/Toast/Toast";

// const AddUpdateRecipeModal = ({ isOpen, onClose, onAddRecipe ,onUpdateRecipe, selectedRecipe, mode }) => {
//   const [formData, setFormData] = useState({
//     chef_id: "",
//     title: "",
//     description: "",
//     ingredients: "",
//     preparation_time: "",
//     price: "",
//     is_vegetarian: false,
//     booking_type: "",
//   });
//   const [toast, setToast] = useState({ type: "", message: "" });
//   const [isToastVisible, setIsToastVisible] = useState(false);
//   const [timeoutId, setTimeoutId] = useState(null);

//   const showToast = (type, message) => {
//     setToast({ type, message });
//     setIsToastVisible(true);
//     // Auto-hide the toast after a few seconds
//     // Clear any existing timeout to prevent multiple timeouts
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }
//     // Set a new timeout
//     const newTimeoutId = setTimeout(() => {
//       setIsToastVisible(false);
//       setToast({ type: "", message: "" });
//     }, 10000);

//     setTimeoutId(newTimeoutId);
//   };

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//       }
//     };
//   }, [timeoutId]);

//   useEffect(() => {
//     if (mode === "edit" && selectedRecipe) {
//       setFormData({ ...selectedRecipe });
//     } else {
//       // Clear the form data for "add" mode
//       setFormData({
//         chef_id: "",
//         title: "",
//         description: "",
//         ingredients: "",
//         preparation_time: "",
//         price: "",
//         is_vegetarian: false,
//         booking_type: "",
//       });
//     }
//   }, [mode, selectedRecipe, isOpen]);

//   const formik = useFormik({
//     initialValues: formData,
//     enableReinitialize: true, // Allows the form to be updated when `formData` changes
//     validationSchema: mode === "edit" ? recipeUpdateValidationSchema : recipeCreateValidationSchema, // Use different schemas for add and update
//     onSubmit: async (values) => {
//       let payload = {
//         title: values.title,
//         description: values.description,
//         ingredients: values.ingredients,
//         preparation_time: values.preparation_time,
//         price: values.price,
//         is_vegetarian: values.is_vegetarian,
//         booking_type: values.booking_type,
//       };

//       if (mode === "add") {
//         payload = { ...payload, chef_id: Number(values.chef_id) };
//       }

//       try {
//         const response = await fetch(
//           mode === "edit"
//             ? `http://localhost:3000/api/recipes?recipe_id=${selectedRecipe.recipe_id}`
//             : "http://localhost:3000/api/recipes",
//           {
//             method: mode === "edit" ? "PUT" : "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify(payload),
//           }
//         );

//         if (response.ok) {
//           const recipe = await response.json();
//           if (mode === "edit") {
//         onUpdateRecipe(recipe);
//         showToast("success", "Recipe updated successfully!");
//       } else {
//         onAddRecipe(recipe);
//         showToast("success", "Recipe added successfully!");
//       }

//         } else {
//           const errorDetails = await response.json();
//           console.error("Failed to submit recipe:", errorDetails);
//         }

//         onClose();
//       } catch (error) {
//         console.error("Error submitting recipe:", error.message);
//         showToast("error", `Error: ${error.message}`);
//       }
//     },
//   });

//   if (!isOpen) return null;

//   return (
//     <>

//     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">

//       <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 sm:p-8 m-4 max-h-[80vh] overflow-y-auto">
//       {isToastVisible && (
//           <Toast
//             type={toast.type}
//             message={toast.message}
//             onClose={() => setIsToastVisible(false)}
//           />
//         )}
//         <h2 className="text-xl font-bold mb-4 text-center">
//           {mode === "edit" ? "Edit Recipe" : "Add Recipe"}
//         </h2>
//         <Formik
//         initialValues={{
//           title:"",
//           description:"",
//            ingredients:"",
//            preparation_time:"",
//            price:"",
//            is_vegetarian:"",
//            booking_type:""
//         }}
//         onSubmit={(values) => {
//             handleSignUp(

//             );
//           }}
//           validationSchema={validationSchema}
//         >
//         <form onSubmit={formik.handleSubmit} className="space-y-3">

//           <div>
//             <label className="block mb-1">Title</label>
//             <input
//               type="text"
//               name="title"
//               value={formik.values.title}
//               onChange={formik.handleChange}
//               className="w-full p-2 border rounded"
//               required
//             />
//             {formik.errors.title && formik.touched.title && (
//               <div className="text-red-500 text-sm">{formik.errors.title}</div>
//             )}
//           </div>

//           <div>
//             <label className="block mb-1">Description</label>
//             <textarea
//               name="description"
//               value={formik.values.description}
//               onChange={formik.handleChange}
//               className="w-full p-2 border rounded"
//               required
//             />
//             {formik.errors.description && formik.touched.description && (
//               <div className="text-red-500 text-sm">{formik.errors.description}</div>
//             )}
//           </div>

//           <div>
//             <label className="block mb-1">Ingredients</label>
//             <textarea
//               name="ingredients"
//               value={formik.values.ingredients}
//               onChange={formik.handleChange}
//               className="w-full p-2 border rounded"
//               required
//             />
//             {formik.errors.ingredients && formik.touched.ingredients && (
//               <div className="text-red-500 text-sm">{formik.errors.ingredients}</div>
//             )}
//           </div>

//           <div>
//             <label className="block mb-1">Preparation Time (minutes)</label>
//             <input
//               type="number"
//               name="preparation_time"
//               value={formik.values.preparation_time}
//               onChange={formik.handleChange}
//               className="w-full p-2 border rounded"
//               required
//             />
//             {formik.errors.preparation_time && formik.touched.preparation_time && (
//               <div className="text-red-500 text-sm">{formik.errors.preparation_time}</div>
//             )}
//           </div>

//           <div>
//             <label className="block mb-1">Price</label>
//             <input
//               type="number"
//               name="price"
//               value={formik.values.price}
//               onChange={formik.handleChange}
//               className="w-full p-2 border rounded"
//               step="0.01"
//               required
//             />
//             {formik.errors.price && formik.touched.price && (
//               <div className="text-red-500 text-sm">{formik.errors.price}</div>
//             )}
//           </div>

//           <div>
//             <label className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 name="is_vegetarian"
//                 checked={formik.values.is_vegetarian}
//                 onChange={formik.handleChange}
//               />
//               Is Vegetarian
//             </label>
//             {formik.errors.is_vegetarian && formik.touched.is_vegetarian && (
//               <div className="text-red-500 text-sm">{formik.errors.is_vegetarian}</div>
//             )}
//           </div>

//           <div>
//             <label htmlFor="booking_type">Booking Type:</label>
//             <select
//               id="booking_type"
//               name="booking_type"
//               value={formik.values.booking_type}
//               onChange={formik.handleChange}
//               required
//             >
//               <option value="">Select a booking type</option>
//               <option value="instant">Instant</option>
//               <option value="advance">Advance</option>
//             </select>
//             {formik.errors.booking_type && formik.touched.booking_type && (
//               <div className="text-red-500 text-sm">{formik.errors.booking_type}</div>
//             )}
//           </div>

//           <div className="flex items-center justify-end gap-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-3 border-amber-300 border-2 text-secondary rounded-xl font-medium hover:bg-amber-300"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-3 text-secondary bg-amber-300 hover:bg-yellow-300 focus:ring-4 focus:ring-amber-300 font-medium rounded-xl dark:bg-yellow-600 dark:hover:bg-yellow-700 focus:outline-none dark:focus:ring-yellow-800"
//             >
//               {mode === "edit" ? "Update Recipe" : "Add Recipe"}
//             </button>
//           </div>
//         </form>
//         </Formik>
//       </div>
//     </div>
//     </>
//   );
// };

// export default AddUpdateRecipeModal;

import React, { useEffect } from "react";
import { Formik, Form, Field } from "formik";
import {
  recipeCreateValidationSchema,
} from "./ValidationRecipeSchema";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";







const AddRecipeModal = ({
  chefid,
  isOpen,
  onClose,
  onAddRecipe,
  selectedRecipe,
}) => {
  const initialValues = {
    title: selectedRecipe?.title || "",
    description: selectedRecipe?.description || "",
    ingredients: selectedRecipe?.ingredients || "",
    preparation_time: selectedRecipe?.preparation_time || "",
    price: selectedRecipe?.price || "",
    is_vegetarian: selectedRecipe?.is_vegetarian || false,
    booking_type: selectedRecipe?.booking_type || "",
  };

  console.log('chefid',chefid)



  const handleSubmit = async (values) => {
    const payload = {
      chef_id:chefid,
      title: values.title,
      description: values.description,
      ingredients: values.ingredients,
      preparation_time: values.preparation_time,
      price: values.price,
      is_vegetarian: values.is_vegetarian,
      booking_type: values.booking_type,
    };

    try {
      const response = await fetch("http://localhost:3000/api/recipes",
        {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
      const addRecipe = await response.json();
      onAddRecipe(addRecipe);
      toast.success("Recipe added successfully!");
      onClose();
      } else {
        const errorDetails = await response.json();
        toast.error(
          `Failed to submit recipe: ${errorDetails.message || "Unknown error"}`
        );
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 sm:p-8 m-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center">
        Add Recipe
        </h2>
        <Formik
          initialValues={initialValues}
          validationSchema={recipeCreateValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-3">
              <div>
                <label className="block mb-1">Title</label>
                <Field
                  type="text"
                  name="title"
                  className="w-full p-2 border rounded"
                />
                {errors.title && touched.title && (
                  <div className="text-red-500 text-sm">{errors.title}</div>
                )}
              </div>

              <div>
                <label className="block mb-1">Description</label>
                <Field
                  as="textarea"
                  name="description"
                  className="w-full p-2 border rounded"
                />
                {errors.description && touched.description && (
                  <div className="text-red-500 text-sm">
                    {errors.description}
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1">Ingredients</label>
                <Field
                  as="textarea"
                  name="ingredients"
                  className="w-full p-2 border rounded"
                />
                {errors.ingredients && touched.ingredients && (
                  <div className="text-red-500 text-sm">
                    {errors.ingredients}
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1">Preparation Time (minutes)</label>
                <Field
                  type="number"
                  name="preparation_time"
                  className="w-full p-2 border rounded"
                />
                {errors.preparation_time && touched.preparation_time && (
                  <div className="text-red-500 text-sm">
                    {errors.preparation_time}
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1">Price</label>
                <Field
                  type="number"
                  name="price"
                  className="w-full p-2 border rounded"
                  step="0.01"
                />
                {errors.price && touched.price && (
                  <div className="text-red-500 text-sm">{errors.price}</div>
                )}
              </div>

              <div>
                <label className="block mb-1">Is Vegetarian</label>
                <Field type="checkbox" name="is_vegetarian" className="mr-2" />
                Vegetarian
                {errors.is_vegetarian && touched.is_vegetarian && (
                  <div className="text-red-500 text-sm">
                    {errors.is_vegetarian}
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1" htmlFor="booking_type">
                  Booking Type
                </label>
                <Field
                  as="select"
                  name="booking_type"
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select a booking type</option>
                  <option value="instant">Instant</option>
                  <option value="advance">Advance</option>
                </Field>
                {errors.booking_type && touched.booking_type && (
                  <div className="text-red-500 text-sm">
                    {errors.booking_type}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white p-2 rounded"
                >
                 Add Recipe
                </button>
                <button
                  type="button"
                  className="w-full bg-gray-500 text-white p-2 rounded"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddRecipeModal;
