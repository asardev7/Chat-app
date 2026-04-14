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
