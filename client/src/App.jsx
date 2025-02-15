import React, { Component, ChangeEvent, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/home.jsx'
import { useNavigate } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
      <nav>
        <Link to="/"></Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>

      </BrowserRouter>
    </>
  )
}

export default App
