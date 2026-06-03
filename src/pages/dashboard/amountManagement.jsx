import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import SideBar from "../../component/sideBar";
import Header from "../../component/header";
import Button from "../../component/button/button";
import { fetchTotalAmount, fetchTransactions, addMoneyThunk, addExpenseThunk, withdrawCashThunk } from "../../store/Thunk/amountThunk";
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

  // New Expense Form States
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseMessage, setExpenseMessage] = useState("");
  const [expenseMessageType, setExpenseMessageType] = useState("");

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

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(expenseAmount);

    if (val > cashInHand) {
      setExpenseMessage("Expense amount cannot exceed Cash In Hand.");
      setExpenseMessageType("error");
      return;
    }

    try {
      await dispatch(withdrawCashThunk({ amount: val, description: expenseDescription })).unwrap();
      setExpenseMessage("Expense added successfully.");
      setExpenseMessageType("success");
      setExpenseAmount("");
      setExpenseDescription("");
      // Clear message after 3 seconds
      setTimeout(() => setExpenseMessage(""), 3000);
    } catch (error) {
      setExpenseMessage(error || "Withdrawal failed.");
      setExpenseMessageType("error");
    }
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
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-shrink-0 h-full">
          <SideBar />
        </div>
        <div className="flex-1 overflow-y-auto amount-management-container">
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
                    placeholder="e.g.Fees,  Rent"
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
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={loading}
                  loadingText="Processing..."
                  className="w-full sm:w-1/4 mt-4"
                >
                  {activeTab === "add-money" ? "Earned" : "Make Payment"}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <span className="p-2 bg-red-100 text-red-600 rounded-lg">💸</span>
              Deposit Cash to University/Board Account
            </h2>
            <form onSubmit={handleExpenseSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600">Amount (Rs.)</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-1">
                <label className="text-sm font-semibold text-gray-600">Description</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. deposit to university account"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                loading={loading}
                loadingText="Saving..."
                className="w-full sm:w-3/4 sm:ml-0"
              >
                Deposit
              </Button>

            </form>
            {expenseMessage && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${expenseMessageType === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                {expenseMessage}
              </div>
            )}
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
                      <td>{t.title.replace(/^\[(WITHDRAW_CASH|EXPENSE)\]\s*/, "")}</td>
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
