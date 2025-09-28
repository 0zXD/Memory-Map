import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const connectDB = async (): Promise<mongoose.Connection> => {
  try {
    const password = encodeURIComponent(process.env.MONGO_URI_PASS || "");
    const uri = `mongodb+srv://MemoryMap:${password}@cluster0.9ym5xnq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&authSource=admin`;

    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");
    return connection.connection; 
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;