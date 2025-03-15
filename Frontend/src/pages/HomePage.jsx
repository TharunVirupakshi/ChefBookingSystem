import React, { useState } from 'react'
import { useEffect } from 'react';
import RecipeCard from '../components/RecipeCard/RecipeCard';
import { Outlet, useNavigate } from 'react-router-dom';
import { string } from 'yup';
import getImgUrl from '../utils/images';




function HomePage () {
   
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState([]);

    const fetchReciepes = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/recipes', {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      const sortedRecipes = data.sort((a, b) => a.recipe_id - b.recipe_id);
      setRecipes(sortedRecipes);
      console.log("Recipes:", data);
    } else {
      console.error("Failed to fetch recipes:", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching recipes:", error.message);
  }
};

const handleBookNow = (recipe_id,chef_id)=>{
    navigate(`/recipe/${recipe_id}`,{
        state: { chef_id } 
    });
   
}




useEffect(()=>{
fetchReciepes()
},[])


  return (
    <div className='grid grid-cols-3 gap-3 p-10'>
    {
        recipes.map((recipe,index)=>(
            <ul key={index}>
            <RecipeCard 
                title={recipe.title}
                price={recipe.price}
                postedBy={recipe.chef_full_name}
                imageurl={getImgUrl(recipe.recipe_id)}
                handleBookNow={()=>handleBookNow(recipe.recipe_id,recipe.chef_id)}
            />
            </ul>
        ))
    }
    </div>
  )
}

export default HomePage