import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api/expenses";
const today = () => new Date().toISOString().split("T")[0];
const colors = { Food: "#d5a66b", Travel: "#82a995", Bills: "#9b91bd", Shopping: "#d88e91", Other: "#8babae" };
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function App() {
  const [expenses, setExpenses] = useState([]), [title, setTitle] = useState(""), [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food"), [date, setDate] = useState(today());
  const [editingId, setEditingId] = useState(null), [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");

  async function loadExpenses() {
    try { const { data } = await axios.get(API); setExpenses(data); setError(""); }
    catch { setError("Cannot connect to the server. Check that your backend is running."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadExpenses(); }, []);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const categories = expenses.reduce((obj, e) => ({ ...obj, [e.category]: (obj[e.category] || 0) + Number(e.amount) }), {});
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  function resetForm() {
    setTitle(""); setAmount(""); setCategory("Food"); setDate(today()); setEditingId(null); setError("");
  }
  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return setError("Enter a title and an amount greater than zero.");
    const data = { title: title.trim(), amount: Number(amount), category, date };
    try {
      if (editingId) await axios.put(`${API}/${editingId}`, data);
      else await axios.post(API, data);
      resetForm(); await loadExpenses();
    } catch { setError("Could not save the expense. Please try again."); }
  }
  function editExpense(e) {
    setTitle(e.title); setAmount(String(e.amount)); setCategory(e.category);
    setDate(new Date(e.date).toISOString().split("T")[0]); setEditingId(e._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function deleteExpense() {
    try { await axios.delete(`${API}/${deleteId}`); setDeleteId(null); await loadExpenses(); }
    catch { setError("Could not delete the expense."); setDeleteId(null); }
  }

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-icon">₹</span> penny<span className="brand-light">wise</span></a><span className="topbar-label">PERSONAL FINANCE</span></header>

    <section className="welcome"><div><p className="eyebrow">YOUR MONEY, YOUR PEACE</p><h1>Expense tracker<span>.</span></h1><p className="welcome-text">A little clarity goes a long way. Keep track of where your money goes.</p></div><div className="welcome-art" aria-hidden="true"><span>₹</span><i>✳</i></div></section>

    <section className="summary-grid">
      {[{ label: "Total expenses", value: money(total), note: "Your recorded spending", icon: "↗", cls: "total-card" }, { label: "Transactions", value: expenses.length, note: "Expenses recorded", icon: "▤" }, { label: "Top category", value: topCategory, note: "Based on your spending", icon: "✳", cls: "category-highlight" }].map((item, i) => <article className={`summary-card ${item.cls === "total-card" ? item.cls : ""}`} key={item.label}><div className="card-top"><span>{item.label}</span><span className="summary-icon">{item.icon}</span></div><h2 className={i === 2 ? "category-highlight" : ""}>{item.value}</h2><p>{item.note}</p></article>)}
    </section>

    <section className="content-grid">
      <article className="panel form-panel"><div className="panel-heading"><div><p className="eyebrow">KEEP IT ORGANIZED</p><h2>{editingId ? "Edit expense" : "Add an expense"}</h2></div><span className="heading-symbol">＋</span></div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Expense title</label><input id="title" placeholder="e.g. Lunch with friends" value={title} onChange={e => setTitle(e.target.value)} required />
          <label htmlFor="amount">Amount (₹)</label><input id="amount" type="number" placeholder="0.00" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          <div className="form-row"><div><label htmlFor="category">Category</label><select id="category" value={category} onChange={e => setCategory(e.target.value)}>{["Food", "Travel", "Bills", "Shopping", "Other"].map(c => <option key={c}>{c}</option>)}</select></div><div><label htmlFor="date">Date</label><input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required /></div></div>
          {error && <p className="error-message">{error}</p>}<button className="primary-button" type="submit">{editingId ? "Save changes" : "＋ Add expense"}</button>
          {editingId && <button className="cancel-button" type="button" onClick={resetForm}>Cancel editing</button>}
        </form>
      </article>

      <article className="panel overview-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR SPENDING</p><h2>Category overview</h2></div><span className="heading-symbol">◔</span></div>
        {!Object.keys(categories).length ? <div className="empty-chart"><div className="empty-chart-icon">◌</div><p>Your spending story starts here.</p><span>Add an expense to see your categories.</span></div> : <div className="category-list">{Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([name, value]) => <div className="category-item" key={name}><div className="category-line"><span><i style={{ background: colors[name] }} />{name}</span><strong>{money(value)}</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${value / (total || 1) * 100}%`, background: colors[name] }} /></div></div>)}</div>}
        <div className="overview-footer"><span>All-time spending</span><strong>{money(total)}</strong></div>
      </article>
    </section>

    <section className="panel transactions-panel"><div className="panel-heading transactions-heading"><div><p className="eyebrow">THE LITTLE THINGS ADD UP</p><h2>Recent expenses</h2></div><span className="transaction-count">{expenses.length} {expenses.length === 1 ? "entry" : "entries"}</span></div>
      {loading ? <p className="empty-table">Loading your expenses...</p> : !expenses.length ? <div className="empty-table"><div className="empty-table-icon">♡</div><h3>Nothing here just yet</h3><p>Add your first expense to start building a clearer picture of your spending.</p></div> : <div className="table-wrapper"><table><thead><tr><th>EXPENSE</th><th>CATEGORY</th><th>DATE</th><th className="amount-column">AMOUNT</th><th className="actions-column">ACTIONS</th></tr></thead><tbody>{[...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => <tr key={e._id}><td><div className="expense-title"><span className="expense-dot" style={{ background: colors[e.category] }} />{e.title}</div></td><td><span className="category-pill">{e.category}</span></td><td className="date-cell">{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td className="amount-column amount-cell">{money(Number(e.amount))}</td><td className="actions-column"><button className="action-button edit-button" onClick={() => editExpense(e)} type="button">Edit</button> <button className="action-button delete-button" onClick={() => setDeleteId(e._id)} type="button">Delete</button></td></tr>)}</tbody></table></div>}
    </section>

    {deleteId && <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className="delete-modal"><h2 id="delete-title">Delete expense?</h2><p>Are you sure you want to delete this expense?</p><div className="delete-modal-actions"><button type="button" onClick={() => setDeleteId(null)}>Cancel</button><button type="button" onClick={deleteExpense}>Delete</button></div></div></div>}
    <footer className="footer"><span>Made for more mindful spending ♡</span><span>pennywise · Personal Expense Tracker</span></footer>
  </main>;
}
