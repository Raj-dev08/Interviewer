# AI Mock Interview Platform

An AI-powered mock interview platform built to simulate real technical interviews with real-time communication, coding challenges, and code execution.

## Live Demo

https://interviewer-three-delta.vercel.app/

## GitHub

https://github.com/Raj-dev08/Interviewer

## What it does

The platform allows users to:

* Start an AI-powered mock interview
* Communicate with the interviewer in real time
* Solve coding questions during the interview
* Run and test code
* Handle multiple users and concurrent interview sessions
* Maintain interview state and real-time communication

## Tech Stack

* **Frontend:** Next.js, React
* **Backend:** Node.js, Express
* **Real-time:** Socket.IO
* **Database:** MongoDB
* **Caching / State:** Redis
* **AI:** AI-powered interview generation and interaction
* **Deployment:** Vercel / Node.js backend

## Architecture

The application is split into a frontend and backend.

```text
User
  |
  v
Next.js Frontend
  |
  | REST APIs
  | Socket.IO
  v
Node.js / Express Backend
  |
  +------ MongoDB
  |
  +------ Redis
  |
  +------ AI Services
  |
  +------ Code Execution
```

Socket.IO is used for real-time interview communication and synchronization between the client and server.

Redis is used for fast-access state and to support concurrent interview sessions.

MongoDB stores persistent application data.

## Key Engineering Focus

### Real-time communication

Socket.IO enables the interviewer and candidate to communicate without repeatedly polling the server.

### Concurrent sessions

The backend is designed around independent interview sessions so multiple users can use the platform simultaneously.

### Live coding

Candidates can write and execute code as part of the interview instead of treating coding questions as static text.

### AI interviewer

The AI generates and conducts interview interactions, allowing the interview to feel closer to an actual technical interview.

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/Raj-dev08/Interviewer.git
cd Interviewer
```

### 2. Install dependencies

```bash
npm install
```

Run the frontend and backend according to the project scripts.

### 3. Environment Variables

Create a `.env` file with the required database, Redis and AI service credentials.

Example:

```env
MONGODB_URI=
REDIS_URL=
AI_API_KEY=
```

### 4. Start the application

```bash
npm run dev
```

## Why I built it

I wanted to build something beyond a standard CRUD application and work on problems involving real-time communication, concurrent users, AI integration, backend state management and code execution.

The project helped me understand how different backend components work together in an application where state and communication need to happen in real time.
