# 🚀 Server Flow - Visual Backend Builder

A platform that lets you visually design backend workflows (like n8n) and automatically generates production-ready server code.

---

## 📋 Table of Contents
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Running the Project](#-running-the-project)
- [Development Workflow](#-development-workflow)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [Team](#-team)

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18 + React Flow |
| **Backend** | Node.js + Express |
| **Database** | MongoDB (Optional) |
| **Code Generation** | Custom Engine |
| **Deployment** | Docker / Vercel |

---

## 📦 Prerequisites

Before you begin, ensure you have installed:

```bash
# Check versions
node --version   # v18.x or higher
npm --version    # v9.x or higher
git --version    # v2.x or higher

# Backend
cd backend
npm install
npm run dev &
cd ..

# Frontend
cd frontend
npm install
npm start &