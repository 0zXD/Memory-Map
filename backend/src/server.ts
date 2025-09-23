import express from "express";
import multer from "multer";
import fs from "fs";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import { Post, Photo, User } from "./models/types";
dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files

// Enable CORS for frontend communication
app.use(cors({
   origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ], // Add your frontend URL
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Upload endpoint - stores photo and creates post
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file?.path;
    if (!filePath) return res.status(400).json({ error: "No file uploaded" });

    // Extract metadata from request body
    const { title, caption, tags, latitude, longitude, username } = req.body;

    if (!title || !latitude || !longitude || !username) {
      return res.status(400).json({ 
        error: "Missing required fields: title, latitude, longitude, username" 
      });
    }

    // Convert file to Base64
    const fileData = fs.readFileSync(filePath);
    const base64String = fileData.toString("base64");

    // Get file MIME type
    const mimeType = req.file?.mimetype as "image/png" | "image/jpeg" | "image/webp";

    // Get MongoDB connection
    const connection = await connectDB();
    const db = connection.db;

    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Check if user exists, if not create one
    let user = await db.collection("users").findOne({ username: username.trim() });
    if (!user) {
      const userDoc: User = {
        username: username.trim(),
        createdAt: new Date()
      };
      const userResult = await db.collection("users").insertOne(userDoc);
      user = { _id: userResult.insertedId, ...userDoc };
    }

    // Create Photo document
    const photoDoc: Photo = {
      ownerId: user._id as ObjectId,
      filename: req.file?.originalname,
      mimeType: mimeType || "image/jpeg",
      base64: base64String,
      createdAt: new Date()
    };

    // Insert photo
    const photoResult = await db.collection("photos").insertOne(photoDoc);

    // Create Post document
    const postDoc: Post = {
      title,
      photoId: photoResult.insertedId,
      caption: caption || "",
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      createdBy: user._id as ObjectId,
      createdAt: new Date(),
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)] // [lng, lat]
      }
    };

    // Insert post
    const postResult = await db.collection("posts").insertOne(postDoc);

    // Clean up temporary file
    fs.unlinkSync(filePath);

    res.status(200).json({
      message: "Memory uploaded successfully",
      postId: postResult.insertedId,
      photoId: photoResult.insertedId,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error uploading memory" });
  }
});

// Get all posts with photos
app.get("/posts", async (req, res) => {
  try {
    const connection = await connectDB();
    const db = connection.db;

    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Get posts with their photos and user info using aggregation
    const posts = await db.collection("posts").aggregate([
      {
        $lookup: {
          from: "photos",
          localField: "photoId",
          foreignField: "_id",
          as: "photo"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$photo"
      },
      {
        $unwind: "$user"
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    // Transform data for frontend
    const transformedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      description: post.caption,
      friends: post.tags, // Using tags as friends for now
      date: post.createdAt.toISOString().split('T')[0],
      lat: post.location.coordinates[1], // latitude
      lng: post.location.coordinates[0], // longitude
      imageData: `data:${post.photo.mimeType};base64,${post.photo.base64}`,
      imageId: post.photo._id,
      user: {
        id: post.user._id,
        username: post.user.username
      },
      createdAt: post.createdAt
    }));

    res.status(200).json(transformedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching posts" });
  }
});

// Get single post by ID
app.get("/posts/:id", async (req, res) => {
  try {
    const connection = await connectDB();
    const db = connection.db;

    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const post = await db.collection("posts").aggregate([
      {
        $match: { _id: new ObjectId(req.params.id) }
      },
      {
        $lookup: {
          from: "photos",
          localField: "photoId",
          foreignField: "_id",
          as: "photo"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$photo"
      },
      {
        $unwind: "$user"
      }
    ]).toArray();

    if (post.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const transformedPost = {
      id: post[0]._id,
      title: post[0].title,
      description: post[0].caption,
      friends: post[0].tags,
      date: post[0].createdAt.toISOString().split('T')[0],
      lat: post[0].location.coordinates[1],
      lng: post[0].location.coordinates[0],
      imageData: `data:${post[0].photo.mimeType};base64,${post[0].photo.base64}`,
      imageId: post[0].photo._id,
      user: {
        id: post[0].user._id,
        username: post[0].user.username
      },
      createdAt: post[0].createdAt
    };

    res.status(200).json(transformedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching post" });
  }
});

// Get posts by location (within a radius)
app.get("/posts/location/:lat/:lng", async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 0.01; // Default 0.01 degree radius (~1km)

    const connection = await connectDB();
    const db = connection.db;

    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Find posts within the specified radius
    const posts = await db.collection("posts").aggregate([
      {
        $match: {
          location: {
            $geoWithin: {
              $centerSphere: [
                [parseFloat(lng), parseFloat(lat)], // [longitude, latitude]
                radius / 3963.2 // Convert to radians (Earth radius in miles)
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "photos",
          localField: "photoId",
          foreignField: "_id",
          as: "photo"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$photo"
      },
      {
        $unwind: "$user"
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    // Transform data for frontend
    const transformedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      description: post.caption,
      friends: post.tags,
      date: post.createdAt.toISOString().split('T')[0],
      lat: post.location.coordinates[1],
      lng: post.location.coordinates[0],
      imageData: `data:${post.photo.mimeType};base64,${post.photo.base64}`,
      imageId: post.photo._id,
      user: {
        id: post.user._id,
        username: post.user.username
      },
      createdAt: post.createdAt
    }));

    res.status(200).json(transformedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching posts by location" });
  }
});

// Delete post by ID
app.delete("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;

    // Validate ObjectId format
    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Invalid post ID format" });
    }

    const connection = await connectDB();
    const db = connection.db;

    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // First, get the post to find the associated photo
    const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Delete the associated photo
    const photoDeleteResult = await db.collection("photos").deleteOne({ _id: post.photoId });
    
    // Delete the post
    const postDeleteResult = await db.collection("posts").deleteOne({ _id: new ObjectId(postId) });

    if (postDeleteResult.deletedCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({ 
      message: "Memory deleted successfully",
      deletedPost: postDeleteResult.deletedCount > 0,
      deletedPhoto: photoDeleteResult.deletedCount > 0
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Error deleting memory" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Memory Map API is running!" });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend should connect to: http://localhost:${PORT}`);
});