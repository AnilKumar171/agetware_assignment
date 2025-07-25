const db = require('./db.js');

const setup = () => {
  db.serialize(() => {

    db.run(`CREATE TABLE IF NOT EXISTS Customers (
      customer_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Loans (
      loan_id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      principal_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      balance_amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      loan_period_years INTEGER NOT NULL,
      monthly_emi REAL NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Payments (
      payment_id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_type TEXT NOT NULL,
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES Loans(loan_id)
    )`);
    console.log('Database tables created successfully.');
  });

  db.close();
};

setup();