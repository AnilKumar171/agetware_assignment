const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db.js');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// LEND: Create a new loan
app.post('/api/v1/loans', (req, res) => {
  const { customer_id, loan_amount, loan_period_years, interest_rate_yearly } = req.body;

  if (!customer_id || !loan_amount || !loan_period_years || !interest_rate_yearly) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const P = loan_amount;
  const N = loan_period_years;
  const R = interest_rate_yearly;

  const totalInterest = P * N * (R / 100);
  const totalAmountPayable = P + totalInterest;
  const monthlyEmi = totalAmountPayable / (N * 12);
  const loanId = uuidv4();

  const query = `INSERT INTO Loans (loan_id, customer_id, principal_amount, total_amount, balance_amount, interest_rate, loan_period_years, monthly_emi)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [loanId, customer_id, P, totalAmountPayable, totalAmountPayable, R, N, monthlyEmi];

  db.run(query, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      loan_id: loanId,
      customer_id: customer_id,
      total_amount_payable: totalAmountPayable,
      monthly_emi: parseFloat(monthlyEmi.toFixed(2))
    });
  });
});

// PAYMENT: Record a payment for a loan
app.post('/api/v1/loans/:loan_id/payments', (req, res) => {
  const { loan_id } = req.params;
  const { amount, payment_type } = req.body;

  if (!amount || !payment_type) {
    return res.status(400).json({ error: 'Missing required fields: amount, payment_type' });
  }

  db.serialize(() => {
    db.get('SELECT * FROM Loans WHERE loan_id = ?', [loan_id], (err, loan) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!loan) {
        return res.status(404).json({ error: 'Loan not found.' });
      }

      const newBalance = loan.balance_amount - amount;
      const emisLeft = Math.floor(newBalance / loan.monthly_emi);
      const paymentId = uuidv4();

      const paymentSql = 'INSERT INTO Payments (payment_id, loan_id, amount, payment_type) VALUES (?, ?, ?, ?)';
      db.run(paymentSql, [paymentId, loan_id, amount, payment_type]);

      const loanUpdateSql = 'UPDATE Loans SET balance_amount = ?, status = ? WHERE loan_id = ?';
      const newStatus = newBalance <= 0 ? 'PAID_OFF' : 'ACTIVE';
      db.run(loanUpdateSql, [newBalance, newStatus, loan_id]);

      res.status(200).json({
        payment_id: paymentId,
        loan_id: loan_id,
        message: 'Payment recorded successfully.',
        remaining_balance: newBalance,
        emis_left: emisLeft
      });
    });
  });
});

// LEDGER: View loan details and transaction history
app.get('/api/v1/loans/:loan_id/ledger', (req, res) => {
  const { loan_id } = req.params;
  const loanSql = `SELECT loan_id, customer_id, principal_amount, total_amount, balance_amount, monthly_emi FROM Loans WHERE loan_id = ?`;

  db.get(loanSql, [loan_id], (err, loan) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    const paymentsSql = `SELECT payment_id as transaction_id, payment_date as date, amount, payment_type as type FROM Payments WHERE loan_id = ? ORDER BY payment_date DESC`;
    db.all(paymentsSql, [loan_id], (err, transactions) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const amountPaid = transactions.reduce((sum, t) => sum + t.amount, 0);
      const emisLeft = loan.balance_amount > 0 ? Math.floor(loan.balance_amount / loan.monthly_emi) : 0;

      res.status(200).json({
        loan_id: loan.loan_id,
        customer_id: loan.customer_id,
        principal: loan.principal_amount,
        total_amount: loan.total_amount,
        monthly_emi: loan.monthly_emi,
        amount_paid: amountPaid,
        balance_amount: loan.balance_amount,
        emis_left: emisLeft,
        transactions: transactions
      });
    });
  });
});

// ACCOUNT OVERVIEW: View all loans for a customer
app.get('/api/v1/customers/:customer_id/overview', (req, res) => {
  const { customer_id } = req.params;
  const sql = `
    SELECT
      L.loan_id,
      L.principal_amount as principal,
      L.total_amount,
      (L.total_amount - L.principal_amount) as total_interest,
      L.monthly_emi as emi_amount,
      L.balance_amount,
      COALESCE(SUM(P.amount), 0) as amount_paid
    FROM Loans L
    LEFT JOIN Payments P ON L.loan_id = P.loan_id
    WHERE L.customer_id = ?
    GROUP BY L.loan_id
  `;

  db.all(sql, [customer_id], (err, loans) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (loans.length === 0) {
      return res.status(404).json({ error: 'No loans found for this customer.' });
    }

    const loansWithEmisLeft = loans.map(loan => {
      const emisLeft = loan.balance_amount > 0 ? Math.floor(loan.balance_amount / loan.emi_amount) : 0;
      return { ...loan, emis_left: emisLeft };
    });

    res.status(200).json({
      customer_id: customer_id,
      total_loans: loans.length,
      loans: loansWithEmisLeft
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});