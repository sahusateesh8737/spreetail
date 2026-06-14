# Splitwise Clone

A simplified, fully-functional clone of Splitwise built as part of the Spreetail internship assignment.

## Tech Stack
- **Backend:** Django, Django REST Framework, Django Channels (WebSockets for real-time chat), SQLite (Relational DB).
- **Frontend:** React, Vite, TailwindCSS, React Router.
- **AI Collaborator:** Developed collaboratively with an autonomous AI agent (Google Antigravity/Gemini).

## Deliverables
- `AI_CONTEXT.md`: The single source of truth documenting the product scope, research, and technical decisions.
- `BUILD_PLAN.md`: The engineering plan and architecture.

## Setup Instructions

### 1. Backend (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers channels daphne pandas
python manage.py makemigrations
python manage.py migrate

# Optional: Import the test CSV data
python manage.py import_expenses

# Start the ASGI server (required for WebSockets)
daphne config.asgi:application --port 8000
```

### 2. Frontend (React)
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

### 3. Usage
1. Open `http://localhost:5173` in your browser.
2. Click **Register** to create a new user account.
3. Log in.
4. Create a group, add members by their username, and start adding expenses to test the split calculations!
