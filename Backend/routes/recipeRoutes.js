const express = require("express");
const client = require("../config/db");
const router = express.Router();
const Joi = require("joi");

router.get("/", async (req, res) => {
  try {
    const result = await client.query(
      "Select * from recipe WHERE deleted_at IS NULL"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: "Error fetching recipes" });
  }
});

const recipeCreateValidationSchema = Joi.object({
  chef_id: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().min(20).max(500).required(),
  ingredients: Joi.string().min(20).max(500).required(),
  preparation_time: Joi.number()
    .integer()
    .min(1)
    .max(1440)
    .required()
    .messages({
      "number.base": "Preparation time must be a number.",
      "number.integer": "Preparation time must be an integer.",
      "number.min": "Preparation time must be at least 1 minute.",
      "number.max": "Preparation time cannot exceed 1440 minutes (24 hours).",
    }),
  price: Joi.number().positive().precision(2).required(),
  is_vegetarian: Joi.boolean().required(),
  booking_type: Joi.string()
    .valid("instant", "advance") // Updated to match the database constraint
    .required(),
  image_url:Joi.string()
});

// Schema for updating a recipe (PUT)
const recipeUpdateValidationSchema = Joi.object({
  chef_id: Joi.forbidden(), // chef_id cannot be updated
  title: Joi.string(),
  description: Joi.string().min(20).max(500),
  ingredients: Joi.string().min(20).max(500),
  preparation_time: Joi.number().integer().min(1).max(1440).messages({
    "number.base": "Preparation time must be a number.",
    "number.integer": "Preparation time must be an integer.",
    "number.min": "Preparation time must be at least 1 minute.",
    "number.max": "Preparation time cannot exceed 1440 minutes (24 hours).",
  }),
  price: Joi.number().positive().precision(2),
  is_vegetarian: Joi.boolean(),
  booking_type: Joi.string().valid("instant", "advance"), // Updated to match the database constraint
  image_url:Joi.string()
});


// Create Recipe  
router.post("/", async (req, res) => {
  console.log("Incoming data:", req.body);
  const { error, value } = recipeCreateValidationSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  const {
    chef_id,
    title,
    description,
    ingredients,
    preparation_time,
    price,
    is_vegetarian,
    booking_type,
    image_url
  } = value;
  try {
    const query = `
            INSERT INTO recipe (chef_id, title, description, ingredients, preparation_time, price, is_vegetarian, booking_type, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;

    const result = await client.query(query, [
      chef_id,
      title,
      description,
      ingredients,
      preparation_time,
      price,
      is_vegetarian,
      booking_type,
      image_url
    ]);
    console.log("Recipe got saved to Postgres:", result.rows[0]);
    return res.status(200).json({
      success: true,
      message: "Recipe added successfully!",
      recipe: result.rows[0],
    });
  } catch (error) {
    console.error("Error inserting recipe:", error.message);
    return res.status(500).json({
      success: false,
      message: "Recipe got rejected.",
    });
  }
});

router.put("/", async (req, res) => {
  const recipeId = req.query.recipe_id;

  if (!recipeId) {
    return res
      .status(400)
      .json({ success: false, message: "Recipe ID is required." });
  }

  const { error, value } = recipeUpdateValidationSchema.validate(req.body, {
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  const {
    title,
    description,
    ingredients,
    preparation_time,
    price,
    is_vegetarian,
    booking_type,
    image_url
  } = value;

  try {
    let updateQuery = `UPDATE recipe SET `;
    const values = [];
    let index = 1;

    if (title !== undefined) {
      updateQuery += `title = $${index}, `;
      values.push(title);
      index++;
    }
    if (description !== undefined) {
      updateQuery += `description = $${index}, `;
      values.push(description);
      index++;
    }
    if (ingredients !== undefined) {
      updateQuery += `ingredients = $${index}, `;
      values.push(ingredients);
      index++;
    }
    if (preparation_time !== undefined) {
      updateQuery += `preparation_time = $${index}, `;
      values.push(preparation_time);
      index++;
    }
    if (price !== undefined) {
      updateQuery += `price = $${index}, `;
      values.push(price);
      index++;
    }
    if (is_vegetarian !== undefined) {
      updateQuery += `is_vegetarian = $${index}, `;
      values.push(is_vegetarian);
      index++;
    }
    if (booking_type !== undefined) {
      updateQuery += `booking_type = $${index}, `;
      values.push(booking_type);
      index++;
    }
    if (image_url !== undefined) {
      updateQuery += `image_url = $${index}, `;
      values.push(image_url);
      index++;
    }

    updateQuery = updateQuery.slice(0, -2) + ` WHERE recipe_id = $${index}`;
    values.push(recipeId);

    const result = await client.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Recipe not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Recipe updated successfully!",
    });
  } catch (error) {
    console.error("Error updating recipe:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating recipe.",
    });
  }
});

router.delete("/", async (req, res) => {
  const recipeId = req.query.recipe_id;
  console.log("Deleting recipe with ID:", recipeId);
  try {
   // Update the 'deleted_at' column with the current timestamp for the given recipe_id
   const query = `
      UPDATE recipes
      SET deleted_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const result = await client.query(query, [recipeId]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }
    console.log("Recipe deleted successfully:", result.rows[0]);
    return res.status(200).json({
      success: true,
      message: "Recipe deleted successfully",
      recipe: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting recipe:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error deleting recipe",
    });
  }
});

module.exports = router;
