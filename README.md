# Todo App

A full-stack Todo App with Node.js/Express backend, MongoDB database, and a styled frontend.

---

##  Project Structure

```
todo-app/
├── server.js          ← Express backend + REST API
├── package.json       ← Node.js dependencies
├── .env.example       ← Environment variable template
└── public/
    └── index.html     ← Frontend (HTML + CSS + JS)
```

---

##  Setup Instructions

### 1. Install dependencies
```bash
npm install
```

### 2. Set up MongoDB

**Option A — Local MongoDB:**
Make sure MongoDB is installed and running:
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Windows — start from Services or run:
net start MongoDB
```
No database creation needed — MongoDB creates it automatically on first use.

**Option B — MongoDB Atlas (free cloud):**
1. Create a free cluster at https://cloud.mongodb.com
2. Click Connect → Drivers → copy the connection string
3. Use that string as your `MONGO_URI` in `.env`

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/todo-app
```

### 4. Start the server
```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

### 5. Open the app
Visit: **http://localhost:3000**

---

##  API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/todos` | List todos (`?filter=all\|active\|completed`) |
| GET | `/api/todos/stats` | Total / active / completed counts |
| POST | `/api/todos` | Create a new todo |
| PATCH | `/api/todos/:id` | Edit text, priority, or toggle completed |
| DELETE | `/api/todos/:id` | Delete a todo |
| DELETE | `/api/todos/completed/all` | Delete all completed todos |

### POST / PATCH body example
```json
{
  "text": "Buy groceries",
  "priority": "high",
  "completed": false
}
```

Valid priorities: `low`, `medium`, `high`

---

## Features

-  Add todos with text and priority (High / Medium / Low)
-  Mark todos as complete with a checkbox
-  Inline edit — click Edit to change text in place
-  Delete individual todos
-  Clear all completed todos at once
-  Filter by All / Active / Completed
-  Stats overview (total, active, completed)
-  Progress bar showing % completion
-  Toast notifications for all actions
-  Matching Kirang Haerang font styling
