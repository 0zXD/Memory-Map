import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface Post {
  _id?: ObjectId;
  title: string;
  photoId: ObjectId;
  caption?: string;
  tags?: string[];
  createdBy: ObjectId;
  createdAt: Date;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface Photo {
  _id?: ObjectId;
  ownerId: ObjectId;
  filename?: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  base64: string;
  createdAt: Date;
}
