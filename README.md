# FarmMart

India's Premier Farm-to-Market Web Application. FarmMart connects local crop growers and national retail stores directly, facilitating price negotiation, supply visibility, live analytics, and AI-powered support.

---

## Key Features

* **Dynamic Navigation System**: Standalone landing page with smooth client-side panel routing (Home, About, Stores, Farmers) that keeps user interactions fluid and interactive.
* **Role-Based Portals**:
  * **User Access**: Custom dashboard panel for retail stores and buyers to browse crop listings, manage fresh produce requests, trace supply metrics, and contact support.
  * **Admin Access**: Shielded panel for platform administrators to monitor active users, manage listings, resolve inquiries, and review system logs.
* **2FA Admin Registration Security**: Secure signups for administrator accounts requiring a 2-factor authentication code sent to existing administrators to verify identity.
* **Smart Support Chatbot**: Integrated AI assistant that handles support requests instantly and escalates queries to human administrators if necessary.
* **Robust Client-Side Fallback**: Full support for LocalStorage and sessionStorage, enabling seamless offline capabilities and responsive state retention even when backend services are down.
* **Premium Design System**: Fully responsive layout utilizing glassmorphism aesthetic tokens, Outfit typography, glowing border highlights, and vibrant micro-animations.

---

## Technical Stack

* **Frontend**: Vanilla HTML5, CSS3 Custom Properties (variables), and Vanilla JavaScript (ES6+).
* **Backend**: Node.js, Express.js.
* **Database**: MongoDB (via Mongoose ODM).
* **Authentication**: JWT (JSON Web Tokens) with 2FA verification.

---

## Project Structure

```text
├── backend/            # Express server API
│   ├── config/         # Environment configuration
│   ├── controllers/    # Request handlers (auth, demand, task)
│   ├── models/         # MongoDB schemas (User, Task, Demand)
│   ├── routes/         # Express routers
│   └── server.js       # Main server entrypoint
├── frontend/           # Static frontend files
│   ├── css/            # Premium stylesheets (main, auth, dashboard, chatbot)
│   ├── js/             # Client-side scripts (data logic, auth handler, navigation)
│   ├── admin/          # Admin portal views
│   ├── user/           # User portal views
│   ├── index.html      # Standalone landing page
│   └── auth.html       # Combined auth gateway
├── package.json        # Main package config
└── README.md           # Documentation
```

---

## Installation & Setup

### Prerequisites

* [Node.js](https://nodejs.org/) (v16 or higher)
* [MongoDB](https://www.mongodb.com/) (running locally or a remote MongoDB Atlas URI)

### Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone <your-repository-url>
   cd FarmMart
   ```

2. **Install Root and Frontend Dependencies**:
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Environment Configuration**:
   Create a `.env` file inside the `backend` directory:
   ```env
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/farmers_to_mart
   JWT_SECRET=your_jwt_auth_secret_key_here
   ```

5. **Start the Application**:
   Run both frontend and backend concurrently.

   * **Start Backend (from `backend/` directory)**:
     ```bash
     npm run dev
     ```
   * **Start Frontend (from root directory)**:
     ```bash
     npm run dev
     ```

   The backend will run on `http://127.0.0.1:5001` and the frontend server will host the application at `http://127.0.0.1:3000`.

---

## Deployment Guide

### Option 1: Render (Recommended for Monorepos)

Render allows you to host both the Express backend and the static frontend for free.

#### Step 1: Deploy Backend (Web Service)
1. Sign up on [Render](https://render.com/).
2. Click **New** > **Web Service**.
3. Connect your GitHub repository.
4. Set the following details:
   * **Root Directory**: `backend`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
5. Under **Environment Variables**, add:
   * `MONGO_URI` (your MongoDB Atlas connection string)
   * `JWT_SECRET` (a strong random security string)
   * `PORT` (e.g. `5001`)

#### Step 2: Deploy Frontend (Static Site)
1. Click **New** > **Static Site**.
2. Connect your GitHub repository.
3. Set the following details:
   * **Publish Directory**: `frontend`
   * **Build Command**: (leave empty or set to `npm install` if required)
4. Go to **Settings** and configure client routing if necessary. Ensure the API calls in `frontend/js/data.js` point to your Render backend web service URL.

---

### Option 2: Vercel / Netlify (Frontend Only)

For static hosting, you can connect Vercel or Netlify to compile the `frontend` folder directly.
1. Connect your repository to Vercel/Netlify.
2. Set the root publish folder to `frontend`.
3. Provide the environment variables pointing to your hosted API.

---

## License

This project is licensed under the MIT License.
