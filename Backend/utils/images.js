const path = require("path");
const fs = require("fs");

// Path to the image mappings JSON file
const mappingsFilePath = path.join(__dirname, "../imagesDB/imagesMap.json");
console.log("Image Mappings Path:", mappingsFilePath)
// Load image mappings from the JSON file
const loadMappings = () => {
  if (!fs.existsSync(mappingsFilePath)) return {};
  return JSON.parse(fs.readFileSync(mappingsFilePath, "utf8"));
};

// Function to get the image URL by recipe ID
const getImageUrl = (recipeId) => {
  const imageMappings = loadMappings();
  const filename = imageMappings[recipeId];

  if (filename) {
    return `images/${filename}`;
  } else {
    return `images/generic.png`; // Default image
  }
};

module.exports = { getImageUrl };
