# Real-Time Chat Application (Ri-Chat)

A comprehensive, full-stack real-time chat application built using the MERN stack (MongoDB, Express, React, Node.js) and Socket.io. This application features secure authentication, real-time messaging, profile management, and a highly responsive, themeable user interface.

## 🚀 Features

* **Real-Time Messaging:** Instant message delivery and reception using WebSockets via `Socket.io`.
* **Advanced Chat Capabilities:**
    * Send text, images, and GIFs.
    * Edit existing messages.
    * Delete messages (updates in real-time for all users).
    * Reply to specific messages.
    * Unread message counters for offline or inactive chats.
* **Secure Authentication:** User signup and login with OTP email verification (via NodeMailer) and JWT-based session management.
* **Online Presence:** See which users are currently online in real-time.
* **Profile Management:** Update user details and upload profile pictures via Cloudinary integration.
* **Dynamic Theming:** Seamless UI theme switching powered by DaisyUI, preserved across sessions.

## 🛠 Tech Stack

### Frontend
* **Framework:** React 19 (via Vite)
* **State Management:** Zustand
* **Routing:** React Router v7
* **Styling:** Tailwind CSS & DaisyUI
* **Icons & Notifications:** Lucide React, React Hot Toast

### Backend
* **Runtime/Framework:** Node.js, Express.js
* **Database:** MongoDB via Mongoose
* **Real-time Communication:** Socket.io
* **Media Storage:** Cloudinary
* **Authentication:** JWT, bcryptjs
* **Caching/Optimization:** ioredis (installed)

## 📂 Project Structure

```text
├── Backend/
│   ├── src/
│   │   ├── controllers/      # Route logic for auth and messages
│   │   ├── lib/              # Configs (DB, Socket, Cloudinary, Utils)
│   │   ├── middleware/       # JWT auth & validation guards
│   │   ├── models/           # Mongoose schemas (User, Message)
│   │   ├── routes/           # Express API endpoints
│   │   └── index.js          # Entry point & Server setup
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/       # Reusable UI (Navbar, Chat Container, Skeletons)
    │   ├── lib/              # Axios instance setup
    │   ├── pages/            # App routes (Home, Login, Signup, Settings)
    │   ├── store/            # Zustand global states (Auth, Chat, Theme)
    │   ├── App.jsx           # Main layout & router configuration
    │   └── main.jsx          # React DOM render
    └── package.json

##⚙️ Environment Variables
To run this project, you will need to add the following environment variables to your .env file in the Backend directory:

PORT=5002
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_connection_string

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Auth
JWT_SECRET=your_jwt_secret

# NodeMailer (OTP Verification)
# Requires SMTP credentials setup for the email service being used.

##🚀 Installation & Local Setup
Clone the repository:

Bash
git clone <repository-url>
cd chat-app
Install Backend Dependencies:

Bash
cd Backend
npm install
Install Frontend Dependencies:

Bash
cd ../frontend
npm install
Run the Application:

Start Backend (Development Mode):

Bash
cd Backend
npm run dev  # assuming nodemon is bound to dev script
Start Frontend:

Bash
cd frontend
npm run dev
Access the App: Open http://localhost:5173 in your browser.

🌐 Production Deployment
The backend is configured to serve the frontend static files when NODE_ENV=production.

Build the frontend: cd frontend && npm run build.

Start the backend server: cd Backend && npm start.
