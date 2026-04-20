# 🚀 AutoBizz Backend

**AutoBizz Backend** is a robust, AI-powered business automation server built with **Node.js**, **Express**, and **PostgreSQL**. It handles organization management, lead tracking, AI receptionist services, SOP video generation, call logging, and real-time analytics. The backend integrates with multiple AI and cloud services including Twilio, HeyGen, ElevenLabs, Pinecone, AWS S3, and Google APIs.

> ℹ️ **Note:** This repository contains the **backend API** for the AutoBizz platform. It serves the [AutoBizz Frontend](#) and manages all business logic, database operations, and third-party integrations.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [⚙️ Prerequisites](#️-prerequisites)
- [📦 Installation & Package Setup](#-installation--package-setup)
- [🔐 Environment Configuration](#-environment-configuration)
- [🗄️ Database Setup](#️-database-setup)
- [🧰 External Tools & Services Setup](#-external-tools--services-setup)
- [🏃 Running the Server](#-running-the-server)
- [📁 Project Structure](#-project-structure)
- [📡 API Routes Overview](#-api-routes-overview)
- [🔌 Webhooks](#-webhooks)
- [📝 License](#-license)

---

## ✨ Features

- **🏢 Organization Management:** Multi-tenant support with org details, employees, and profile management.
- **👥 Employee System:** Role-based access, employee registration, and setup flows.
- **📞 AI Receptionist & Call Logs:** Twilio integration for AI calls, call logging, and lead qualification.
- **🎥 SOP Video Generation:** AI-powered video creation using HeyGen and ElevenLabs with script generation.
- **📄 Document & RAG System:** Upload documents, vector embedding via Pinecone, and retrieval-augmented generation.
- **📅 Calendar Integration:** Google Calendar sync for meetings and scheduling.
- **📧 Email Services:** SMTP-based email notifications and password resets.
- **🔐 Authentication:** JWT-based auth with access/refresh tokens and Google OAuth support.
- **📊 Leads Management:** Lead capture, tracking, and analytics.
- **🔌 Real-time Updates:** Socket.IO for live notifications and status updates.

---

## 🛠 Tech Stack

| Category          | Technology                                  |
| ----------------- | ------------------------------------------- |
| **Runtime**       | Node.js (>= 20.6.0)                         |
| **Framework**     | Express.js                                  |
| **Database**      | PostgreSQL                                  |
| **ORM**           | Sequelize                                   |
| **Validation**    | Zod, express-validator                      |
| **Auth**          | JWT, bcrypt, Google OAuth                   |
| **AI/ML**         | OpenAI, ElevenLabs, HeyGen, Ollama          |
| **Vector DB**     | Pinecone                                    |
| **Storage**       | AWS S3                                      |
| **Communication** | Twilio, Nodemailer, Socket.IO               |
| **Utilities**     | Multer, csv-parser, pdf-parse, officeparser |

---

## ⚙️ Prerequisites

Ensure the following are installed and configured:

- **Node.js** >= `20.6.0` (Required for `--env-file` flag in dev script)
- **npm** >= `9.x`
- **PostgreSQL** >= `14.x`
- **Git**

---

## 📦 Installation & Package Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/traineeqodors-jpg/AutoBizz-backend.git
   cd AutoBizz-backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Verify Installation**

   Ensure all dependencies are installed correctly:

   ```bash
   npm list --depth=0
   ```

---

## 🔐 Environment Configuration

Create a `.env` file in the root directory and populate it with the following variables. Refer to the `.env.example` for guidance.

### 📋 Environment Variables

```env
# 🌐 Server Configuration
PORT=5000
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:5000  # Used for webhooks

# 🗄️ Database (PostgreSQL)
DB_USERNAME=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=autobizz_db

# 🔐 JWT Configuration
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d

# 📞 Twilio (AI Receptionist & SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# 📧 SMTP (Email Services)
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port

# 🎙️ ElevenLabs (Voice Generation)
ELEVENLABS_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id

# 🌲 Pinecone (Vector Database)
PINECONE_KEY=your_pinecone_api_key

# 🎥 HeyGen (Video Generation)
HEYGEN_API_KEY=your_heygen_api_key
HEYGEN_WEBHOOK_SECRET=your_heygen_webhook_secret

# 🔑 Google APIs (OAuth & Calendar)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

```

> ⚠️ **Security:** Never commit `.env` files to version control. Add `.env` to `.gitignore`.

---

## 🗄️ Database Setup

This project uses **Sequelize ORM** with **PostgreSQL**.

### 1. Create Database

Ensure PostgreSQL is running and create the database:

```bash
createdb autobizz_db
```

Or via SQL:

```sql
CREATE DATABASE autobizz_db;
```

### 2. Configure Sequelize

Check `db/config/config.json` to ensure it matches your environment variables or uses `use_env_variable`.

Example `db/config/config.json`:

```json
{
  "development": {
    "username": "your_postgres_user",
    "password": "your_postgres_password",
    "database": "autobizz_db",
    "host": "127.0.0.1",
    "dialect": "postgres"
  }
}
```

> 💡 **Tip:** For production, configure Sequelize to read from environment variables.

### 3. Run Migrations

Apply all database migrations:

```bash
npx sequelize-cli db:migrate
```

### 4. Verify Setup

Connect to your database and verify tables:

```bash
psql -U your_postgres_user -d autobizz_db
\dt
```

---

## 🧰 External Tools & Services Setup

The backend integrates with several third-party services. Ensure you have accounts and API keys for the following:

### 📞 Twilio

- **Purpose:** AI receptionist, voice calls, SMS, phone number provisioning.
- **Setup:** Create a Twilio account, get Account SID, Auth Token, and purchase/configure a phone number.
- **Env Vars:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.

### 🎥 HeyGen

- **Purpose:** AI avatar video generation for SOPs.
- **Setup:** Sign up at HeyGen, generate API key, and configure webhook secret for status callbacks.
- **Env Vars:** `HEYGEN_API_KEY`, `HEYGEN_WEBHOOK_SECRET`.
- **Webhook:** Ensure `BASE_URL` is publicly accessible for HeyGen webhooks (use ngrok for local dev).

### 🎙️ ElevenLabs

- **Purpose:** Text-to-speech voice generation.
- **Setup:** Create ElevenLabs account, get API key, and select a voice ID.
- **Env Vars:** `ELEVENLABS_KEY`, `ELEVENLABS_VOICE_ID`.

### 🌲 Pinecone

- **Purpose:** Vector database for RAG (Retrieval-Augmented Generation).
- **Setup:** Create Pinecone project, get API key, and create an index.
- **Env Vars:** `PINECONE_KEY`.

### ☁️ AWS S3

- **Purpose:** File storage for documents, videos, and assets.
- **Setup:** Create S3 bucket and configure IAM user with appropriate permissions.
- **Env Vars:** AWS credentials may be loaded via environment variables or IAM role.

### 📧 SMTP (Mailtrap / Gmail / SendGrid)

- **Purpose:** Transactional emails (password reset, notifications).
- **Setup:** Configure SMTP provider and get credentials.
- **Env Vars:** `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`.

### 🔑 Google Cloud

- **Purpose:** Google OAuth login and Calendar integration.
- **Setup:** Create project in Google Cloud Console, enable Calendar API, create OAuth 2.0 credentials.
- **Env Vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### 🤖 OpenAI / Ollama

- **Purpose:** LLM for script generation, AI responses.
- **Setup:** Get OpenAI API key or configure local Ollama instance.
- **Env Vars:** Add `OPENAI_API_KEY` if using OpenAI (not in provided env but used in services).

---

## 🏃 Running the Server

### Development Mode

Start the server with hot-reload and environment file loading:

```bash
npm run dev
```

> This uses Node's built-in `--watch` and `--env-file` flags. Requires Node.js >= 20.6.0.

### Production Mode

For production, use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name autobizz-backend
```

### Access

- **API Base URL:** `http://localhost:5000`
- **Health Check:** `GET /api/common/health` (if available)

---

## 📁 Project Structure

```
AutoBizz-backend/
├── db/
│   ├── config/             # Sequelize configuration
│   ├── migrations/         # Database migrations
│   ├── models/             # Sequelize models
│   └── seeders/            # Demo data seeders
├── src/
│   ├── config/             # Service configs (Pinecone, etc.)
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Auth, validation, error handling
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic & external integrations
│   ├── utils/              # Helpers, error classes, multer config
│   ├── webhooks/           # Webhook handlers (HeyGen)
│   └── zodSchema/          # Zod validation schemas
├── prompts.yaml            # AI prompts configuration
├── server.js               # Entry point
└── package.json
```

### Key Services

| Service                    | Description                         |
| -------------------------- | ----------------------------------- |
| `ai.services.js`           | Core AI logic and prompt handling   |
| `authService.js`           | Authentication and token management |
| `awsBucketStorage.js`      | S3 file upload/download             |
| `elevenlabs.services.js`   | Voice generation                    |
| `heygenVideoGeneration.js` | Video creation workflow             |
| `rag.services.js`          | Retrieval-augmented generation      |
| `twilML.utils.js`          | Twilio integration helpers          |
| `upsertVectorDoc.js`       | Pinecone vector operations          |

---

## 📡 API Routes Overview

| Route File                | Description                            |
| ------------------------- | -------------------------------------- |
| `org.routes.js`           | Organization CRUD, login, registration |
| `employee.routes.js`      | Employee management                    |
| `lead.routes.js`          | Lead capture and management            |
| `callLog.routes.js`       | Call history and details               |
| `sop.routes.js`           | SOP video generation workflows         |
| `document.routes.js`      | Document upload and RAG queries        |
| `meeting.routes.js`       | Calendar and meeting management        |
| `voice.routes.js`         | Voice-related endpoints                |
| `script.routes.js`        | Script generation for videos           |
| `passwordReset.routes.js` | Password reset flow                    |

---

## 🔌 Webhooks

### HeyGen Webhook

- **Endpoint:** `/webhooks/heygen-status`
- **Purpose:** Receives video generation status updates from HeyGen.
- **Setup:** Configure webhook URL in HeyGen dashboard pointing to `BASE_URL/webhooks/heygen-status`.
- **Security:** Validates signature using `HEYGEN_WEBHOOK_SECRET`.

---

## 📝 License

This project is private and proprietary. All rights reserved © AutoBizz.

---

## 📞 Support

For technical issues or questions, contact the development team or refer to internal documentation.

```

```
