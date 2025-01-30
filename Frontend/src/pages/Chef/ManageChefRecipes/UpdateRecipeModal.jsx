
import React, { useEffect } from "react";
import { Formik, Form, Field } from "formik";
import {
  recipeUpdateValidationSchema,
} from "./ValidationRecipeSchema";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";







const UpdateRecipeModal = ({
  chefid,
  isOpen,
  onClose,
  onUpdateRecipe,
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
    const response = await fetch(
      `http://localhost:3000/api/recipes?recipe_id=${selectedRecipe.recipe_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      const updatedRecipe = await response.json();
      onUpdateRecipe(updatedRecipe);
      toast.success("Recipe updated successfully!");
      onClose();
    } else {
      const errorDetails = await response.json();
      toast.error(
        `Failed to update recipe: ${errorDetails.message || "Unknown error"}`
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
        Edit Recipe
        </h2>
        <Formik
          initialValues={initialValues}
          validationSchema={recipeUpdateValidationSchema}
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
                  Update Recipe
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

export default UpdateRecipeModal;
