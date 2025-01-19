import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import { recipeCreateValidationSchema,recipeUpdateValidationSchema } from "./ValidationRecipeSchema";
import Toast from "../../../components/Toast/Toast";



const AddUpdateRecipeModal = ({ isOpen, onClose, onAddRecipe ,onUpdateRecipe, selectedRecipe, mode }) => {
  const [formData, setFormData] = useState({
    chef_id: "",
    title: "",
    description: "",
    ingredients: "",
    preparation_time: "",
    price: "",
    is_vegetarian: false,
    booking_type: "",
  });
  const [toast, setToast] = useState({ type: "", message: "" });
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  useEffect(() => {
    if (mode === "edit" && selectedRecipe) {
      setFormData({ ...selectedRecipe });
    } else {
      // Clear the form data for "add" mode
      setFormData({
        chef_id: "",
        title: "",
        description: "",
        ingredients: "",
        preparation_time: "",
        price: "",
        is_vegetarian: false,
        booking_type: "",
      });
    }
  }, [mode, selectedRecipe, isOpen]);


 

  const formik = useFormik({
    initialValues: formData,
    enableReinitialize: true, // Allows the form to be updated when `formData` changes
    validationSchema: mode === "edit" ? recipeUpdateValidationSchema : recipeCreateValidationSchema, // Use different schemas for add and update
    onSubmit: async (values) => {
      let payload = {
        title: values.title,
        description: values.description,
        ingredients: values.ingredients,
        preparation_time: values.preparation_time,
        price: values.price,
        is_vegetarian: values.is_vegetarian,
        booking_type: values.booking_type,
      };

      if (mode === "add") {
        payload = { ...payload, chef_id: Number(values.chef_id) };
      }

      try {
        const response = await fetch(
          mode === "edit"
            ? `http://localhost:3000/api/recipes?recipe_id=${selectedRecipe.recipe_id}`
            : "http://localhost:3000/api/recipes",
          {
            method: mode === "edit" ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          const recipe = await response.json();
          if (mode === "edit") {
        onUpdateRecipe(recipe);
        showToast("success", "Recipe updated successfully!");
      } else {
        onAddRecipe(recipe);
        showToast("success", "Recipe added successfully!");
      }

        } else {
          const errorDetails = await response.json();
          console.error("Failed to submit recipe:", errorDetails);
        }

        onClose();
      } catch (error) {
        console.error("Error submitting recipe:", error.message);
        showToast("error", `Error: ${error.message}`);
      }
    },
  });

  if (!isOpen) return null;

  return (
    <>
   
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
   
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 sm:p-8 m-4 max-h-[80vh] overflow-y-auto">
      {isToastVisible && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setIsToastVisible(false)}
          />
        )}
        <h2 className="text-xl font-bold mb-4 text-center">
          {mode === "edit" ? "Edit Recipe" : "Add Recipe"}
        </h2>
        <form onSubmit={formik.handleSubmit} className="space-y-3">
          <div>
            <label className="block mb-1">Chef ID</label>
            <input
              type="number"
              name="chef_id"
              value={formik.values.chef_id}
              onChange={formik.handleChange}
              className={`w-full p-2 border rounded ${
                mode === "edit" ? "bg-gray-200 cursor-not-allowed" : ""
              }`}
              required
              disabled={mode === "edit"}
            />
            {formik.errors.chef_id && formik.touched.chef_id && (
              <div className="text-red-500 text-sm">{formik.errors.chef_id}</div>
            )}
          </div>

          <div>
            <label className="block mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              className="w-full p-2 border rounded"
              required
            />
            {formik.errors.title && formik.touched.title && (
              <div className="text-red-500 text-sm">{formik.errors.title}</div>
            )}
          </div>

          <div>
            <label className="block mb-1">Description</label>
            <textarea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              className="w-full p-2 border rounded"
              required
            />
            {formik.errors.description && formik.touched.description && (
              <div className="text-red-500 text-sm">{formik.errors.description}</div>
            )}
          </div>

          <div>
            <label className="block mb-1">Ingredients</label>
            <textarea
              name="ingredients"
              value={formik.values.ingredients}
              onChange={formik.handleChange}
              className="w-full p-2 border rounded"
              required
            />
            {formik.errors.ingredients && formik.touched.ingredients && (
              <div className="text-red-500 text-sm">{formik.errors.ingredients}</div>
            )}
          </div>

          <div>
            <label className="block mb-1">Preparation Time (minutes)</label>
            <input
              type="number"
              name="preparation_time"
              value={formik.values.preparation_time}
              onChange={formik.handleChange}
              className="w-full p-2 border rounded"
              required
            />
            {formik.errors.preparation_time && formik.touched.preparation_time && (
              <div className="text-red-500 text-sm">{formik.errors.preparation_time}</div>
            )}
          </div>

          <div>
            <label className="block mb-1">Price</label>
            <input
              type="number"
              name="price"
              value={formik.values.price}
              onChange={formik.handleChange}
              className="w-full p-2 border rounded"
              step="0.01"
              required
            />
            {formik.errors.price && formik.touched.price && (
              <div className="text-red-500 text-sm">{formik.errors.price}</div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_vegetarian"
                checked={formik.values.is_vegetarian}
                onChange={formik.handleChange}
              />
              Is Vegetarian
            </label>
            {formik.errors.is_vegetarian && formik.touched.is_vegetarian && (
              <div className="text-red-500 text-sm">{formik.errors.is_vegetarian}</div>
            )}
          </div>

          <div>
            <label htmlFor="booking_type">Booking Type:</label>
            <select
              id="booking_type"
              name="booking_type"
              value={formik.values.booking_type}
              onChange={formik.handleChange}
              required
            >
              <option value="">Select a booking type</option>
              <option value="instant">Instant</option>
              <option value="advance">Advance</option>
            </select>
            {formik.errors.booking_type && formik.touched.booking_type && (
              <div className="text-red-500 text-sm">{formik.errors.booking_type}</div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border-amber-300 border-2 text-secondary rounded-xl font-medium hover:bg-amber-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-3 text-secondary bg-amber-300 hover:bg-yellow-300 focus:ring-4 focus:ring-amber-300 font-medium rounded-xl dark:bg-yellow-600 dark:hover:bg-yellow-700 focus:outline-none dark:focus:ring-yellow-800"
            >
              {mode === "edit" ? "Update Recipe" : "Add Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default AddUpdateRecipeModal;










