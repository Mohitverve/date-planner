import React, { useState } from "react";
import axios from "axios";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase"; // Adjust the path to your firebase config

const ProfileUploader = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Handle the upload process
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
    setUploadProgress(0);

    try {
      // Prepare parameters for signature
      const timestamp = Math.round(new Date().getTime() / 1000);
      const folder = "profile_pics";
      const public_id = `user_${user.uid}_${timestamp}`;

      // 1. Request signature from your Vercel serverless function
      const sigResponse = await axios.post(
        "/api/getSignature", // Relative path to the serverless function
        { folder, public_id, timestamp },
        { headers: { "Content-Type": "application/json" } }
      );

      const { signature, apiKey, cloudName } = sigResponse.data;
      if (!signature) {
        throw new Error("No signature returned from serverless function");
      }

      // 2. Upload the image to Cloudinary
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("folder", folder);
      formData.append("public_id", public_id);
      formData.append("signature", signature);

      const cloudinaryUploadURL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const cloudinaryRes = await axios.post(cloudinaryUploadURL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      console.log("Cloudinary response:", cloudinaryRes.data);

      // 3. Get the uploaded image URL
      const secureUrl = cloudinaryRes.data.secure_url;
      setImageUrl(secureUrl);

      // 4. Update the user's profile in Firestore (optional)
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: secureUrl,
      });

      alert("Image uploaded successfully!");
    } catch (error) {
      // Handle various error states
      if (error.response) {
        console.error("Server Error:", error.response.data);
        alert(`Server Error: ${error.response.data.error || error.message}`);
      } else if (error.request) {
        console.error("Network Error:", error.message);
        alert("Network Error: Unable to reach the server.");
      } else {
        console.error("Error:", error.message);
        alert(`Error: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Upload Profile Picture</h3>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? `Uploading... ${uploadProgress}%` : "Upload"}
      </button>
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
