"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const password = encodeURIComponent("jatin123");
        const uri = `mongodb+srv://MemoryMap:${password}@cluster0.9ym5xnq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&authSource=admin`;
        const connection = await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 10000, // 10s timeout
        });
        console.log("MongoDB connected successfully");
        return connection.connection; // Return the connection object
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
exports.default = connectDB;
