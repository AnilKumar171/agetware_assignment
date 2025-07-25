import React, { useState } from 'react';
import './App.css';

const API_BASE_URL = 'https://agetware-assignment-1.onrender.com';

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState('lend'); // 'lend', 'payment', 'ledger', 'overview'
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 8000);
  };

  return (
    <div className="app-container">
      <Header setView={setView} currentView={view} />
      <main className="main-container">
        {feedback.message && <FeedbackBanner message={feedback.message} type={feedback.type} />}
        
        {view === 'lend' && <LendForm showFeedback={showFeedback} />}
        {view === 'payment' && <PaymentForm showFeedback={showFeedback} />}
        {view === 'ledger' && <Ledger />}
        {view === 'overview' && <AccountOverview />}
      </main>
    </div>
  );
}

// --- UI Components ---

function Header({ setView, currentView }) {
  return (
    <header className="header">
      <nav className="nav">
        <h1 className="header-title">Bank Lending System</h1>
        <div className="nav-button-group">
          <button onClick={() => setView('lend')} className={`nav-button ${currentView === 'lend' ? 'active' : ''}`}>Lend</button>
          <button onClick={() => setView('payment')} className={`nav-button ${currentView === 'payment' ? 'active' : ''}`}>Payment</button>
          <button onClick={() => setView('ledger')} className={`nav-button ${currentView === 'ledger' ? 'active' : ''}`}>Ledger</button>
          <button onClick={() => setView('overview')} className={`nav-button ${currentView === 'overview' ? 'active' : ''}`}>Overview</button>
        </div>
      </nav>
    </header>
  );
}

function FeedbackBanner({ message, type }) {
  return <div className={`feedback-banner ${type}`}>{message}</div>;
}

// --- Feature Components ---

function LendForm({ showFeedback }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    loan_amount: '',
    loan_period_years: '',
    interest_rate_yearly: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            loan_amount: parseFloat(formData.loan_amount),
            loan_period_years: parseInt(formData.loan_period_years),
            interest_rate_yearly: parseFloat(formData.interest_rate_yearly)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create loan.');
      showFeedback(`Loan created successfully! Loan ID: ${data.loan_id}`);
      setFormData({ customer_id: '', loan_amount: '', loan_period_years: '', interest_rate_yearly: '' });
    } catch (error) {
      showFeedback(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Create a New Loan</h2>
      <form onSubmit={handleSubmit} className="form">
        <input name="customer_id" value={formData.customer_id} onChange={handleChange} placeholder="Customer ID (e.g., cust-101)" className="input-field" required />
        <input name="loan_amount" type="number" value={formData.loan_amount} onChange={handleChange} placeholder="Loan Amount (e.g., 50000)" className="input-field" required />
        <input name="loan_period_years" type="number" value={formData.loan_period_years} onChange={handleChange} placeholder="Loan Period (Years)" className="input-field" required />
        <input name="interest_rate_yearly" type="number" step="0.1" value={formData.interest_rate_yearly} onChange={handleChange} placeholder="Interest Rate (e.g., 8)" className="input-field" required />
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Loan'}
        </button>
      </form>
    </div>
  );
}

function PaymentForm({ showFeedback }) {
    const [formData, setFormData] = useState({ loan_id: '', amount: '', payment_type: 'LUMP_SUM' });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/loans/${formData.loan_id}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(formData.amount),
                    payment_type: formData.payment_type
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to record payment.');
            showFeedback(`Payment of ${formData.amount} for Loan ID ${formData.loan_id} recorded successfully!`);
            setFormData({ loan_id: '', amount: '', payment_type: 'LUMP_SUM' });
        } catch (error) {
            showFeedback(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Record a Payment</h2>
            <form onSubmit={handleSubmit} className="form">
                <input name="loan_id" value={formData.loan_id} onChange={handleChange} placeholder="Loan ID" className="input-field" required />
                <input name="amount" type="number" value={formData.amount} onChange={handleChange} placeholder="Payment Amount" className="input-field" required />
                <select name="payment_type" value={formData.payment_type} onChange={handleChange} className="input-field">
                    <option value="LUMP_SUM">Lump Sum</option>
                    <option value="EMI">EMI</option>
                </select>
                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Record Payment'}
                </button>
            </form>
        </div>
    );
}

function Ledger() {
    const [loanId, setLoanId] = useState('');
    const [ledgerData, setLedgerData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFetch = async (e) => {
        e.preventDefault();
        if (!loanId) return;
        setIsLoading(true);
        setError('');
        setLedgerData(null);
        try {
            const response = await fetch(`${API_BASE_URL}/loans/${loanId}/ledger`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch ledger.');
            setLedgerData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">View Loan Ledger</h2>
            <form onSubmit={handleFetch} style={{display: 'flex', gap: '0.5rem', marginBottom: '1.5rem'}}>
                <input value={loanId} onChange={(e) => setLoanId(e.target.value)} placeholder="Enter Loan ID" className="input-field" style={{flexGrow: 1}} />
                <button type="submit" className="submit-button" style={{width: 'auto'}} disabled={isLoading}>
                    {isLoading ? 'Fetching...' : 'Get Ledger'}
                </button>
            </form>
            {error && <p className="error-message">{error}</p>}
            {ledgerData && <LedgerDetails data={ledgerData} />}
        </div>
    );
}

function LedgerDetails({ data }) {
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div className="info-grid">
                <InfoItem label="Loan ID" value={data.loan_id} />
                <InfoItem label="Customer ID" value={data.customer_id} />
                <InfoItem label="Principal" value={`Rs ${data.principal.toFixed(2)}`} />
                <InfoItem label="Total Amount" value={`Rs ${data.total_amount.toFixed(2)}`} />
                <InfoItem label="Amount Paid" value={`Rs ${data.amount_paid.toFixed(2)}`} />
                <InfoItem label="Balance" value={`Rs ${data.balance_amount.toFixed(2)}`} />
                <InfoItem label="Monthly EMI" value={`Rs ${data.monthly_emi.toFixed(2)}`} />
                <InfoItem label="EMIs Left" value={data.emis_left} />
            </div>
            <h3 className="transactions-title">Transactions</h3>
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="table-header">Date</th>
                            <th className="table-header">Type</th>
                            <th className="table-header align-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.transactions.length > 0 ? data.transactions.map((tx) => (
                            <tr key={tx.transaction_id}>
                                <td className="table-cell">{new Date(tx.date).toLocaleDateString()}</td>
                                <td className="table-cell">{tx.type}</td>
                                <td className="table-cell align-right monospace">Rs{tx.amount.toFixed(2)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" className="table-cell empty">No transactions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AccountOverview() {
    const [customerId, setCustomerId] = useState('');
    const [overviewData, setOverviewData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFetch = async (e) => {
        e.preventDefault();
        if (!customerId) return;
        setIsLoading(true);
        setError('');
        setOverviewData(null);
        try {
            const response = await fetch(`${API_BASE_URL}/customers/${customerId}/overview`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch overview.');
            setOverviewData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Customer Account Overview</h2>
            <form onSubmit={handleFetch} style={{display: 'flex', gap: '0.5rem', marginBottom: '1.5rem'}}>
                <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Enter Customer ID" className="input-field" style={{flexGrow: 1}} />
                <button type="submit" className="submit-button" style={{width: 'auto'}} disabled={isLoading}>
                    {isLoading ? 'Fetching...' : 'Get Overview'}
                </button>
            </form>
            {error && <p className="error-message">{error}</p>}
            {overviewData && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    {overviewData.loans.map(loan => (
                        <div key={loan.loan_id} className="overview-loan-card">
                             <h3 className="overview-loan-title">Loan ID: {loan.loan_id}</h3>
                             <div className="info-grid">
                                <InfoItem label="Principal" value={`Rs ${loan.principal.toFixed(2)}`} />
                                <InfoItem label="Total Interest" value={`Rs ${loan.total_interest.toFixed(2)}`} />
                                <InfoItem label="Total Amount" value={`Rs ${loan.total_amount.toFixed(2)}`} />
                                <InfoItem label="Amount Paid" value={`Rs ${loan.amount_paid.toFixed(2)}`} />
                                <InfoItem label="Balance" value={`Rs ${loan.balance_amount.toFixed(2)}`} />
                                <InfoItem label="EMIs Left" value={loan.emis_left} />
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <div className="info-item">
            <h3>{label}</h3>
            <p>{value}</p>
        </div>
    );
}
