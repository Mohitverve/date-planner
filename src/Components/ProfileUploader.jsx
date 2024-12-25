// ProfileUploader.jsx
import React, { useState } from "react";
import axios from "axios";

// If you want to store in Firestore:
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";  // Adjust path as needed

const ProfileUploader = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // 1) Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // 2) Handle the upload process
  const handleUpload = async () => {
    if (!user?.uid) {
      alert("No user logged in.");
      return;
    }
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    setUploading(true);

    try {
      // 2a) Prepare the parameters for signature
      const timestamp = Math.round(new Date().getTime() / 1000);
      const folder = "profile_pics"; // or any folder name in Cloudinary
      const public_id = `user_${user.uid}_${timestamp}`; // a naming scheme

      // 2b) Request signature from our Node server
      const sigResponse = await axios.post("http://localhost:5000/get-signature", {
        folder,
        public_id,
        timestamp,
      });

      const { signature, apiKey, cloudName } = sigResponse.data;
      if (!signature) {
        throw new Error("No signature returned from server");
      }

      // 2c) Create FormData to POST to Cloudinary
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("folder", folder);
      formData.append("public_id", public_id);
      formData.append("signature", signature);

      // 2d) Upload directly to Cloudinary
      const uploadURL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const cloudinaryRes = await axios.post(uploadURL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Cloudinary response:", cloudinaryRes.data);

      // 2e) Grab the secure_url
      const secureUrl = cloudinaryRes.data.secure_url;
      setImageUrl(secureUrl);

      // 2f) [Optional] Store the URL in Firestore user doc
      // For example:
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: secureUrl,
      });

      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Upload Profile Picture</h3>

      <input type="file" onChange={handleFileChange} />

      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {/* Show the uploaded image if available */}
      {imageUrl && (
        <div style={{ marginTop: 20 }}>
          <p>Uploaded Image:</p>
          <img src={imageUrl} alt="uploaded" style={{ maxWidth: 200 }} />
        </div>
      )}
    </div>
  );
};

export default ProfileUploader;