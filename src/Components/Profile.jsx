// Profile.jsx
import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../Components/firebase"; // Make sure you export both db and storage
import { Form, Input, Button, Upload, message, Spin, Avatar } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const Profile = ({ user }) => {
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) {
      message.error("No authenticated user found. Please log in.");
      navigate("/login");
      return;
    }

    // Fetch user doc from Firestore
    const fetchUserProfile = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setDisplayName(userData.displayName || "");
          setPhotoURL(userData.photoURL || "");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        message.error("Could not load user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, navigate]);

  const handleFormSubmit = async () => {
    try {
      if (!displayName) {
        message.error("Display name is required.");
        return;
      }
      setLoading(true);

      // Update Firestore doc
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName,
        photoURL: photoURL,
      });

      message.success("Profile updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleUpload = async (file) => {
    if (!file) return;

    try {
      setLoading(true);
      // 1) Create a Storage ref
      const storageRef = ref(storage, `profilePictures/${user.uid}/${file.name}`);
      // 2) Upload the file
      await uploadBytes(storageRef, file);
      // 3) Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      setPhotoURL(downloadURL);
      message.success("Photo uploaded!");
    } catch (error) {
      console.error("Error uploading file:", error);
      message.error("Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  // Ant Design's Upload component uses a "beforeUpload" callback to handle custom uploads
  const beforeUpload = (file) => {
    // You could do file type checks here
    // We'll just do the upload
    handleUpload(file);
    // Return false to prevent antd from auto uploading
    return false;
  };

  if (loading) {
    return <Spin style={{ display: "block", margin: "auto", marginTop: "20%" }} />;
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>Profile</h2>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Avatar
          size={100}
          src={photoURL || "https://via.placeholder.com/150?text=No+Photo"}
        />
      </div>
      <Form layout="vertical" onFinish={handleFormSubmit}>
        <Form.Item label="Display Name">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
        </Form.Item>

        <Form.Item label="Profile Picture">
          <Upload
            name="profilePic"
            showUploadList={false}
            beforeUpload={beforeUpload}
          >
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
          {photoURL && (
            <div style={{ marginTop: 10 }}>
              <img
                src={photoURL}
                alt="Profile"
                style={{ maxWidth: 200, borderRadius: "8px" }}
              />
            </div>
          )}
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          style={{ background: "#ff69b4", border: "none" }}
        >
          Save Changes
        </Button>
      </Form>
    </div>
  );
};

export default Profile;
