import React from "react";
import { Table, TableCell } from "flowbite-react";
import { useState } from "react";
import { useEffect } from "react";
import Toast from "../../../components/Toast/Toast";
import { HiPencil, HiTrash } from "react-icons/hi";
import { useAuth } from "../../../context/AuthContext";
import UpdateRecipeModal from "./UpdateRecipeModal";
import AddRecipeModal from "./AddRecipeModal";


const ManageChefRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [chefid,setChefId] = useState('')
  const {user,loading} = useAuth();

  useEffect(() => {
    if (!loading) {
      console.log("User in AddUpdateComp....: ", user);
      const chefuid = user?.uid
      setChefId(chefuid)
    }
  }, [user, loading]);




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

  const fetchReciepes = async () => {
  if (!chefid) return; // Wait until chefid is set

  try {
    const response = await fetch(`http://localhost:3000/api/recipes/chef/${chefid}`, {
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

  useEffect(() => {
    fetchReciepes();
  }, [chefid]);

  const handleDeleteRecipe = async (recipe_id) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/recipes?recipe_id=${recipe_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const deletedRecipe = await response.json();
        // Remove the deleted recipe from the state
        setRecipes((prevRecipes) =>
          prevRecipes.filter((recipe) => recipe.recipe_id !== recipe_id)
        );
        showToast("success", "Recipe deleted successfully!");
        console.log("Recipe deleted:", deletedRecipe);
      }
    } catch (error) {
      console.error("Failed to delete recipe:", error.message);
      showToast("error", `Error: ${error.message}`);
    }
  };

  const openEditModal = (recipeId, recipe) => {
    setSelectedRecipe({ ...recipe, recipe_id: recipeId }); // Pass recipe_id with recipe
    setIsModalOpen(true);
  };

  const onAddRecipe = () => {
    fetchReciepes();
  };

  const onUpdateRecipe = (updatedRecipe) => {
    setRecipes((prevRecipes) =>
      prevRecipes.map((recipe) =>
        recipe.recipe_id === updatedRecipe.recipe_id ? updatedRecipe : recipe
      )
    );
    showToast("success", "Recipe updated successfully!");
    fetchReciepes();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  return (
    <>
      <div className="bg-white overflow-x-auto shadow-sm sm:rounded-lg">
      {isToastVisible && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setIsToastVisible(false)}
          />
        )}
        <div className="title flex justify-between p-9 items-center">
          <h2 className="text-lg font-bold text-gray-500">Recipes</h2>
          <button
            type="button"
            onClick={() => {
              setSelectedRecipe(null); // Clear the selected recipe
              setIsModalOpen(true); // Open the modal
            }}
            className="flex items-center gap-1  text-secondary bg-amber-300 hover:bg-yellow-300 focus:ring-4 focus:ring-amber-300 font-medium rounded-lg text-sm px-3 py-2.5 me-2 mb-2 dark:bg-yellow-600 dark:hover:bg-yellow-700 focus:outline-none dark:focus:ring-yellow-800"
          >
            Add Recipe
          </button>
        </div>

        <Table striped>
          <Table.Head>
            <Table.HeadCell>Recipe Id</Table.HeadCell>
            <Table.HeadCell>Recipe name</Table.HeadCell>
            <Table.HeadCell>Description</Table.HeadCell>
            <Table.HeadCell>Ingredients</Table.HeadCell>
            <Table.HeadCell>Vegetarian</Table.HeadCell>
            <Table.HeadCell>Booking Type</Table.HeadCell>
            <Table.HeadCell>Preparation Time</Table.HeadCell>
            <Table.HeadCell>Action</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {recipes.map((recipe, index) => (
              <Table.Row
                key={recipe.recipe_id}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <TableCell>{recipe.recipe_id}</TableCell>
                <TableCell>{recipe.title}</TableCell>
                <TableCell className="line-clamp-1">
                  {recipe.description}
                </TableCell>
                <TableCell className="max-w-40 truncate">
                  {recipe.ingredients}
                </TableCell>
                <Table.Cell>
                  {recipe.is_vegetarian ? "true" : "false"}
                </Table.Cell>
                <TableCell>{recipe.booking_type}</TableCell>
                <TableCell>{recipe.preparation_time}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => openEditModal(recipe.recipe_id, recipe)}
                      className="font-medium text-blue-600 hover:underline dark:text-cyan-500"
                    >
                      <HiPencil className="mx-auto mb-4 h-7 w-7 text-blue-500 dark:text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecipe(recipe.recipe_id)}
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
      {selectedRecipe === null ? (
  <AddRecipeModal
    chefid={chefid}
    isOpen={isModalOpen}
    onClose={closeModal}
    onAddRecipe={onAddRecipe}
  />
) : (
  <UpdateRecipeModal
    chefid={chefid}
    isOpen={isModalOpen}
    onClose={closeModal}
    onUpdateRecipe={onUpdateRecipe}
    selectedRecipe={selectedRecipe}
  />
)}
    </>
  );
};

export default ManageChefRecipes;
