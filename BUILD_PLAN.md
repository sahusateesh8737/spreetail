# Splitwise Clone MVP - Build Plan

## 1. Product Research
*   **How I studied Splitwise:** Analyzed the core user journey of splitting bills among friends and roommates.
*   **What I learned:** The core value prop is tracking exactly who owes who, preventing awkward money conversations.
*   **Workflows identified:** Group Creation, Expense Addition (with various split logic), Group/Individual Balance Viewing, Debt Settlement, and Expense Chat.
*   **Product Assumptions:** 
    * User chat is scoped specifically to individual expenses, not the group as a whole.
    * "Settle debts" means recording a 1-to-1 payment, avoiding complex debt simplification algorithms for a 2-day MVP.

## 2. Architecture
*   **Tech Stack:** React (Frontend), Django (Backend).
*   **Database:** SQLite (Chosen for speed of setup).
*   **Auth:** JWT via Django REST Framework.
*   **Real-time Chat:** WebSockets via Django Channels.
*   **Frontend Structure:** React Router for navigation, TailwindCSS for styling.
*   **Deployment Approach:** Designed to deploy the React frontend via Vercel and the Django backend via Render.

### Database Schema
*   `User`: Django's built-in user model.
*   `Group`: name, members (ManyToMany).
*   `Expense`: group (FK), payer (FK), total_amount, description, date.
*   `ExpenseSplit`: expense (FK), user (FK), amount_owed, split_type.
*   `Settlement`: payer (FK), payee (FK), amount, date.
*   `ChatMessage`: expense (FK), user (FK), text, timestamp.

## 3. AI Collaboration Process
*   **How the AI was instructed:** The PM (User) instructed the AI to act as a junior engineer and ask questions instead of assuming requirements.
*   **Questions Asked:** Stack choices, DB choice, auth strategy, data modeling for splits, real-time tech, and settlement logic.
*   **How the plan evolved:** The PM requested the AI to skip questions and start working immediately. The AI formulated this proposed plan based on standard practices to keep moving forward.
*   **How AI_CONTEXT.md was maintained:** The AI updated the context file after every decision (and assumption) made.

## 4. Tradeoffs
*   **What we simplified:** Skipped complex debt-simplification algorithms (graph minimization).
*   **What we hardcoded:** Currency strings are largely hardcoded to INR on the frontend.
*   **What we avoided:** Non-relational databases, complex OAuth flows, receipt scanning.
*   **What we would improve with more time:** Add a debt-simplification algorithm, push notifications, and migrate to PostgreSQL for better concurrency with WebSockets.
