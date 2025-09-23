"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const upload = (0, multer_1.default)({ dest: "uploads/" }); // Temporary storage for uploaded files
// Enable CORS for frontend communication
app.use((0, cors_1.default)({
    origin: ['http://localhost:5500/frontend/public/main.html', 'http://127.0.0.1:5500/frontend/public/main.html'], // Add your frontend URL
    credentials: true
}));
// Parse JSON bodies
app.use(express_1.default.json());
// Upload endpoint - stores photo and creates post
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const filePath = req.file?.path;
        if (!filePath)
            return res.status(400).json({ error: "No file uploaded" });
        // Extract metadata from request body
        const { title, caption, tags, latitude, longitude, username } = req.body;
        if (!title || !latitude || !longitude || !username) {
            return res.status(400).json({
                error: "Missing required fields: title, latitude, longitude, username"
            });
        }
        // Convert file to Base64
        const fileData = fs_1.default.readFileSync(filePath);
        const base64String = fileData.toString("base64");
        // Get file MIME type
        const mimeType = req.file?.mimetype;
        // Get MongoDB connection
        const connection = await (0, db_1.default)();
        const db = connection.db;
        if (!db) {
            return res.status(500).json({ error: "Database connection failed" });
        }
        // Find or create user
        let user = await db.collection("users").findOne({ username: username });
        let userId;
        if (!user) {
            // Create new user
            const newUser = {
                username: username,
                createdAt: new Date()
            };
            const userResult = await db.collection("users").insertOne(newUser);
            userId = userResult.insertedId;
        }
        else {
            userId = user._id;
        }
        // Create Photo document
        const photoDoc = {
            ownerId: userId,
            filename: req.file?.originalname,
            mimeType: mimeType || "image/jpeg",
            base64: base64String,
            createdAt: new Date()
        };
        // Insert photo
        const photoResult = await db.collection("photos").insertOne(photoDoc);
        // Create Post document
        const postDoc = {
            title,
            photoId: photoResult.insertedId,
            caption: caption || "",
            tags: tags ? tags.split(',').map((tag) => tag.trim()) : [],
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
        fs_1.default.unlinkSync(filePath);
        res.status(200).json({
            message: "Memory uploaded successfully",
            postId: postResult.insertedId,
            photoId: photoResult.insertedId,
            userId: userId
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error uploading memory" });
    }
});
// Get all posts with photos
app.get("/posts", async (req, res) => {
    try {
        const connection = await (0, db_1.default)();
        const db = connection.db;
        if (!db) {
            return res.status(500).json({ error: "Database connection failed" });
        }
        // Get posts with their photos and user information using aggregation
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
            username: post.user.username,
            userId: post.user._id
        }));
        res.status(200).json(transformedPosts);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching posts" });
    }
});
// Get single post by ID
app.get("/posts/:id", async (req, res) => {
    try {
        const connection = await (0, db_1.default)();
        const db = connection.db;
        if (!db) {
            return res.status(500).json({ error: "Database connection failed" });
        }
        const post = await db.collection("posts").aggregate([
            {
                $match: { _id: new mongodb_1.ObjectId(req.params.id) }
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
            username: post[0].user.username,
            userId: post[0].user._id
        };
        res.status(200).json(transformedPost);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching post" });
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
