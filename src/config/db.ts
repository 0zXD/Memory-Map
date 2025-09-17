import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const password = encodeURIComponent("jatin123");
    const uri = `mongodb+srv://MemoryMap:${password}@cluster0.9ym5xnq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&authSource=admin`;
    

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10s timeout
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
