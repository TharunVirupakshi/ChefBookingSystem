import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RecipeCard from "../components/RecipeCard/RecipeCard";
import getImgUrl from "../utils/images";

function HomePage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecipes = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/recipes", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        const sortedRecipes = data.sort((a, b) => a.recipe_id - b.recipe_id);
        setRecipes(sortedRecipes);
        setFilteredRecipes(sortedRecipes); // Initialize filtered list
      } else {
        console.error("Failed to fetch recipes:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error.message);
    }
  };

  const handleBookNow = (recipe_id, chef_id) => {
    navigate(`/recipe/${recipe_id}`, {
      state: { chef_id },
    });
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(query) 
      || recipe.chef_full_name.toLowerCase().includes(query)
    );
    setFilteredRecipes(filtered);
  };

  return (
    <div className="p-10">
      {/* Search Bar */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe, index) => (
            <ul key={index}>
              <RecipeCard
                title={recipe.title}
                price={recipe.price}
                postedBy={recipe.chef_full_name}
                imageurl={getImgUrl(recipe.recipe_id)}
                handleBookNow={() => handleBookNow(recipe.recipe_id, recipe.chef_id)}
              />
            </ul>
          ))
        ) : (
          <p>No recipes found</p>
        )}
      </div>
    </div>
  );
}

export default HomePage;
