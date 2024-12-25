// App.js
import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { auth } from "./Components/firebase"; // your firebase config
import Home from "./Pages/Home";           // or wherever you placed it
import Login from "./Components/Login";    // or your custom login
import BookingForm from "./Components/BookngForm";
import BookingsList from "./Components/BookingsList";
import Profile from "./Components/Profile";

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home user={currentUser} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/BookingForm" element={<BookingForm user={currentUser} />} />
        <Route path="/BookingsList" element={<BookingsList user={currentUser} />} />
        <Route path="/profile" element={<Profile user={currentUser} />} />

        <Route path="/" element={<Home user={currentUser} />} />
      </Routes>
    </Router>
  );
};

export default App;
