// validationSchemas.js
import * as Yup from "yup";

// Validation schema for adding a recipe
export const recipeCreateValidationSchema = Yup.object({
  chef_id: Yup.number().integer().required("Chef ID is required."),
  title: Yup.string().required("Title is required."),
  description: Yup.string()
    .min(20, "Description must be at least 20 characters long.")
    .max(500, "Description cannot be longer than 500 characters.")
    .required("Description is required."),
  ingredients: Yup.string()
    .min(20, "Ingredients must be at least 20 characters long.")
    .max(500, "Ingredients cannot be longer than 500 characters.")
    .required("Ingredients are required."),
  preparation_time: Yup.number()
    .integer("Preparation time must be an integer.")
    .min(1, "Preparation time must be at least 1 minute.")
    .max(1440, "Preparation time cannot exceed 1440 minutes (24 hours).")
    .required("Preparation time is required."),
  price: Yup.number()
    .positive("Price must be a positive number.")
    .test('precision', 'Price cannot have more than two decimal places.', value => {
      return /^[0-9]+(\.[0-9]{1,2})?$/.test(value); // This regex checks for 2 decimal places
    })
    .required("Price is required."),
  is_vegetarian: Yup.boolean().required("Please specify if the recipe is vegetarian."),
  booking_type: Yup.string()
    .oneOf(["instant", "advance"], "Booking type must be 'instant' or 'advance'.")
    .required("Booking type is required."),
});

// Validation schema for updating a recipe
export const recipeUpdateValidationSchema = Yup.object({
  chef_id: Yup.mixed().notRequired(), // chef_id cannot be updated, no need to validate
  title: Yup.string(),
  description: Yup.string()
    .min(20, "Description must be at least 20 characters long.")
    .max(500, "Description cannot be longer than 500 characters."),
  ingredients: Yup.string()
    .min(20, "Ingredients must be at least 20 characters long.")
    .max(500, "Ingredients cannot be longer than 500 characters."),
  preparation_time: Yup.number()
    .integer("Preparation time must be an integer.")
    .min(1, "Preparation time must be at least 1 minute.")
    .max(1440, "Preparation time cannot exceed 1440 minutes (24 hours)."),
  price: Yup.number()
    .positive("Price must be a positive number.")
    .test('precision', 'Price cannot have more than two decimal places.', value => {
      return /^[0-9]+(\.[0-9]{1,2})?$/.test(value); // This regex checks for 2 decimal places
    }),
  is_vegetarian: Yup.boolean(),
  booking_type: Yup.string().oneOf(["instant", "advance"], "Booking type must be 'instant' or 'advance'."),
});
