# Bank Lending System

This project is a full-stack web application that simulates a simple bank lending system. It allows the bank to issue loans to customers and enables customers to make payments. The system provides a complete overview of customer accounts and detailed ledgers for each loan.

## Features

* **LEND**: Create new loans for customers with a specified principal, interest rate, and tenure.
* **PAYMENT**: Record payments against a loan, supporting both fixed EMIs and lump-sum amounts.
* **LEDGER**: View a detailed statement for any loan, including its current balance, EMIs left, and a full transaction history.
* **ACCOUNT OVERVIEW**: Get a consolidated summary of all loans taken by a specific customer.

## Technology Stack

The application is built with a modern, separated frontend and backend architecture.

* **Frontend**: **React.js**
    * A single-page application (SPA) providing a dynamic and responsive user interface.
* **Backend**: **Node.js** with **Express.js**
    * A lightweight and efficient RESTful API server to handle all business logic.
* **Database**: **SQLite**
    * A simple, file-based SQL database for data persistence.

## API Documentation

The backend exposes the following RESTful API endpoints:

| Function           | Method | Endpoint                                   | Description                               |
| ------------------ | ------ | ------------------------------------------ | ----------------------------------------- |
| **LEND** | `POST` | `/api/v1/loans`                            | Creates a new loan.                       |
| **PAYMENT** | `POST` | `/api/v1/loans/{loan_id}/payments`         | Records a payment for a specific loan.    |
| **LEDGER** | `GET`  | `/api/v1/loans/{loan_id}/ledger`           | Retrieves the full ledger for a loan.     |
| **ACCOUNT OVERVIEW**| `GET`  | `/api/v1/customers/{customer_id}/overview` | Retrieves all loans for a customer.       |

---

## Local Setup and Installation

To run this project on your local machine, you will need to have **Node.js** and **npm** installed. Follow these steps to get both the backend and frontend running.

### 1. Backend Setup

First, set up and run the Node.js API server.

```bash
# Navigate to the backend project directory
cd bank-lending-system

# Install the necessary dependencies
npm install

# Set up the SQLite database and create the tables
# (This only needs to be run once)
node setdb.js

# Start the backend server (runs on http://localhost:3000)
npm start
```

Leave this terminal running.

### 2. Frontend Setup

Next, in a **new terminal window**, set up and run the React application.

```bash
# Navigate to the frontend project directory
cd bank-frontend

# Install the necessary dependencies
npm install

# Start the React development server (runs on http://localhost:3001)
npm start
```

### 3. Usage

Once both servers are running, open your web browser and navigate to **`http://localhost:3001`**. You can now use the application's user interface to interact with the lending system.
