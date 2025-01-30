import React, { useEffect } from 'react'
import { initFlowbite } from "flowbite";
import { Rating, RatingStar } from 'flowbite-react';

const ChefRating = ({chef}) => {
    const {rating} = chef;
 
console.log('reating',rating)

    useEffect(() => {
    initFlowbite();
  }, []);

  return (
   <Rating size="lg">
     {Array.from({ length: 5 }, (_, i) => (
        <RatingStar key={i} filled={i < Math.round(rating)} />
      ))}
   </Rating>
  )
}

export default ChefRating