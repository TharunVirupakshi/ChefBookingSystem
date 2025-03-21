import React, { useState, useEffect } from "react";

import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import GoogleMapComponent from "../../../components/Maps/GoogleMapComponent";


const ManageChefLocation = () => {
  const [userGeolocation, setUserGeolocation] = useState({ lat: 0, long: 0 });
  const [isloading, setIsLoading] = useState(true);
  const { user, loading } = useAuth();
  const [chefId, setChefId] = useState("");


  useEffect(() => {
    if (!loading && user) {
      console.log("User: ", user);
      const uid = user.uid;
      setChefId(uid);
      console.log("useruid", chefId);
    }
  }, [user, loading]);

  useEffect(() => {
    const fetchChefLocation = async () => {
      try {
        if(loading) return;

        const response = await axios.get(`http://localhost:3000/api/chefs/location/${chefId}`);
        if (response.data) {
          setUserGeolocation({
            lat: parseFloat(response.data.location.latitude),
            long: parseFloat(response.data.location.longitude),
          });
        }
      } catch (error) {
        console.error("Error fetching chef's location:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChefLocation();
  }, [chefId]);

  const updateLocation = async ({lat, long}) => {
    try {
      await axios.put("http://localhost:3000/api/chefs/location", {
        chef_id: chefId,
        latitude: lat.toString(),
        longitude: long.toString(),
      });
      toast.success("Location updated successfully!");
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Error updating location")
    }
  };

  if (isloading) return <p>Loading map...</p>;

  return (
    <div>
      <h2>Manage Chef Location</h2>
      
      <GoogleMapComponent
        defaultLocation={{
          lat: userGeolocation.lat,
          lng: userGeolocation.long,
        }}
        onLocationSelect={(loc) => updateLocation({lat: loc.lat, long: loc.lng})}
      />
      {/* <button onClick={updateLocation}>Update Location</button> */}
    </div>
  );
};

export default ManageChefLocation;
