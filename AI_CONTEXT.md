# Splitwise Clone - Project Context

This document serves as the single source of truth for the project. It will be updated continuously as requirements, architecture, and implementation details are finalized.

## 1. Product & Scope
*   **Product Goals:** Build a simplified Splitwise-inspired app in 2 days.
*   **Minimum Product Requirements:**
    1. Login module
    2. Create and manage groups (invite users, add users, and remove users).
    3. Create and manage expenses:
        *   Split equally, unequally, by percentage, and by share.
        *   User chat in an expense (real-time updates).
        *   Group-wise balances and individual balance summary.
        *   Settle debts or record payments.
    4. Must use relational databases only.
*   **Splitwise Research & Analysis:** The core mechanic of Splitwise is the ability to record expenses and divide them accurately among participants. The most critical workflow is ensuring the sum of splits equals the total amount.
*   **User Personas:** Friends sharing trips, flatmates sharing rent/utilities, couples managing joint expenses.
*   **Core Workflows:** 
    1. Authenticate user. 
    2. Create a group and add members. 
    3. Add an expense (calculating precise splits). 
    4. View balances to see who owes who. 
    5. Settle debts via recorded payments.
*   **MVP Scope (2-day version):** Complete execution of the 4 core workflows with 4 distinct split types (equal, unequal, percentage, share) and real-time WebSocket chat on the expense level.
*   **Out-of-Scope Features:** Debt simplification algorithms, receipt scanning, OAuth integrations, Push Notifications.

## 2. Core Features & Logic
*   **Authentication:** JWT (JSON Web Tokens) via Django REST Framework Simple JWT.
*   **Groups:** Users can create groups, invite users (via email/username), and remove users.
*   **Expenses:** Handled via an `Expense` model and an `ExpenseSplit` model to record exact owed amounts per user, supporting all 4 split types by calculating the exact numeric amount at the time of creation.
*   **Settlements:** Simple 1-to-1 recorded payments. No complex debt simplification algorithm to save time for the MVP.
*   **Balance Calculation:** Calculated dynamically by aggregating total paid minus total owed in `ExpenseSplit` and `Settlement` tables.

## 3. Architecture & Technical Decisions
*   **Frontend Architecture:** React (with React Router for navigation, TailwindCSS for styling).
*   **UI Screens & Routing:** Login/Register, Dashboard (Group List), Group Detail (Expense List), Expense Detail (with real-time Chat).
*   **Backend Architecture:** Django & Django REST Framework.
*   **Database Choice:** SQLite (Chosen for speed of MVP development in 2 days).
*   **Data Model:** 
    * `User`
    * `Group` (name, members)
    * `Expense` (group, payer, total_amount, description, date)
    * `ExpenseSplit` (expense, user, amount_owed, split_type: equal/unequal/percentage/share)
    * `Settlement` (payer, payee, amount, date)
    * `ChatMessage` (expense, user, text, timestamp)
*   **API Design:** RESTful endpoints for all resources, WebSocket endpoints for chat.
*   **Real-time Tech:** Django Channels with WebSockets for the expense chat.

## 4. Engineering Practices
*   **Deployment:** The frontend is configured for deployment on Vercel/Netlify, while the Django backend (Daphne ASGI) is configured for deployment on Render/Heroku.
*   **Testing:** End-to-end testing was performed using the provided `SpreetailAssignmentExpenses.csv`. A custom Django management command `import_expenses.py` was written to test the system's ability to parse, clean, and calculate balances for messy data edge cases.
*   **Changes Made During Implementation:** 
    - The `ChatMessage` model was added mid-flight to support the real-time chat requirement.
    - Moved from a mocked `CURRENT_USER` variable directly to a robust JWT `AuthContext` to ensure the app is a true full-stack MVP.
*   **Known Risks & Tradeoffs:** 
    - Using SQLite might not scale well with Django Channels in production, but fits the 2-day limit.
    - Avoiding debt-simplification saves significant algorithm development time.
    - Currency is hardcoded to INR on the frontend to speed up development.
