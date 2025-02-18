import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const APIService = {
  // Fetch all chefs
  async fetchAllChefs() {
    try {
      const response = await axios.get(`${API_BASE_URL}/chefs`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chefs:', error);
      throw error;
    }
  },

  // Fetch chef by ID
  async fetchChefById(chefId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/chefs/${chefId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chef by ID:', error);
      throw error;
    }
  },

  // Update FCM token
  async updateFCMToken(chefId, fcmToken) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chefs/update-fcm-token`, {
        chef_id: chefId,
        fcm_token: fcmToken,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating FCM token:', error);
      throw error;
    }
  },

  // Get chef status
  async getChefStatus(chefId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/chefs/status/${chefId}`);
      console.log(response.data)
      return response.data;
    } catch (error) {
      console.error('Error fetching chef status:', error);
      throw error;
    }
  },

  // Update chef status
  async updateChefStatus(chefId, status) {
    try {
      const response = await axios.put(`${API_BASE_URL}/chefs/status`, {
        chef_id: chefId,
        status: status,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating chef status:', error);
      throw error;
    }
  },

  // Chef signup
  async chefSignUp(chefData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chefs/signup`, chefData);
      return response.data;
    } catch (error) {
      console.error('Error signing up chef:', error);
      throw error;
    }
  },

//--------------------------Order------------------//


  //fetch all the orders
    async fetchAllOrders(){
    try {
        const response = await axios.get(`${API_BASE_URL}/orders`);
        return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
},



 // Fetch the most recent pending instant order for a chef
 async fetchInstantOrder(chefId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/instant-order`, {
        params: { chef_id: chefId }, // Using query parameters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching instant order:', error);
      throw error;
    }
  },


// Fetch a pending instant order by chef_id from chef_status table
async fetchCurrentInstantOrderByChefId(chef_id) {
    try {
        const response = await axios.get(`${API_BASE_URL}/orders/instant/current`,{
          params: {chef_id}
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching order by chef_id:', error);
        throw error;
    }
},

async fetchAllOrdersByChefId(chef_id){
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/${chef_id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching all orders by chef_id:', error);
    throw error; 
  }
},


// Fetch completed orders by chef_id
async fetchCompletedOrders(chef_id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/completed-orders/${chef_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      throw error;
    }
  },

  async fetchCustomerOrders(customer_id){
    try {

      if(!customer_id) return;
    

      const response = await axios.get(`${API_BASE_URL}/orders/customer-orders/${customer_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      throw error;
    }
  },

  // Update the instant book status to "COMPLETED"
  async updateInstantBookStatus(orderId, chef_id, status) {
    try {
      const response = await axios.put(`${API_BASE_URL}/orders/update-instant-book`, {
        orderId,
        chef_id,
        status,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating instant book status:', error);
      throw error;
    }
  },


  async instantBooking(chef_id, customer_id, recipe_id, latitude, longitude) {
    try {
        const response = await axios.post(`${API_BASE_URL}/orders/instant`, {
            chef_id,
            customer_id,
            recipe_id,
            latitude,
            longitude,
        });

        return response.data;
    } catch (error) {
        console.error("Error during instant booking:", error);
        throw error.response?.data || { message: "Instant booking failed." };
    }
},


// Cancel Instant Booking
async cancelInstantBooking(chef_id) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/orders/instant/cancel`,
        { chef_id }
      );
      return response.data;
    } catch (error) {
      console.error("Error cancelling instant booking:", error);
      throw error.response?.data || { message: "Failed to cancel booking." };
    }
  },




  // Fetch real-time instant booking updates using SSE
  listenToInstantBooking(chef_id, onMessage, onError) {
    const eventSource = new EventSource(`${API_BASE_URL}/orders/sse/instant-booking/${chef_id}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("SSE Data Received:", data); 
        onMessage(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      if (onError) onError(error);
      eventSource.close();
    };
    eventSource.onclose = () => {
    console.log("SSE connection closed.");
  };


    return eventSource;
  },


  // Send instant booking response (ACCEPT/REJECT)
  async sendInstantResponse(chefId, customerId, recipeId, response, latitude, longitude) {
    try {
      const res = await axios.post(`${API_BASE_URL}/orders/instant/response`, {
        chef_id: chefId,
        customer_id: customerId,
        recipe_id: recipeId,
        response,
        chef_latitude: latitude, 
        chef_longitude: longitude, 
      });

      return res.data;
    } catch (error) {
      console.error("Error sending instant booking response:", error);
      throw error.response?.data || { success: false, message: "An error occurred" };
    }
  },

   // Fetch all customers (excluding deleted ones)
   async getCustomers() {
    try {
      const res = await axios.get(`${API_BASE_URL}/customers`);
      return res.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error.response?.data || { success: false, message: 'Error fetching customers' };
    }
  },

// Fetch customer by ID (excluding deleted ones)
  async getCustomerById(id) {
    try {
      const res = await axios.get(`${API_BASE_URL}/customers/${id}`);
      return res.data;
    } catch (error) {
      console.error(`Error fetching customer with ID ${id}:`, error);
      throw error.response?.data || { success: false, message: `Error fetching customer with ID ${id}` };
    }
  },

 // Customer Sign Up
 async signUpCustomer(signUpData) {
    try {
      const res = await axios.post(`${API_BASE_URL}/customers/signup`, signUpData);
      return res.data;
    } catch (error) {
      console.error('Error during customer sign up:', error);
      throw error.response?.data || { success: false, message: 'Error during customer sign up' };
    }
  },



  //------------Recipe-------------------------------//

  //Fetch all the recipes
  async fetchRecipes() {
  try {
    const response = await axios.get(`${API_BASE_URL}/recipes`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw error.response?.data || { message: "Error fetching recipes" };
  }
},


//Fetch recipes based on chef_id
async fetchRecipesByChefId(chefId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/recipes/${chefId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recipes by chefId:", error);
    throw error.response?.data || { message: "Error fetching recipes" };
  }
},


//Fetch recipes based on recipe_id
async fetchRecipesByRecipeId(RecipeId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/recipes/recipe/${RecipeId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recipes by RecipeId:", error);
    throw error.response?.data || { message: "Error fetching recipes" };
  }
},


// Fetch all recipes or filter by chef_id and recipe_id
async fetchRecipeByChefIdAndRecipeId(chef_id, recipeId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/recipes/${chef_id}/${recipeId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching recipe by chef_id and recipeId:", error);
      throw error.response?.data || { message: "Error fetching recipe" };
    }
  },

// Create Recipe  
async createRecipe(recipeData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/recipes`, recipeData);
    return response.data;
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw error.response?.data || { message: "Error creating recipe" };
  }
},


//Update recipe
async updateRecipe(recipeId, updatedData) {
  try {
    const response = await axios.put(`${API_BASE_URL}/recipes`, {
      recipe_id: recipeId,
      ...updatedData, // Spread the updated data object to send it
    });
    return response.data;
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error.response?.data || { message: "Error updating recipe" };
  }
},


//Delete recipe
async deleteRecipe(recipeId) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/recipes`, {
      params: { recipe_id: recipeId }, // Pass the recipe_id in the query params
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error.response?.data || { message: "Error deleting recipe" };
  }
}


};





export default APIService;
