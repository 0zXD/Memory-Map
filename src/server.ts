import express from "express";
import connectDB from "./config/db";


const app = express();

// Connect to MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("Memory Map backend running!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

