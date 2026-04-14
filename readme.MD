# Real-Time Chat Application

A full-stack, real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js), Socket.io for live messaging, and modern tools like Zustand, Tailwind CSS, and Redis.

## 🚀 Features

* **Real-time Messaging:** Instant message delivery and reception using `Socket.io`.
* **Authentication & Authorization:** Secure user authentication using JSON Web Tokens (JWT) and `bcryptjs` for password hashing.
* **Media Sharing:** Upload and share images within chats, powered by `Cloudinary`.
* **GIF Support:** Integrated Giphy API to send GIFs in conversations.
* **Email Notifications:** Transactional emails (e.g., for welcome emails, password resets, or OTPs) configured with `Nodemailer` and Brevo SMTP.
* **Modern State Management:** Global frontend state managed efficiently via `Zustand`.
* **Beautiful UI:** Responsive, modern interface built with `Tailwind CSS`, `DaisyUI`, and `Lucide React` icons.
* **Caching & Performance:** `ioredis` integration on the backend for fast data retrieval or Socket.io scaling.

## 🛠️ Tech Stack

### Frontend
* **Framework:** React 19 (via Vite)
* **Routing:** React Router DOM
* **State Management:** Zustand
* **Styling:** Tailwind CSS v4 + DaisyUI
* **Real-time Client:** Socket.io-client
* **Icons & Toasts:** Lucide React, React Hot Toast
* **HTTP Client:** Axios

### Backend
* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js 5
* **Database:** MongoDB via Mongoose
* **In-Memory Store:** Redis (via ioredis)
* **Real-time Server:** Socket.io
* **Authentication:** JWT (jsonwebtoken) & Bcryptjs
* **File Uploads:** Cloudinary
* **Email Services:** Nodemailer (using Brevo SMTP)

## 📁 Project Structure

The project is structured as a monorepo containing both the frontend and backend applications.

```text
├── Backend/                 # Node.js/Express backend API and Socket.io server
│   ├── src/                 # Backend source code (controllers, models, routes, etc.)
│   └── package.json         # Backend dependencies
├── frontend/                # Vite/React frontend application
│   ├── src/                 # Frontend source code (components, pages, store, etc.)
│   └── package.json         # Frontend dependencies
├── package.json             # Root package.json for managing both workspaces
└── README.md
```

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your local machine:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
* [Redis](https://redis.io/) (Local instance or cloud provider)
* Accounts for [Cloudinary](https://cloudinary.com/), [Brevo](https://www.brevo.com/) (formerly Sendinblue), and a [Giphy API Key](https://developers.giphy.com/).

## 🔑 Environment Variables

To run this project, you will need to add environment variables to your `.env` file. Create a `.env` file in the root of your backend directory (or root folder, depending on your loader setup) and add the following:

```env
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/ri-chat
REDIS_URL=redis://127.0.0.1:6379

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Brevo / Nodemailer (Email Configuration)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_brevo_email_or_login
BREVO_SMTP_PASS=your_brevo_smtp_key
BREVO_FROM_EMAIL=your_verified_sender_email

# Frontend Configurations (Ensure these are accessible to Vite if placed in the frontend folder)
VITE_GIPHY_API_KEY=your_giphy_api_key
```

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd chat-app
```

### 2. Install dependencies and Build
The root `package.json` includes a handy script to install dependencies for both the backend and frontend simultaneously, and build the frontend for production.

Run the following command from the **root** of the project:
```bash
npm run build
```
*This command executes: `npm install --prefix Backend && npm install --prefix frontend && npm run build --prefix frontend`*

### 3. Start the Application
To start the backend server (which should also be configured to serve the built frontend static files in production mode):

```bash
npm start
```
*This command executes: `npm run start --prefix Backend`*

### 4. Running in Development Mode
If you want to run the frontend and backend separately in development mode with hot-reloading:

**Terminal 1 (Backend):**
```bash
cd Backend
npm install
npm run dev # (Requires setting up a dev script like "nodemon src/index.js" in Backend/package.json)
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

## 📜 Available Scripts

### Root Directory
* `npm run build`: Installs all dependencies for both frontend and backend, then builds the Vite frontend.
* `npm start`: Starts the backend Node.js server.

### Frontend Directory
* `npm run dev`: Starts the Vite development server.
* `npm run build`: Builds the app for production to the `dist` folder.
* `npm run lint`: Runs ESLint to catch code errors.
* `npm run preview`: Previews the production build locally.

### Backend Directory
* `npm start`: Starts the Express server using Node.
* *(Note: You can add `"dev": "nodemon src/index.js"` to your Backend `package.json` to enable hot-reloading).*

## 📝 License

This project is licensed under the [ISC](https://opensource.org/licenses/ISC) License.
```
