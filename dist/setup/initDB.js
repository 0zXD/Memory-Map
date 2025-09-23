"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = void 0;
const db_1 = __importDefault(require("../config/db"));
const initDatabase = async () => {
    const db = await (0, db_1.default)();
    // USERS collection
    await db.createCollection("users", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["username", "email", "passwordHash", "createdAt"],
                additionalProperties: false,
                properties: {
                    username: { bsonType: "string" },
                    email: { bsonType: "string" },
                    passwordHash: { bsonType: "string" },
                    profile: { bsonType: "object" },
                    roles: { bsonType: "array", items: { bsonType: "string" } },
                    createdAt: { bsonType: "date" }
                }
            }
        }
    }).catch(() => console.log("users collection already exists"));
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    // POSTS collection
    await db.createCollection("posts", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["title", "photoId", "createdBy", "createdAt", "location"],
                additionalProperties: false,
                properties: {
                    title: { bsonType: "string" },
                    photoId: { bsonType: "objectId" },
                    caption: { bsonType: "string" },
                    tags: { bsonType: "array", items: { bsonType: "string" } },
                    sharedWith: { bsonType: "array", items: { bsonType: "objectId" } },
                    createdBy: { bsonType: "objectId" },
                    createdAt: { bsonType: "date" },
                    location: {
                        bsonType: "object",
                        required: ["type", "coordinates"],
                        properties: {
                            type: { enum: ["Point"] },
                            coordinates: {
                                bsonType: "array",
                                minItems: 2,
                                maxItems: 2,
                                items: { bsonType: "double" }
                            }
                        }
                    }
                }
            }
        }
    }).catch(() => console.log("posts collection already exists"));
    await db.collection("posts").createIndex({ location: "2dsphere" });
    // PHOTOS collection
    await db.createCollection("photos", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["ownerId", "mimeType", "base64", "sizeBytes", "createdAt"],
                additionalProperties: false,
                properties: {
                    ownerId: { bsonType: "objectId" },
                    filename: { bsonType: "string" },
                    mimeType: { bsonType: "string", enum: ["image/png", "image/jpeg", "image/webp"] },
                    base64: { bsonType: "string" },
                    sizeBytes: { bsonType: "int", minimum: 0 },
                    hash: { bsonType: "string" },
                    visibility: { enum: ["private", "shared", "public"] },
                    createdAt: { bsonType: "date" }
                }
            }
        }
    }).catch(() => console.log("photos collection already exists"));
    await db.collection("photos").createIndex({ ownerId: 1 });
    console.log("Collections + indexes are ready");
};
exports.initDatabase = initDatabase;
