import mongoose from "mongoose";

const connectDB = async (): Promise<mongoose.Connection> => {
  try {
    const password = encodeURIComponent("jatin123");
    const uri = `mongodb+srv://MemoryMap:${password}@cluster0.9ym5xnq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&authSource=admin`;

    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10s timeout
    });

    console.log("MongoDB connected successfully");
    return connection.connection; // Return the connection object
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;