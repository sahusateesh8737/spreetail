# Data Anomaly Log & Schema Definition (SCOPE)

This document tracks all the data anomalies discovered in the provided `SpreetailAssignmentExpenses.csv` testing dataset, the logic used to handle them during the import process (`import_expenses.py`), and the final database schema constructed to support the application.

## 1. Data Anomalies & Handling Strategies

While importing the historical expense data, several formatting and logical inconsistencies were identified. Here is how the import script handled them to ensure data integrity:

| Anomaly Type | Description of Issue | Resolution Strategy |
| :--- | :--- | :--- |
| **Inconsistent Usernames** | The `paid_by` and `split_with` columns had inconsistent casing (e.g., `priya`, `Priya`) and naming conventions (`Priya S` vs `Priya`). | Implemented a `clean_name()` function that sanitizes strings, maps known aliases (`priya s` -> `Priya`), and applies `.capitalize()` to enforce unique database user creation. |
| **Stringified Amounts** | Some values in the `amount` column contained commas representing thousands (e.g., `"1,200"`), which break standard float/decimal casting. | Stripped all commas and whitespace before converting the string to Python's high-precision `Decimal` type. |
| **Missing Currencies** | Several rows lacked a `currency` value completely. | Applied a fallback default of `INR` whenever the currency field was missing or evaluated to `NaN`. |
| **Mixed Date Formats** | Dates were recorded in completely different formats: standard `DD-MM-YYYY` (e.g., `01-02-2026`) and abbreviated string formats (e.g., `Mar-14`). | Wrote a regex-based parser that identifies `[A-Za-z]{3}-\d{2}` formats and appends the assumed year (2026), falling back to standard `datetime.strptime` parsing. |
| **Invalid Percentages** | In some "percentage" splits, the percentages provided did not mathematically sum to 100% (e.g., Aisha 30%; Rohan 30%; Priya 30%; Meera 20% = 110%). | Automatically *normalized* the percentages. The script sums the provided values and calculates the true mathematical ratio (e.g., 30/110) before applying it to the total amount. |
| **Settlements Disguised as Expenses** | Some rows (e.g., "Rohan paid Aisha back") were recorded as expenses, but lacked a `split_type` and only targeted a single user. | Added conditional logic: if `split_type` is empty but `split_with` contains exactly one user, the script intercepts the row and creates a `Settlement` record instead of an `Expense`. |
| **Empty Rows** | The CSV contained entirely blank/null rows. | Skipped processing for any row where both `amount` and `description` evaluate to `NaN`. |

---

## 2. Database Schema Design

To support the robust math required by Splitwise and the real-time constraints of the MVP, the database was built using a strictly relational structure (SQLite for the MVP). 

By splitting `Expense` and `ExpenseSplit` into two tables, the backend offloads complex math calculations from the frontend and ensures that total balances are calculated purely via SQL aggregations.

### `User` (Extends Django's AbstractUser)
- Handles authentication and identity.
- **Fields:** `id`, `username`, `email`, `password`

### `Group`
- Represents a logical container for users sharing expenses.
- **Fields:** 
  - `id` (Primary Key)
  - `name` (String)
  - `members` (ManyToMany -> `User`)
  - `created_at` (DateTime)

### `Expense`
- Represents the parent transaction paid by a single user.
- **Fields:**
  - `id` (Primary Key)
  - `group` (ForeignKey -> `Group`)
  - `payer` (ForeignKey -> `User`)
  - `total_amount` (Decimal)
  - `currency` (String)
  - `description` (String)
  - `notes` (Text)
  - `date` (Date)
  - `created_at` (DateTime)

### `ExpenseSplit`
- Represents the exact financial burden placed on a specific user for a specific expense. **This is the table used for all balance calculations.**
- **Fields:**
  - `id` (Primary Key)
  - `expense` (ForeignKey -> `Expense`)
  - `user` (ForeignKey -> `User`)
  - `amount_owed` (Decimal) - *The exact numeric amount, regardless of how it was split.*
  - `split_type` (Enum: `equal`, `unequal`, `percentage`, `share`)
  - `split_details` (String) - *Stores the raw input, e.g., "30%" or "2 shares".*

### `Settlement`
- Represents a 1-to-1 cash payment to clear debts.
- **Fields:**
  - `id` (Primary Key)
  - `payer` (ForeignKey -> `User`)
  - `payee` (ForeignKey -> `User`)
  - `amount` (Decimal)
  - `currency` (String)
  - `date` (Date)
  - `notes` (Text)

### `ChatMessage`
- Represents a single real-time message tied to a specific expense thread.
- **Fields:**
  - `id` (Primary Key)
  - `expense` (ForeignKey -> `Expense`)
  - `user` (ForeignKey -> `User`)
  - `text` (Text)
  - `timestamp` (DateTime)
