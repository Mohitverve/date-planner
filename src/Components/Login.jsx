import React, { useState } from "react";
import { Button, Modal, Radio, Space } from "antd";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const auth = getAuth();
  const db = getFirestore();
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      // Ensure Firebase auth is initialized
      if (!auth) {
        throw new Error("Firebase Auth not initialized properly.");
      }
  
      const result = await signInWithPopup(auth, provider);
      if (!result || !result.user) {
        throw new Error("Google Sign-In failed. No user information returned.");
      }
  
      const { uid, displayName, email, photoURL } = result.user;
      if (!uid || !email) {
        throw new Error("Invalid user data returned from Google Sign-In.");
      }
  
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        // Existing user
        navigate("/home");
      } else {
        // New user
        setUser({ uid, displayName, email, photoURL });
        setIsModalVisible(true); // Show the role selection modal
      }
    } catch (error) {
      console.error("Authentication Error:", error.message);
      alert("Failed to authenticate. Please try again.");
    }
  };
  

  const handleRoleSelection = async () => {
    if (!role) return;

    try {
      const userDoc = doc(db, "users", user.uid);
      await setDoc(userDoc, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role,
      });
      setIsModalVisible(false);
      alert("Role saved successfully!");
      navigate("/Home"); // Navigate to Home page
    } catch (error) {
      console.error("Error saving role to Firestore:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h1>Login</h1>
      <Button type="primary" onClick={handleGoogleSignIn}>
        Sign in with Google
      </Button>

      <Modal
        title="Select Your Role"
        visible={isModalVisible}
        onOk={handleRoleSelection}
        onCancel={() => setIsModalVisible(false)}
        okText="Save"
      >
        <Space direction="vertical">
          <Radio.Group onChange={(e) => setRole(e.target.value)} value={role}>
            <Radio value="bf">Boyfriend</Radio>
            <Radio value="gf">Girlfriend</Radio>
          </Radio.Group>
        </Space>
      </Modal>
    </div>
  );
};

export default Login;
