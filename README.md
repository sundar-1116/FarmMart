````markdown
# 🌾 FarmMart

## Intelligent Farm-to-Market Procurement & Supply Platform

FarmMart is a full-stack farm-to-market platform designed to connect **farmers, retail stores, and platform administrators** through a structured digital procurement workflow.

The platform enables retail partners to create crop demands, farmers to respond with offers, and administrators to oversee negotiations, procurement tasks, payments, and delivery workflows.

FarmMart also integrates an **AI-powered assistant using Google Gemini** to provide contextual support based on relevant platform data.

---

## 🚀 Live Application

### 🌐 Frontend

https://farmmart-9ng8.onrender.com/

### ⚙️ Backend API

https://farmmart-api.onrender.com/

> FarmMart is deployed using **Render**, with **MongoDB Atlas** as the production database.

---

# 🎯 Problem Statement

Traditional agricultural supply chains often involve multiple intermediaries, limited price transparency, fragmented communication, and poor visibility into procurement progress.

FarmMart aims to provide a centralized digital platform where:

```text
Retailers
   ↓
Create Crop Demands
   ↓
Farmers Discover Demands
   ↓
Farmers Submit Offers
   ↓
Negotiation
   ↓
Offer Acceptance
   ↓
Procurement
   ↓
Payment
   ↓
Delivery
````

The goal is to create a structured and traceable digital workflow from **demand creation to final delivery**.

---

# ✨ Key Features

## 🏪 Retail Demand Management

Retail stores can:

* Create crop/product demands
* Specify required quantities
* View active demands
* Track incoming farmer offers
* Monitor demand status
* Manage procurement requirements

---

## 🌱 Farmer Offer Management

Farmers can:

* Browse available crop demands
* Submit offers against demands
* Specify quantity and proposed pricing
* Track submitted offers
* Participate in negotiation workflows
* Monitor procurement opportunities

---

## 🤝 Negotiation Workflow

FarmMart provides a structured negotiation system between retail demand creators and farmers.

The system supports:

* Offer creation
* Offer review
* Offer acceptance
* Offer rejection
* Offer state transitions
* Negotiation-driven procurement progression

This creates a traceable transaction lifecycle instead of treating marketplace interactions as isolated requests.

---

# 🔄 End-to-End Business Workflow

The core FarmMart workflow is:

```text
                    ┌──────────────────────┐
                    │     Retail Store     │
                    └──────────┬───────────┘
                               │
                         Create Demand
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Store Demand      │
                    │                      │
                    │ Crop + Quantity      │
                    └──────────┬───────────┘
                               │
                     Farmers discover
                         the demand
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Farmer Offer      │
                    │                      │
                    │ Quantity + Price     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Negotiation      │
                    │                      │
                    │ Review / Accept /    │
                    │ Reject Offers        │
                    └──────────┬───────────┘
                               │
                         Offer Accepted
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Procurement Task   │
                    │                      │
                    │ Workflow Created    │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
              Payment      Procurement    Delivery
                 │             │             │
                 └─────────────┼─────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Completed       │
                    │   Procurement Flow   │
                    └──────────────────────┘
```

### Workflow Stages

### 1. Demand Creation

A retail store creates a demand specifying:

* Crop/product
* Required quantity
* Procurement requirements

### 2. Demand Discovery

Farmers can discover open demands and identify procurement opportunities.

### 3. Offer Submission

A farmer submits an offer containing information such as:

* Available quantity
* Proposed price
* Offer details

### 4. Negotiation

Retailers can review submitted offers and move them through the negotiation process.

### 5. Offer Acceptance

Once an offer is accepted, it can progress into the procurement workflow.

### 6. Procurement Task

The accepted transaction becomes a structured procurement task that can be tracked by the platform.

### 7. Payment, Procurement & Delivery

The procurement task progresses through operational stages such as:

```text
Payment
   ↓
Procurement
   ↓
Delivery
```

### 8. Completion

The transaction reaches its completed state while maintaining a traceable workflow history.

---

# 📦 Procurement Task Workflow

FarmMart models procurement as a structured task lifecycle rather than a single transaction.

```text
Accepted Offer
      │
      ▼
Procurement Task
      │
      ├── Payment
      │
      ├── Procurement
      │
      └── Delivery
             │
             ▼
          Completed
```

This provides a foundation for future operational features such as logistics tracking, notifications, and supply-chain analytics.

---

# 🤖 AI-Powered FarmMart Assistant

FarmMart integrates an AI assistant designed around the platform's operational context.

The AI layer uses **Google Gemini 2.5 Flash** to provide contextual responses.

The assistant can work with relevant information such as:

* Active demands
* Procurement tasks
* Offers
* Platform activity
* User role/context

---

## 🧠 AI Architecture

```text
                         FarmMart Platform
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
     Demands                  Offers                 Tasks
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  AI Assistant   │
                       └────────┬────────┘
                                │
                                ▼
                       Context / Intent
                                │
                                ▼
                       Gemini Provider
                                │
                                ▼
                       Gemini 2.5 Flash
                                │
                                ▼
                    Structured AI Response
```

---

## 🔌 AI Provider Architecture

The AI implementation uses a provider abstraction so that the application does not directly depend on a single AI implementation.

```text
                    AI Service
                        │
                        ▼
                 Provider Layer
                    /       \
                   /         \
                  ▼           ▼
          Gemini Provider   Mock Provider
                  │
                  ▼
          Gemini 2.5 Flash
```

This makes the AI layer easier to:

* Test
* Replace
* Extend
* Run without external AI services
* Handle provider failures

---

## 🛡️ AI Safety Boundary

The AI assistant is designed around a controlled contextual boundary.

The AI receives relevant application context but does not receive unrestricted authority over critical business operations.

This helps separate:

```text
AI Assistance
     ≠
Direct Business Data Modification
```

Critical business operations continue to be handled by the application's authenticated backend APIs.

---

# 👨‍💼 Admin Console

FarmMart includes a dedicated administration layer for platform management.

Administrators can monitor and manage areas such as:

* Users
* User roles
* Demands
* Offers
* Procurement tasks
* Platform activity
* Operational information
* AI-assisted platform queries

The admin layer provides centralized visibility into the marketplace and procurement ecosystem.

---

# 🔐 Security Architecture

Security is enforced primarily at the backend/API layer.

FarmMart includes:

* JWT-based authentication
* Role-based authorization
* Protected API routes
* Admin-only operations
* Password hashing
* Rate limiting
* Security middleware
* Environment-based secret management
* Controlled AI access
* Backend validation

---

## 🔑 Authentication & Authorization Flow

```text
                     User
                       │
                       ▼
                     Login
                       │
                       ▼
              Credentials Verified
                       │
                       ▼
                   JWT Issued
                       │
                       ▼
              Authenticated Request
                       │
                       ▼
            Authentication Middleware
                       │
                       ▼
              Role Authorization
                  /          \
                 /            \
                ▼              ▼
          Authorized        Rejected
              │              │
              ▼              ▼
         Controller       401 / 403
              │
              ▼
        Business Logic
              │
              ▼
           MongoDB
```

Authorization is enforced on the backend rather than relying solely on frontend visibility.

---

# 🏗️ System Architecture

FarmMart follows a modular full-stack architecture.

```text
                         ┌─────────────────────┐
                         │      Frontend       │
                         │     React + Vite    │
                         └──────────┬──────────┘
                                    │
                                    │ REST API
                                    ▼
                         ┌─────────────────────┐
                         │       Backend       │
                         │  Node.js + Express  │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
          │  MongoDB    │    │    JWT      │    │ AI Service  │
          │    Atlas    │    │    Auth     │    │   Gemini    │
          └─────────────┘    └─────────────┘    └─────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* JavaScript
* HTML5
* CSS3
* Responsive UI

## Backend

* Node.js
* Express.js
* REST APIs
* Mongoose

## Database

* MongoDB
* MongoDB Atlas

## Authentication & Security

* JSON Web Tokens (JWT)
* Password hashing
* Role-based authorization
* Rate limiting
* Security middleware

## Artificial Intelligence

* Google Gemini API
* Gemini 2.5 Flash
* Modular AI provider architecture
* Mock provider fallback

## Testing

* Jest
* Supertest
* Integration testing
* Authentication testing
* Security testing
* AI testing
* Workflow testing

## Deployment

* Git
* GitHub
* Render
* MongoDB Atlas

---

# 📁 Project Structure

```text
FarmMart/
│
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── aiConfig.js
│   │
│   ├── controllers/
│   │
│   ├── middleware/
│   │
│   ├── models/
│   │
│   ├── routes/
│   │
│   ├── services/
│   │   └── ai/
│   │       ├── providers/
│   │       │   ├── geminiProvider.js
│   │       │   └── mockProvider.js
│   │       │
│   │       └── ...
│   │
│   ├── tests/
│   │
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

# 🧪 Testing

FarmMart includes automated backend tests covering major application areas.

### Latest Test Results

```text
Test Suites: 6 passed, 6 total
Tests:       171 passed, 171 total
Snapshots:   0 total
```

The test suite covers areas including:

* Authentication
* Security
* User management
* Crop management
* Offers
* Procurement workflows
* AI functionality
* Migration behavior

The frontend also successfully completes the Vite production build.

---

# 💻 Local Development

## Prerequisites

Make sure you have:

* Node.js 18+
* npm
* MongoDB / MongoDB Atlas
* Google Gemini API key

---

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>

cd FarmMart
```

---

## 2. Install Backend Dependencies

```bash
cd backend

npm install
```

---

## 3. Configure Environment Variables

Create:

```text
backend/.env
```

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=30d

GEMINI_API_KEY=your_gemini_api_key

AI_MODEL_NAME=gemini-2.5-flash
AI_MOCK_MODE=false

NODE_ENV=development
```

> Never commit `.env` files, database credentials, API keys, JWT secrets, or administrator passwords to GitHub.

---

## 4. Start the Backend

```bash
cd backend

npm start
```

The backend will normally run on:

```text
http://localhost:5000
```

---

## 5. Start the Frontend

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

The frontend will normally run on:

```text
http://localhost:3000
```

---

# ☁️ Deployment

FarmMart is structured as a monorepo containing separate frontend and backend applications.

---

## Backend Deployment

The backend is deployed as a Render Web Service.

```text
Root Directory:
backend

Build Command:
npm install

Start Command:
npm start
```

Production environment variables are configured directly through Render.

---

## Frontend Deployment

The frontend is deployed as a Render Static Site.

```text
Root Directory:
frontend

Build Command:
npm install && npm run build

Publish Directory:
dist
```

The frontend communicates with the deployed backend API through its configured API URL.

---

# 🔄 Git & Deployment Workflow

FarmMart follows a Git-based development and deployment workflow.

```text
                    Developer
                        │
                        ▼
                 Local Development
                        │
                        ▼
                  Run Test Suite
                        │
                        ▼
                  Verify Build
                        │
                        ▼
                    Git Commit
                        │
                        ▼
                    GitHub
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
        Render Backend      Render Frontend
              │                   │
              ▼                   ▼
        Node + Express          Vite
              │
              ▼
        MongoDB Atlas
              │
              ▼
        Gemini API
```

Changes pushed to the deployment branch can trigger automatic Render deployments.

---

# 🧠 Engineering Highlights

FarmMart focuses on more than simply implementing CRUD operations.

## Modular Backend Architecture

Backend responsibilities are separated across:

* Routes
* Controllers
* Services
* Models
* Middleware
* Configuration

This keeps business logic maintainable and makes individual components easier to test.

---

## Role-Based Authorization

Authorization is enforced server-side.

The frontend controls what users see, while the backend determines whether an operation is actually permitted.

---

## Stateful Business Workflows

FarmMart models the procurement lifecycle using explicit states rather than treating each operation as an isolated request.

This makes it possible to track:

```text
Demand
  ↓
Offer
  ↓
Negotiation
  ↓
Acceptance
  ↓
Procurement
  ↓
Payment
  ↓
Delivery
  ↓
Completion
```

---

## AI Provider Abstraction

AI functionality is isolated behind provider classes.

This allows the application to:

* Use Gemini in production
* Use a mock provider during development/testing
* Handle external provider failures
* Introduce additional providers in the future

---

## Defensive Failure Handling

External AI services can fail because of:

* Network issues
* API errors
* Timeouts
* Service availability
* Configuration problems

FarmMart handles AI provider failures separately from the main business workflow so that an external AI failure does not bring down the core platform.

---

## Automated Testing

Critical backend functionality is covered by automated tests to reduce regressions as the platform evolves.

---

# 📈 Scalability Considerations

The current architecture provides a foundation for future scaling.

Potential improvements include:

```text
Current Architecture
        │
        ▼
Modular Express Backend
        │
        ├── Redis Caching
        │
        ├── Message Queues
        │
        ├── WebSockets
        │
        ├── Background Workers
        │
        ├── Containerization
        │
        └── Horizontal Scaling
```

These improvements are part of the future engineering roadmap rather than the current implementation.

---

# 🔮 Future Roadmap

The following features are intentionally kept as future enhancements.

## Phase 2 — Marketplace Intelligence

* 📈 AI-powered crop price prediction
* 📊 Demand forecasting
* 🌾 Crop recommendation
* 💰 Dynamic pricing recommendations
* 📉 Market trend analysis

---

## Phase 3 — Advanced Procurement

* 🔄 Automated offer matching
* 🧮 Intelligent farmer-store matching
* 📦 Inventory management
* 🚚 Delivery tracking
* 📍 Location-aware procurement
* 🔔 Real-time notifications

---

## Phase 4 — AI & Analytics

* 🤖 Agentic procurement assistance
* 📊 Advanced operational dashboards
* 🔍 Anomaly detection
* 📈 Predictive procurement analytics
* 🧠 Personalized recommendations

---

## Phase 5 — Production Scale

* ⚡ Redis caching
* 📨 Message queues
* 📡 WebSocket-based real-time updates
* 🐳 Docker containerization
* 🔄 CI/CD pipelines
* 📊 Centralized logging
* 📈 Application monitoring
* ☁️ Cloud-native scaling

---

# 🎓 Project Goals

FarmMart is designed as a practical full-stack engineering project demonstrating:

* Full-stack application development
* REST API design
* Database modeling
* Authentication & authorization
* Secure backend architecture
* AI integration
* AI provider abstraction
* Workflow/state-machine design
* Automated testing
* Cloud deployment
* Modular software architecture

The long-term goal is to evolve FarmMart from a basic agricultural marketplace into an **intelligent procurement and supply-chain platform**.

---

# 📌 Why FarmMart?

FarmMart combines several areas of modern software engineering into a single real-world application:

```text
              ┌─────────────────────┐
              │     FarmMart        │
              └──────────┬──────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   Full Stack        Backend          AI Integration
        │                │                │
        ▼                ▼                ▼
     React           Express          Gemini
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                  MongoDB + JWT
                         │
                         ▼
                  Cloud Deployment
                         │
                         ▼
                 Automated Testing
```

The project demonstrates how these technologies can be combined to build a workflow-oriented platform that addresses a real-world business problem.

---

# 👨‍💻 Author

## Hemasundar Sai

Full-stack software engineering project focused on building scalable applications, secure backend systems, AI-powered features, and real-world workflow automation.

---

# 📄 License

This project is licensed under the MIT License.

````

### One correction before you paste it

I intentionally used:

```text
<YOUR_GITHUB_REPOSITORY_URL>
````

instead of inventing your GitHub URL inside the README.

You can replace that one placeholder with your actual repository URL.

Also, **don't put your real MongoDB URI, Gemini key, JWT secret, or admin credentials into this README**. Keep those only in environment variables.

This version is much better positioned as a **resume/GitHub portfolio project** because the recruiter can immediately see the **problem → workflow → architecture → security → AI → testing → deployment → roadmap**, rather than just seeing a list of UI features.
