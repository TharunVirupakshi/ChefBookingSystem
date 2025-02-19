import MASALA_DOSA from "../assets/Masala-Dosa.jpg"
import SPICY_SHRIMP from "../assets/spicy-garlic-shrimp-cream-sauce-4-of-11.jpg"
import IDLY_VADA from "../assets/idlyvada.jpg"
import CAKE from "../assets/classic-belgian-chocolate-cake.jpg"
import GENERIC from "../assets/generic_food.png"


const idToImgUrl = new Map([
    [18, SPICY_SHRIMP],
    [20, MASALA_DOSA],
    [22, IDLY_VADA],
    [28, CAKE],
    [-1, GENERIC]
  ]);

const getImgUrl = (recipeId) => {
  console.log("Getting img for ", recipeId)
  return idToImgUrl.get(recipeId) ?? idToImgUrl.get(-1)
} 

export default getImgUrl