# Memory Map

> **A visual journey through your memories**  
> Create, share, and explore beautiful interactive maps of your life's adventures

![Memory Map Banner](https://img.shields.io/badge/Memory%20Map-Visual%20Travel%20Journal-emerald?style=for-the-badge&logo=map)

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1+-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Express](https://img.shields.io/badge/Express.js-4.18+-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)

---

## What is Memory Map?

Memory Map is a **full-stack web application** that transforms your travel experiences into beautiful, interactive visual stories. Think of it as your personal travel journal meets social media, where every adventure is mapped, every photo tells a story, and every memory can be shared with friends.

### Key Features

- **Interactive Mapping** - Pin your memories to real-world locations using Leaflet.js
- **Photo Storytelling** - Upload photos with rich descriptions and context
- **Social Sharing** - Tag friends and create collaborative memory collections
- **Dark Mode Support** - Seamless light/dark theme switching
- **Secure Authentication** - JWT-based user authentication system
- **Responsive Design** - Beautiful UI that works on all devices
- **Real-time Geolocation** - Find and map your current location instantly

---

## Architecture Overview

Memory Map follows a modern **microservices architecture** with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (Static)      │◄──►│   (REST API)    │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ • HTML/CSS/JS   │    │ • Express.js    │    │ • Users         │
│ • Leaflet Maps  │    │ • TypeScript    │    │ • Posts         │
│ • Tailwind CSS  │    │ • JWT Auth      │    │ • Photos        │
│ • Dark Mode     │    │ • File Upload   │    │ • Geospatial    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | HTML5, CSS3, TypeScript | User interface and interactions |
| **Styling** | Tailwind CSS | Responsive, modern UI design |
| **Maps** | Leaflet.js | Interactive mapping functionality |
| **Backend** | Node.js, Express.js | RESTful API server |
| **Database** | MongoDB | Document storage with geospatial indexing |
| **Authentication** | JWT + bcrypt | Secure user authentication |
| **File Upload** | Multer | Image processing and storage |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **MongoDB** (local or Atlas)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/0zXD/Memory-Map.git
   cd Memory-Map
   ```

2. **Set up environment variables**
   ```bash
   # Create .env in backend directory
   echo "JWT_SECRET=your_super_secret_jwt_key_here" > backend/.env
   echo "MONGO_URI_PASS=your_mongodb_atlas_password" >> backend/.env
   echo "PORT=8080" >> backend/.env
   ```

3. **Install and start backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Serve the frontend**
   ```bash
   # In a new terminal
   npx serve frontend/public -p 3000
   # Or use VS Code Live Server extension
   ```

5. **Access the application**
   - Frontend: <http://localhost:3000>
   - Backend API: <http://localhost:8080>

### Manual Installation

<details>
<summary><b>Click to expand manual setup instructions</b></summary>

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run dev
```

#### Frontend Setup

The frontend is static HTML/CSS/TypeScript served from the `frontend/public` directory. You can serve it using any static server:

```bash
# Using Node.js serve (recommended)
npx serve frontend/public -p 3000

# Using VS Code Live Server extension
# Right-click on main.html → "Open with Live Server"
```

</details>

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Create new user account | `{username, email, password}` |
| `POST` | `/auth/login` | Authenticate user | `{username, password}` |

### Memory Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/upload` | Create new memory with photo | Yes |
| `GET` | `/posts` | Get user's personalized memories | Yes |
| `GET` | `/posts/:id` | Get specific memory by ID | No |
| `GET` | `/posts/location/:lat/:lng` | Get memories near location | No |
| `DELETE` | `/posts/:id` | Delete user's own memory | Yes |

### Example API Usage

<details>
<summary><b>Creating a Memory</b></summary>

```javascript
const formData = new FormData();
formData.append('image', photoFile);
formData.append('title', 'Sunset in Santorini');
formData.append('caption', 'Most beautiful sunset ever!');
formData.append('tags', 'Sarah, Mike, Greece');
formData.append('latitude', '36.4618');
formData.append('longitude', '25.3753');

fetch('/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`
  },
  body: formData
});
```

</details>

---

## Database Schema

Memory Map uses MongoDB with the following collections:

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (bcrypt hashed),
  createdAt: Date
}
```

### Posts Collection
```javascript
{
  _id: ObjectId,
  title: String,
  photoId: ObjectId (ref: Photos),
  caption: String,
  tags: [String], // Friend names/tags
  createdBy: ObjectId (ref: Users),
  createdAt: Date,
  location: {
    type: "Point",
    coordinates: [longitude, latitude] // GeoJSON format
  }
}
```

### Photos Collection
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId (ref: Users),
  filename: String,
  mimeType: String, // image/jpeg, image/png, image/webp
  base64: String, // Base64 encoded image data
  createdAt: Date
}
```

---

## Features Deep Dive

### Interactive Mapping

- **Leaflet.js Integration**: Professional-grade mapping with OpenStreetMap tiles
- **Custom Markers**: Beautiful, animated pin designs for different memory types
- **Geolocation Support**: Automatic location detection with user permission
- **Click-to-Add**: Intuitive memory creation by clicking anywhere on the map

### Photo Management

- **Multi-format Support**: JPEG, PNG, WebP image uploads
- **Base64 Storage**: Efficient image storage directly in MongoDB
- **File Size Limits**: Configurable upload size restrictions
- **Image Preview**: Real-time photo preview before upload

### Social Features

- **Friend Tagging**: Tag friends in memories for collaborative storytelling
- **Personalized Feeds**: See your own memories plus ones where you're tagged
- **Memory Sharing**: Easy sharing of travel experiences

### UI/UX Design

- **Tailwind CSS**: Utility-first CSS framework for rapid development
- **Dark Mode**: System-aware theme switching with local storage persistence
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Glass Morphism**: Modern design trends with backdrop filters

---

## Security Features

- **JWT Authentication**: Stateless, secure token-based auth
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Input Validation**: Server-side validation for all endpoints
- **CORS Configuration**: Configured for frontend-backend communication
- **File Upload Security**: Type validation and size limits

---

## Project Structure

```
Memory_Map/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── server.ts        # Express app setup & routes
│   │   ├── main.ts          # Frontend TypeScript logic
│   │   ├── config/
│   │   │   └── db.ts        # MongoDB connection
│   │   ├── models/
│   │   │   └── types.ts     # TypeScript interfaces
│   │   └── setup/
│   │       └── initDB.ts    # Database initialization
│   ├── package.json         # Dependencies & scripts
│   ├── dockerfile          # Container configuration
│   └── uploads/            # Temporary file storage
├── frontend/               # Static web frontend
│   ├── public/
│   │   ├── main.html       # Main application interface
│   │   ├── auth.html       # Login/register page
│   │   └── Styles/
│   │       └── style.css   # Custom styles
│   └── dockerfile         # Frontend container
├── docker-compose.yml     # Multi-container setup
├── tsconfig.json         # TypeScript configuration
└── README.md            # You are here!
```

---

## Development Workflow

### Adding New Features

1. **Backend Changes**:
   ```bash
   cd backend
   npm run dev  # Start with hot reload
   ```

2. **Frontend Changes**:
   - Edit HTML/CSS/JS in `frontend/public/`
   - Use VS Code Live Server or similar for hot reload

3. **Database Changes**:
   - Update TypeScript interfaces in `models/types.ts`
   - Modify collection schemas in `setup/initDB.ts`

### Build for Production

```bash
# Build backend TypeScript
cd backend && npm run build

# Start production server
npm start
```

---

## Future Roadmap

- **Mobile App** - React Native companion app
- **Real-time Collaboration** - WebSocket-based live sharing
- **Advanced Analytics** - Travel statistics and insights
- **Memory Collections** - Organize memories into themed albums
- **AI-powered Tagging** - Automatic location and object detection
- **Export Features** - PDF/slideshow generation
- **Integration APIs** - Connect with Instagram, Google Photos

---

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write descriptive commit messages
- Add comments for complex logic
- Test your changes thoroughly

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Team

Created with love by [@0zXD](https://github.com/0zXD)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/0zXD/Memory-Map/issues)
- **Discussions**: [GitHub Discussions](https://github.com/0zXD/Memory-Map/discussions)

---

<div align="center">

**Star this repository if you found it helpful!**

*Made for adventurers, by adventurers*

</div>