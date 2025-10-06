import express from "express";
import multer from "multer";
import fs from "fs";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Register endpoint
app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const connection = await connectDB();
    const db = connection.db;

    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userDoc: User = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    };

    const result = await db.collection("users").insertOne(userDoc);

    // Generate JWT token (an auth token given by server to the client which is stored as a cookie)
    const token = jwt.sign(
      { userId: result.insertedId, username: userDoc.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.insertedId,
        username: userDoc.username,
        email: userDoc.email
      },
      token
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Error creating user" });
  }
});

// Login endpoint
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const connection = await connectDB();
    const db = connection.db;

    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Find user by username or email
    const user = await db.collection("users").findOne({
      $or: [{ username: username.trim() }, { email: username.trim().toLowerCase() }]
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Error during login" });
  }
});

// Upload endpoint - stores photo and creates post (requires authentication)
app.post("/upload", authenticateToken, upload.single("image"), async (req: any, res) => {
  try {
    const filePath = req.file?.path;
    if (!filePath) return res.status(400).json({ error: "No file uploaded" });

    // Extract metadata from request body
    const { title, caption, tags, latitude, longitude } = req.body;

    if (!title || !latitude || !longitude) {
      return res.status(400).json({ 
        error: "Missing required fields: title, latitude, longitude" 
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

    // Get user from token
    const userId = new ObjectId(req.user.userId);

    // Create Photo document
    const photoDoc: Photo = {
      ownerId: userId,
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
      createdBy: userId,
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
      photoId: photoResult.insertedId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error uploading memory" });
  }
});

// Get personalized posts (user's own posts + posts where they're tagged)
app.get("/posts", authenticateToken, async (req: any, res) => {
  try {
    const connection = await connectDB();
    const db = connection.db;

    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const userId = new ObjectId(req.user.userId);
    const username = req.user.username;

    // Get posts where:
    // 1. User is the creator
    // 2. User is tagged in the post
    const posts = await db.collection("posts").aggregate([
      {
        $match: {
          $or: [
            { createdBy: userId }, // User's own posts
            { tags: { $in: [username] } } // Posts where user is tagged
          ]
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
    const transformedPosts = posts.map((post:any )=> ({
      _id: post._id,
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
      createdAt: post.createdAt,
      isOwnPost: post.createdBy.toString() === userId.toString()
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
    const transformedPosts = posts.map((post: any )=> ({
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

// Delete post by ID (only allow users to delete their own posts)
app.delete("/posts/:id", authenticateToken, async (req: any, res) => {
  try {
    const postId = req.params.id;
    const userId = new ObjectId(req.user.userId);

    // Validate ObjectId format
    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Invalid post ID format" });
    }

    const connection = await connectDB();
    const db = connection.db;

    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // First, get the post to check ownership and find the associated photo
    const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the user owns this post
    if (post.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own memories" });
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