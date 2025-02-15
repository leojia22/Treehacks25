import React, { Component, ChangeEvent, useState } from 'react';

const home = () => {
    const [age, setAge] = useState(0)
    const [weight, setWeight] = useState(0)

    const handleWeightChange = (event) => {
        setWeight(event.target.value)
    }

    const handleAgeChange = (event) => {
        setAge(event.target.value)
    }

    const handleCreatePlanClick = () => {
        
    }

  return (
    <div>
        Enter weight:
        <input 
            type="number"
            id="weight"
            value={weight}
            onChange={handleWeightChange}
            placeholder="Enter weight"
        />
      <br />
      <br />
      Enter age:
      <input 
        type="number"
        id="age"
        value={age}
        onChange={handleAgeChange}
        placeholder="Enter age"
      />

    <button onClick={handleCreatePlanClick}>Create Plan</button>
    </div>
  )
}

export default home
