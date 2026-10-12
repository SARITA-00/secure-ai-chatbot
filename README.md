# Secure AI Chatbot for Customer Support

A secure AI-powered customer support chatbot designed to answer user queries using a Retrieval-Augmented Generation (RAG) pipeline while applying authentication, authorization, prompt-injection protection, output validation, and security logging.

## Features

- AI-powered customer support chatbot
- Retrieval-Augmented Generation (RAG)
- PDF/document-based knowledge retrieval
- Vector similarity search using PostgreSQL and pgvector
- Gemini-based embeddings and response generation
- JWT-based user authentication
- Role-based access control
- Conversation and message management
- Customer support ticket management
- Admin dashboard functionality
- Prompt-injection detection
- LLM output validation
- Security-event logging
- Audit logging
- Protected communication between the backend and AI service
- REST APIs using FastAPI
- React-based web interface

---

## System Architecture

```text
                         ┌─────────────────────┐
                         │      Customer       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ React + TypeScript  │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                              REST API
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   FastAPI Backend   │
                         │                     │
                         │ Authentication      │
                         │ Authorization       │
                         │ Conversations       │
                         │ Support Tickets     │
                         │ Security Logging    │
                         └──────────┬──────────┘
                                    │
                           Protected API Call
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     AI Service      │
                         │      FastAPI        │
                         └──────────┬──────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   ▼                ▼                ▼
              Guardrails          RAG             Gemini
                   │                │                │
                   │        ┌───────┴───────┐        │
                   │        │               │        │
                   │        ▼               ▼        │
                   │   Embeddings      Vector Search │
                   │        │               │        │
                   │        └───────┬───────┘        │
                   │                │                │
                   └────────────────┼────────────────┘
                                    │
                                    ▼
                              AI Response
```

---

## How the Chatbot Works

### 1. User Authentication

The user accesses the React frontend and authenticates through the FastAPI backend.

The backend uses JWT-based authentication to protect application endpoints.

### 2. User Sends a Query

The user enters a customer-support question through the chatbot interface.

The frontend sends the request to the backend through the REST API.

### 3. Backend Processing

The backend:

- verifies the authenticated user
- checks authorization
- processes the conversation request
- communicates with the protected AI service

### 4. AI Service

The AI service receives the query and processes it through the RAG and security pipeline.

### 5. Retrieval-Augmented Generation

The RAG pipeline retrieves relevant information from the application's document knowledge base.

The process is:

```text
Documents / PDFs
       ↓
Document Loading
       ↓
Text Extraction
       ↓
Text Chunking
       ↓
Embedding Generation
       ↓
PostgreSQL + pgvector
```

For a user query:

```text
User Query
    ↓
Query Embedding
    ↓
Vector Similarity Search
    ↓
Relevant Document Chunks
    ↓
Context Construction
    ↓
Gemini
    ↓
Generated Response
```

### 6. Security Checks

The AI service includes security mechanisms such as:

- prompt-injection detection
- security-related request checks
- output validation
- security-event logging

The generated response is checked before being returned to the backend.

### 7. Response

The validated response is returned through the backend to the React frontend and displayed to the user.

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- JWT authentication
- pwdlib

### AI Service

- Python
- FastAPI
- Gemini API
- Retrieval-Augmented Generation
- Embeddings
- Custom retrieval pipeline

### Database

- PostgreSQL
- pgvector

### Document Processing

- PDF/document loading
- Text chunking
- Embedding generation
- Vector similarity search

---

## Project Structure

```text
secure-ai-chatbot/
│
├── frontend-integrated-updated/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── ...
│   ├── alembic/
│   │   └── versions/
│   ├── .env.example
│   ├── main.py
│   └── seed_roles.py
│
├── AI service/
│   ├── app/
│   │   ├── rag/
│   │   │   ├── chunker.py
│   │   │   ├── database.py
│   │   │   ├── embeddings.py
│   │   │   ├── generator.py
│   │   │   ├── ingest.py
│   │   │   ├── loader.py
│   │   │   ├── retriever.py
│   │   │   └── ...
│   │   ├── api.py
│   │   ├── chatbot.py
│   │   ├── config.py
│   │   ├── guardrails.py
│   │   ├── llm.py
│   │   ├── prompts.py
│   │   └── security_logger.py
│   │
│   └── test_*.py
│
├── .gitignore
└── README.md
```

---

## Prerequisites

Install the following before running the project:

- Node.js
- npm
- Python
- PostgreSQL
- PostgreSQL with the pgvector extension
- Gemini API key

---

# Configuration

The project contains environment-example files for the frontend, backend, and AI service.

Do **not** commit actual API keys, passwords, JWT secrets, or database credentials to GitHub.

---

## Backend Environment Variables

Create/configure the backend environment using the variables required by the backend configuration.

Example:

```env
DATABASE_URL=postgresql+psycopg://username:password@host/database
JWT_SECRET_KEY=replace-with-a-secure-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

AI_SERVICE_URL=http://127.0.0.1:8001
AI_SERVICE_API_KEY=your-ai-service-key

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Use your actual PostgreSQL connection details.

---

## AI Service Environment Variables

Configure the AI service with the required Gemini and database credentials.

Example:

```env
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=postgresql://username:password@host/database
AI_SERVICE_API_KEY=your-ai-service-key
```

The `AI_SERVICE_API_KEY` must match the key configured for communication between the backend and AI service.

---

## Frontend Environment Variables

Configure the frontend API URL:

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

# Running the Project

The project consists of three main parts:

1. AI service
2. Backend
3. Frontend

Run them separately.

---

## 1. Start the AI Service

Open a terminal and navigate to the AI service directory.

```bash
cd "AI service"
```

Create and activate a Python virtual environment if required:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

Install the Python dependencies used by the AI service.

Then start the service:

```bash
uvicorn app.api:app --reload --host 127.0.0.1 --port 8001
```

The AI service will run on:

```text
http://127.0.0.1:8001
```

---

## 2. Start the Backend

Open another terminal and navigate to the backend directory:

```bash
cd backend
```

Create and activate the Python virtual environment if required:

```bash
python -m venv venv
venv\Scripts\activate
```

Install the backend dependencies used by the project.

Start the FastAPI backend:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will run on:

```text
http://127.0.0.1:8000
```

---

## 3. Start the Frontend

Open another terminal:

```bash
cd frontend-integrated-updated
```

Install the Node.js dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# Database

The application uses PostgreSQL for persistent application data.

The project also uses **pgvector** for storing and searching vector embeddings used by the RAG system.

The database is used for application data such as:

- users
- roles
- conversations
- messages
- documents
- document chunks
- security events
- audit information
- support tickets

Database migrations are managed using Alembic.

---

# RAG Pipeline

The RAG system allows the chatbot to retrieve relevant information from the application's document knowledge base before generating an answer.

## Document Ingestion

```text
PDF / Document
      ↓
Loader
      ↓
Text Extraction
      ↓
Chunking
      ↓
Embedding Generation
      ↓
Vector Database
```

## Query Processing

```text
User Question
      ↓
Query Embedding
      ↓
Vector Search
      ↓
Relevant Chunks
      ↓
Context
      ↓
Gemini
      ↓
Response
```

This allows the chatbot to use information retrieved from the configured knowledge base instead of relying only on the model's general knowledge.

---

# Security

Security is an important part of the project.

### Authentication

The backend uses JWT-based authentication to protect user-specific functionality.

### Authorization

The application includes role-based access control for protected functionality.

### Prompt-Injection Protection

The AI service includes prompt-injection detection mechanisms to identify potentially malicious instructions contained in user input.

### Output Validation

Generated AI responses are processed through output-validation logic before being returned to the application.

### AI Service Protection

Communication between the backend and AI service is protected using an API key.

### Security Logging

Security-related events can be recorded for monitoring and auditing purposes.

### Audit Logging

The backend provides audit-related functionality for tracking important application actions.

### Secret Management

Sensitive credentials such as:

- Gemini API keys
- database passwords
- JWT secrets
- AI service keys

should be stored in environment variables rather than committed to the repository.

---

# Main Application Areas

The project contains functionality for:

### Customer

- User authentication
- AI chatbot
- Conversations
- Messages
- Support tickets

### Admin

- Administrative dashboard
- User-related management
- Conversation-related information
- Security events
- Audit information
- Support tickets

---

# API

The backend exposes REST API endpoints through FastAPI.

The project includes API areas for functionality such as:

```text
/auth
/chat
/conversations
/security-events
/audit-logs
/support-tickets
/admin
/health
```

The exact available endpoints and request/response schemas are defined in the FastAPI routers and schemas in the project.

FastAPI also provides interactive API documentation when the backend is running.

---

# Testing

The project contains tests covering different parts of the system, including:

- RAG functionality
- Retriever
- Embeddings
- Document loading
- Document chunking
- Document ingestion
- Database functionality
- Guardrails
- Output guardrails
- Prompt-injection scenarios
- Security logging
- LLM/RAG functionality

Example test files include:

```text
test_guardrails.py
test_output_guardrail.py
test_prompt_injection_rag.py
test_rag.py
test_retriever.py
test_embedding.py
test_embeddings_rag.py
test_database.py
test_security_logger.py
test_ingest.py
test_loader.py
test_chunker.py
test_llm_rag.py
```

Run the available tests using the project's configured Python test environment.

---

# Security Considerations

This project is designed as a secure AI customer-support application, but no security mechanism can guarantee complete protection against every possible attack.

The implemented protections should therefore be treated as layers of defense rather than a complete security guarantee.

In particular:

- Prompt-injection detection may not identify every possible attack.
- Output validation does not guarantee complete removal of unsafe content.
- RAG quality depends on the quality and coverage of the configured knowledge base.
- The AI functionality depends on the configured Gemini service.
- Production deployment should add appropriate infrastructure-level security, monitoring, rate limiting, secret management, and access controls.

---

# Future Improvements

Possible future improvements include:

- More advanced prompt-injection detection
- Stronger authorization policies
- Rate limiting
- Improved document management
- Better RAG evaluation
- Source/citation display for retrieved documents
- Automated security testing
- Production monitoring and alerting
- Improved privacy controls
- CI/CD integration

---

## Project Purpose

The project demonstrates how an AI customer-support application can combine:

```text
Web Application
       +
Secure Backend
       +
Authentication & Authorization
       +
RAG
       +
Vector Search
       +
LLM
       +
Security Guardrails
       +
Logging & Auditing
```

to build a more secure and context-aware customer-support chatbot.
