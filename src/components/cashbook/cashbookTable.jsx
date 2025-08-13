"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  DollarSign,
  CreditCard,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Filtering helper
const filterTransactionsByDateAndType = (
  transactions,
  dateFrom,
  dateTo,
  type
) => {
  return transactions.filter((t) => {
    const d = new Date(t.date);
    const start = dateFrom ? new Date(dateFrom) : null;
    const end = dateTo ? new Date(dateTo) : null;
    if (type !== "all" && t.type !== type) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
};

const Cashbook = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    type: "expense",
    amount: "",
    category: "",
    method: "cash",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDescription, setDepositDescription] = useState(
    "Cash deposit to bank"
  );

  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalDescription, setWithdrawalDescription] = useState(
    "Cash withdrawal from bank"
  );

  const [netCash, setNetCash] = useState(0);
  const [totalbankValue, setTotalbankValue] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [totalIncomeInterest, setTotalIncomeInterest] = useState(0);
  const [totalArrears, setTotalArrears] = useState(0);
  const [totalOverpayment, setTotalOverpayment] = useState(0);
  const [totalServiceCharge, setTotalServiceCharge] = useState(0);

  // Quick filter state
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchTransactions();
    fetchTodayExpenses();
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/repayments/summary");
        const data = await res.json();
        if (data.code === "SUCCESS") {
          setTotalArrears(data.totalArrears || 0);
          setTotalOverpayment(data.totalOverpayment || 0);
        }
      } catch {}
    };
    fetchSummary();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cashbook?action=getAll");
      const result = await res.json();
      if (result.code === "SUCCESS") {
        setTransactions(
          result.data.map((r) => ({ ...r, amount: parseFloat(r.amount) }))
        );
        setNetCash(result.TotalCash);
        setTotalbankValue(result.TotalBank);
        setTotalOutstanding(result.TotalOutstanding);
        setTotalIncomeInterest(result.TotalIncomeInterest);
        setTotalServiceCharge(result.TotalServiceCharge || 0);
      } else {
        alert("Failed to load transactions");
      }
    } catch {
      alert("Error loading transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayExpenses = async () => {
    try {
      const res = await fetch("/api/cashbook?action=getTodayExpenses");
      const result = await res.json();
      if (result.code === "SUCCESS") {
        setTodayExpenses(result.data[0].TotalAmount || 0);
      }
    } catch {}
  };

  const cashTransactions = transactions.filter((t) => t.method === "cash");
  const bankTransactions = transactions.filter((t) => t.method === "bank");
  const expenses = transactions.filter((t) => t.type === "expense");

  const cashAmount = cashTransactions.reduce((sum, t) => {
    if (t.type === "income") return sum + t.amount;
    if (t.type === "expense") return sum - t.amount;
    if (t.type === "deposit") return sum - t.amount;
    if (t.type === "withdrawal") return sum + t.amount;
    return sum;
  }, 0);

  const bankValue = bankTransactions.reduce((sum, t) => {
    if (t.type === "income") return sum + t.amount;
    if (t.type === "expense") return sum - t.amount;
    if (t.type === "deposit") return sum - t.amount;
    if (t.type === "withdrawal") return sum + t.amount;
    return sum;
  }, 0);

  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

  // Filtered transactions (only quick filters now)
  const filteredTransactions = useMemo(
    () =>
      filterTransactionsByDateAndType(
        transactions,
        dateFrom,
        dateTo,
        transactionTypeFilter
      ),
    [transactions, dateFrom, dateTo, transactionTypeFilter]
  );

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstRow,
    indexOfLastRow
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / rowsPerPage)
  );

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const handleSubmit = async () => {
    if (
      !newTransaction.description ||
      !newTransaction.amount ||
      !newTransaction.category
    ) {
      alert("Fill all fields");
      return;
    }
    const amount = parseFloat(newTransaction.amount);
    if (
      newTransaction.type === "expense" &&
      newTransaction.method === "cash" &&
      amount > netCash
    ) {
      alert("Insufficient cash");
      return;
    }
    if (
      newTransaction.type === "expense" &&
      newTransaction.method === "bank" &&
      amount > totalbankValue
    ) {
      alert("Insufficient bank balance");
      return;
    }
    try {
      const res = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTransaction, amount }),
      });
      const result = await res.json();
      if (result.code === "SUCCESS") {
        setTransactions([
          { id: result.id, ...newTransaction, amount },
          ...transactions,
        ]);
        setNewTransaction({
          date: new Date().toISOString().split("T")[0],
          description: "",
          type: "expense",
          amount: "",
          category: "",
          method: "cash",
        });
        setShowForm(false);
        fetchTransactions();
        fetchTodayExpenses();
      } else {
        alert("Add failed");
      }
    } catch {
      alert("Error adding");
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Enter valid amount");
      return;
    }
    const amount = parseFloat(depositAmount);
    if (amount > cashAmount) {
      alert("Insufficient cash");
      return;
    }
    try {
      const cashRes = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          description: `${depositDescription} (Cash out)`,
          type: "deposit",
          amount,
          category: "Bank Deposit",
          method: "cash",
        }),
      });
      const bankRes = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          description: `${depositDescription} (Bank in)`,
          type: "withdrawal",
          amount,
          category: "Bank Deposit",
          method: "bank",
        }),
      });
      const cR = await cashRes.json();
      const bR = await bankRes.json();
      if (cR.code === "SUCCESS" && bR.code === "SUCCESS") {
        setDepositAmount("");
        setDepositDescription("Cash deposit to bank");
        setShowDepositForm(false);
        fetchTransactions();
      } else {
        alert("Deposit failed");
      }
    } catch {
      alert("Deposit error");
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      alert("Enter valid amount");
      return;
    }
    const amount = parseFloat(withdrawalAmount);
    if (amount > bankValue) {
      alert("Insufficient bank balance");
      return;
    }
    try {
      const bankRes = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          description: `${withdrawalDescription} (Bank out)`,
          type: "deposit",
          amount,
          category: "Bank Withdrawal",
          method: "bank",
        }),
      });
      const cashRes = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          description: `${withdrawalDescription} (Cash in)`,
          type: "withdrawal",
          amount,
          category: "Bank Withdrawal",
          method: "cash",
        }),
      });
      const bR = await bankRes.json();
      const cR = await cashRes.json();
      if (bR.code === "SUCCESS" && cR.code === "SUCCESS") {
        setWithdrawalAmount("");
        setWithdrawalDescription("Cash withdrawal from bank");
        setShowWithdrawalForm(false);
        fetchTransactions();
      } else {
        alert("Withdrawal failed");
      }
    } catch {
      alert("Withdrawal error");
    }
  };

  const quickFilterExpenseTotal = useMemo(() => {
    if (!dateFrom && !dateTo) return 0;
    return transactions.reduce((sum, t) => {
      if (t.type !== "expense") return sum;
      const d = new Date(t.date);
      const start = dateFrom ? new Date(dateFrom) : null;
      const end = dateTo ? new Date(dateTo) : null;
      if (start && d < start) return sum;
      if (end && d > end) return sum;
      return sum + t.amount;
    }, 0);
  }, [transactions, dateFrom, dateTo]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount || 0);

  const cardData = [
    {
      title: "Cash Amount",
      value: netCash,
      color: cashAmount >= 0 ? "green" : "red",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      Icon: DollarSign,
    },
    {
      title: "Bank Value",
      value: totalbankValue,
      color: bankValue >= 0 ? "blue" : "red",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      Icon: CreditCard,
    },
    {
      title: "Today Total Expenses",
      value: todayExpenses,
      color: "red",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      Icon: TrendingDown,
    },
    {
      title: "Total Loan Value",
      value: Math.abs(totalOutstanding),
      color: bankValue >= 0 ? "blue" : "red",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      Icon: CreditCard,
    },
    {
      title: "Total Interest Value",
      value: totalIncomeInterest,
      color: bankValue >= 0 ? "blue" : "red",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      Icon: CreditCard,
    },
    {
      title: "Service Charges",
      value: totalServiceCharge,
      color: "purple",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      Icon: CreditCard,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cashbook</h1>
          <p className="text-gray-600">Manage your cash flow and expenses</p>
        </div>

        {/* Arrears / Overpayment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Arrears
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalArrears)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Overpayment
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalOverpayment)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cardData.map((c, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {c.title}
                  </p>
                  <p className={`text-2xl font-bold text-${c.color}-600`}>
                    {formatCurrency(c.value)}
                  </p>
                </div>
                <div className={`p-3 ${c.iconBg} rounded-full`}>
                  <c.Icon className={`h-6 w-6 ${c.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setShowDepositForm(false);
                  setShowWithdrawalForm(false);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Transaction
              </button>
              <button
                onClick={() => {
                  setShowDepositForm(!showDepositForm);
                  setShowForm(false);
                  setShowWithdrawalForm(false);
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                <ArrowRight className="h-4 w-4 mr-2" /> Deposit to Bank
              </button>
              <button
                onClick={() => {
                  setShowWithdrawalForm(!showWithdrawalForm);
                  setShowForm(false);
                  setShowDepositForm(false);
                }}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Get Cash from Bank
              </button>
            </div>
          </div>

          {showForm && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      date: e.target.value,
                    })
                  }
                  className="px-3 py-2 border rounded-lg text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      description: e.target.value,
                    })
                  }
                  className="px-3 py-2 border rounded-lg text-sm"
                  required
                />
                <select
                  value={newTransaction.type}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      type: e.target.value,
                    })
                  }
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      amount: e.target.value,
                    })
                  }
                  className="px-3 py-2 border rounded-lg text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={newTransaction.category}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      category: e.target.value,
                    })
                  }
                  className="px-3 py-2 border rounded-lg text-sm"
                  required
                />
                <select
                  value={newTransaction.method}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      method: e.target.value,
                    })
                  }
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                </select>
                <div className="md:col-span-6 flex gap-2">
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg"
                  >
                    Add Transaction
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showDepositForm && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Deposit Amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <div className="md:col-span-6 flex gap-2">
                  <button
                    onClick={handleDeposit}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg"
                  >
                    Confirm Deposit
                  </button>
                  <button
                    onClick={() => setShowDepositForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showWithdrawalForm && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Withdrawal Amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={withdrawalDescription}
                  onChange={(e) => setWithdrawalDescription(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <div className="md:col-span-6 flex gap-2">
                  <button
                    onClick={handleWithdrawal}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg"
                  >
                    Get Cash
                  </button>
                  <button
                    onClick={() => setShowWithdrawalForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3 mb-4 px-6 py-4 bg-gray-50 border-b border-gray-200 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Type
              </label>
              <select
                value={transactionTypeFilter}
                onChange={(e) => {
                  setTransactionTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">
                Expense Total:
              </span>
              <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                {dateFrom || dateTo
                  ? formatCurrency(quickFilterExpenseTotal)
                  : "--"}
              </span>
              {(dateFrom || dateTo || transactionTypeFilter !== "all") && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setTransactionTypeFilter("all");
                    setCurrentPage(1);
                  }}
                  className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Loading transactions...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No transactions match filters.
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {t.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              t.type === "income" ||
                              (t.type === "withdrawal" &&
                                t.method === "bank") ||
                              (t.type === "withdrawal" && t.method === "cash")
                                ? "bg-green-100 text-green-800"
                                : t.type === "expense" ||
                                  (t.type === "deposit" &&
                                    t.method === "cash") ||
                                  (t.type === "deposit" && t.method === "bank")
                                ? "bg-red-100 text-red-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {t.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              t.method === "cash"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {t.method}
                          </span>
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                            t.type === "income" ||
                            (t.type === "withdrawal" && t.method === "bank") ||
                            (t.type === "withdrawal" && t.method === "cash")
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {t.type === "income" ||
                          (t.type === "withdrawal" && t.method === "bank") ||
                          (t.type === "withdrawal" && t.method === "cash")
                            ? "+"
                            : "-"}
                          {formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing{" "}
                    {filteredTransactions.length === 0
                      ? 0
                      : indexOfFirstRow + 1}{" "}
                    to {Math.min(indexOfLastRow, filteredTransactions.length)}{" "}
                    of {filteredTransactions.length} transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-md ${
                        currentPage === 1
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-md ${
                        currentPage === 1
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </div>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-md ${
                        currentPage === totalPages
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-md ${
                        currentPage === totalPages
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cashbook;
