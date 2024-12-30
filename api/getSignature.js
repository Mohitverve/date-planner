import { v2 as cloudinary } from "cloudinary";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Configure Cloudinary using environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const { folder, public_id, timestamp } = req.body;

    if (!folder || !public_id || !timestamp) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const signature = cloudinary.utils.api_sign_request(
      { folder, public_id, timestamp },
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    console.error("Error generating signature:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
