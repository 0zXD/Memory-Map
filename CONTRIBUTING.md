# Contributing to Memory Map

Thank you for considering contributing to **Memory Map**! 
We welcome contributions of all kinds, including bug fixes, feature implementations, documentation improvements, and more. This guide will help you get started.

---

## How to Contribute

### Reporting Issues

If you encounter a bug or have a question, please [open an issue](https://github.com/Open-Source-Chandigarh/memory-map/issues) with the following details:
- A clear and descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots or logs, if applicable

### Suggesting Features

We’re always looking for ways to improve Memory Map! If you have an idea for a new feature:
1. Check the [existing issues](https://github.com/Open-Source-Chandigarh/memory-map/issues) to see if it’s already being discussed.
2. If not, [open a new issue](https://github.com/Open-Source-Chandigarh/memory-map/issues) and describe:
   - The problem your feature solves
   - How it would work
   - Any alternatives you’ve considered

### Submitting Code Changes

1. Fork the repository and clone your fork.
2. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit them.
4. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request (PR) to the `main` branch of the original repository.

---

## Development Setup

### Prerequisites

Make sure you have the following installed:
- **Node.js** (v20+)
- **npm** (v8+)
- **MongoDB** (local or Atlas)
- **TypeScript** (already included in `devDependencies`)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/Open-Source-Chandigarh/memory-map.git
   cd memory-map/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the `main` directory:
     ```env
     PORT=8080
     MONGO_URI_PASS=your_mongo_password
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the API at `http://localhost:8080`.

---

## Project Structure

Here’s an overview of the backend structure:

```
backend/
├── src/
│   ├── main.ts          # Entry point
│   ├── server.ts        # Express server setup
│   ├── config/          # Configuration files (e.g., database)
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Custom middleware
│   ├── models/          # Mongoose schemas and types
│   ├── routes/          # API route definitions
│   ├── setup/           # Initialization scripts
│   ├── utils/           # Utility functions
│   └── uploads/         # Temporary file storage
├── package.json         # Project metadata and dependencies
├── tsconfig.json        # TypeScript configuration
└── Dockerfile           # (Optional) Docker setup
```

---

## Coding Guidelines

To maintain code quality and consistency, please follow these guidelines:

1. **Code Style**:
   - Use **TypeScript** for all code.
   - Follow the existing code style (e.g., indentation, naming conventions).
   - Use `Prettier` or `ESLint` for formatting.

2. **Testing**:
   - Write unit tests for new features or bug fixes.
   - Use a testing framework like `Jest` (if applicable).

3. **Documentation**:
   - Document your code with clear comments.
   - Update the `README.md` or other relevant documentation if your changes affect the project setup or usage.

---

## Commit Message Guidelines

Use the following format for commit messages:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic changes)
- **refactor**: Code refactoring (no new features or bug fixes)
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (e.g., updating dependencies)

Example:
```
feat(auth): add JWT authentication to login endpoint
```

---

Thank you for contributing to Memory Map! Your help makes this project better for everyone. 
