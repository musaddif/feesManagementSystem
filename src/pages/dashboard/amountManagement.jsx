import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import SideBar from "../../component/sideBar";
import Header from "../../component/header";
import Button from "../../component/button/button";
import { fetchTotalAmount, fetchTransactions, addMoneyThunk, addExpenseThunk } from "../../store/Thunk/amountThunk";
import "../style/amountManagement.css";
import { Skeleton, TableSkeleton } from "../../component/loader/skeleton";

const AmountManagement = () => {
  const dispatch = useDispatch();
  const { totalAmount, cashInHand, transactions, loading } = useSelector((state) => state.amount);
  const [activeTab, setActiveTab] = useState("add-money");

  // Form States
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [chequeNumber, setChequeNumber] = useState("");
  const [walletName, setWalletName] = useState("");
  const [walletNumber, setWalletNumber] = useState("");

  useEffect(() => {
    dispatch(fetchTotalAmount());
    dispatch(fetchTransactions());
  }, [dispatch]);

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setPaymentMethod("Cash");
    setChequeNumber("");
    setWalletName("");
    setWalletNumber("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || amount <= 0) {
      alert("Please fill all required fields correctly.");
      return;
    }

    if (paymentMethod === "Cheque" && !chequeNumber) {
      alert("Cheque number is required.");
      return;
    }

    if (paymentMethod === "Wallet" && (!walletName || !walletNumber)) {
      alert("Wallet details are required.");
      return;
    }

    const payload = {
      title,
      amount: parseFloat(amount),
      paymentMethod,
      chequeNumber,
      walletName,
      walletNumber,
    };

    try {
      if (activeTab === "add-money") {
        await dispatch(addMoneyThunk(payload)).unwrap();
        alert("Money added successfully!");
      } else {
        if (parseFloat(amount) > totalAmount) {
          alert("Insufficient balance!");
          return;
        }
        await dispatch(addExpenseThunk(payload)).unwrap();
        alert("Expense recorded successfully!");
      }
      resetForm();
    } catch (error) {
      alert(error || "Transaction failed.");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden  ">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SideBar />
        <div className="flex-1 overflow-y-auto amount-management-container  ">
          <h1 className="text-2xl font-bold mb-6 text-center">Amount Management</h1>

          {/* Dashboard Summary Cards */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Total Balance Card */}
            <div className="balance-card flex-1">
              <span className="text-lg opacity-80">Total Balance</span>
              {loading && totalAmount === 0 ? (
                <Skeleton className="h-10 w-48 mt-2" />
              ) : (
                <div className="balance-amount">Rs. {totalAmount.toLocaleString()}</div>
              )}
            </div>

            {/* Cash in Hand Card */}
            <div className="balance-card flex-1" style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }}>
              <span className="text-lg opacity-80">Cash in Hand</span>
              {loading && cashInHand === 0 ? (
                <Skeleton className="h-10 w-48 mt-2" />
              ) : (
                <div className="balance-amount">Rs. {cashInHand.toLocaleString()}</div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <div
              className={`tab-button ${activeTab === "add-money" ? "active" : ""}`}
              onClick={() => { setActiveTab("add-money"); resetForm(); }}
            >
              Earned
            </div>
            <div
              className={`tab-button ${activeTab === "expense" ? "active" : ""}`}
              onClick={() => { setActiveTab("expense"); resetForm(); }}
            >
              Make Payment
            </div>
          </div>

          {/* Form */}
          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="input-group">
                  <label className="input-label">Title / Description</label>
                  <input
                    type="text"
                    className="input-field"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Student Fees, Office Rent"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Amount (Rs.)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Payment Method</label>
                <div className="radio-group">
                  {["Cash", "Cheque", "Wallet"].map((method) => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>

              {paymentMethod === "Cheque" && (
                <div className="input-group">
                  <label className="input-label">Cheque Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    placeholder="Enter cheque number"
                    required
                  />
                </div>
              )}

              {paymentMethod === "Wallet" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="input-group">
                    <label className="input-label">Wallet Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      placeholder="e.g. EasyPaisa, SadaPay"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Wallet Number</label>
                    <input
                      type="text"
                      className="input-field"
                      value={walletNumber}
                      onChange={(e) => setWalletNumber(e.target.value)}
                      placeholder="Enter wallet number"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                loadingText="Processing..."
                className="w-full mt-4"
              >
                {activeTab === "add-money" ? "Earned" : "Make Payment"}
              </Button>
            </form>
          </div>

          {/* Recent Transactions Table */}
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading && transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4">
                      <TableSkeleton rows={5} cols={6} />
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td>{t.title}</td>
                      <td className={t.type === "income" ? "type-income" : "type-expense"}>
                        {t.type.toUpperCase()}
                      </td>
                      <td>Rs. {t.amount.toLocaleString()}</td>
                      <td>{t.payment_method}</td>
                      <td className="text-sm text-gray-600">
                        {t.payment_method === "Cheque" && `Cheque: ${t.cheque_number}`}
                        {t.payment_method === "Wallet" && `${t.wallet_name}: ${t.wallet_number}`}
                        {t.payment_method === "Cash" && "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-gray-500">No transactions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmountManagement;
