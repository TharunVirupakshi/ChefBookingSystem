// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { v4 as uuidv4 } from "uuid"; // Import the uuid library
// import { storage } from  "../../Firebase/firebase"

// const uploadImage = async (file) => {
//   try {
//     // Generate a unique file path
//     const uniqueFileName = `recipes/${uuidv4()}`;

//     // Create a reference in Firebase Storage
//     const storageRef = ref(storage, uniqueFileName);

//     // Upload the file
//     const snapshot = await uploadBytes(storageRef, file);
//     console.log("Uploaded file:", snapshot);

//     // Get the file's download URL
//     const downloadURL = await getDownloadURL(storageRef);
//     console.log("File available at:", downloadURL);

//     return downloadURL; // Return the download URL to be saved in your database
//   } catch (error) {
//     console.error("Error uploading file:", error);
//     throw error;
//   }
// };

// export default uploadImage;
