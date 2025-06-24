"use client";
import React, { useState, useEffect } from "react";
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDescription, setDepositDescription] = useState(
    "Cash deposit to bank"
  );
  const [netCash, setNetCash] = useState(0);
  const [totalbankValue, setTotalbankValue] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [totalIncomeInterest, setTotalIncomeInterest] = useState(0);
  const [totalArrears, setTotalArrears] = useState(0);
  const [totalOverpayment, setTotalOverpayment] = useState(0);

  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalDescription, setWithdrawalDescription] = useState(
    "Cash withdrawal from bank"
  );

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions();
    fetchTodayExpenses();
  }, []);

  // Fetch overpayment and arrears summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/repayments/summary");
        const data = await res.json();
        if (data.code === "SUCCESS") {
          setTotalArrears(data.totalArrears || 0);
          setTotalOverpayment(data.totalOverpayment || 0);
        }
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchSummary();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cashbook?action=getAll");
      const result = await response.json();

      if (result.code === "SUCCESS") {
        setTransactions(
          result.data.map((item) => ({
            ...item,
            amount: parseFloat(item.amount),
          }))
        );
        // console.log("Transactions fetched successfully:", result.TotalBank);
        setNetCash(result.TotalCash);
        setTotalbankValue(result.TotalBank);
        setTotalOutstanding(result.TotalOutstanding);
        console.log(result.TotalIncomeInterest);
        setTotalIncomeInterest(result.TotalIncomeInterest);
      } else {
        console.error("Failed to fetch transactions:", result.message);
        alert("Failed to load transactions. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      alert("Error loading transactions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  //fetch today expenses
  const fetchTodayExpenses = async () => {
    try {
      const response = await fetch("/api/cashbook?action=getTodayExpenses");
      const result = await response.json();

      if (result.code === "SUCCESS") {
        setTodayExpenses(result.data[0].TotalAmount || 0);
      } else {
        console.error("Failed to fetch today's expenses:", result.message);
        alert("Failed to load today's expenses. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching today's expenses:", error);
      alert("Error loading today's expenses. Please try again.");
    }
  };

  // Calculate totals
  const cashTransactions = transactions.filter((t) => t.method === "cash");
  const bankTransactions = transactions.filter((t) => t.method === "bank");
  const expenses = transactions.filter((t) => t.type === "expense");

  const cashAmount = cashTransactions.reduce((sum, t) => {
    if (t.type === "income") return sum + t.amount;
    if (t.type === "expense") return sum - t.amount;
    if (t.type === "deposit") return sum - t.amount; // Cash out for deposit
    if (t.type === "withdrawal") return sum + t.amount; // Cash in from withdrawal
    return sum;
  }, 0);

  const bankValue = bankTransactions.reduce((sum, t) => {
    if (t.type === "income") return sum + t.amount;
    if (t.type === "expense") return sum - t.amount;
    if (t.type === "deposit") return sum - t.amount; // Bank out for deposit
    if (t.type === "withdrawal") return sum + t.amount; // Bank in from withdrawal
    return sum;
  }, 0);

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstRow,
    indexOfLastRow
  );
  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleSubmit = async () => {
    if (
      newTransaction.description &&
      newTransaction.amount &&
      newTransaction.category
    ) {
      const amount = parseFloat(newTransaction.amount);
      if (
        newTransaction.method === "cash" &&
        amount > netCash
      ) {
        alert("Insufficient cash balance for this expense.");
        return;
      }
      if (
        newTransaction.method === "bank" &&
        amount > totalbankValue
      ) {
        alert("Insufficient bank balance for this expense.");
        return;
      }

      try {
        const response = await fetch("/api/cashbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newTransaction,
            amount: parseFloat(newTransaction.amount),
          }),
        });

        const result = await response.json();

        if (result.code === "SUCCESS") {
          // Add the new transaction to the state with the ID from the response
          const transaction = {
            id: result.id,
            ...newTransaction,
            amount: parseFloat(newTransaction.amount),
          };
          setTransactions([transaction, ...transactions]);

          // Reset form
          setNewTransaction({
            date: new Date().toISOString().split("T")[0],
            description: "",
            type: "expense",
            amount: "",
            category: "",
            method: "cash",
          });
          setShowForm(false);

          // Refresh data from server
          fetchTransactions();
          fetchTodayExpenses(); // <-- Add this line to update today's expenses in real time
        } else {
          alert(`Failed to add transaction: ${result.message}`);
        }
      } catch (error) {
        console.error("Error adding transaction:", error);
        alert("Error adding transaction. Please try again.");
      }
    } else {
      alert("Please fill in all required fields.");
    }
  };

  // Deposit function to transfer money from cash to bank
  const handleDeposit = async () => {
    if (
      !depositAmount ||
      isNaN(parseFloat(depositAmount)) ||
      parseFloat(depositAmount) <= 0
    ) {
      alert("Please enter a valid deposit amount");
      return;
    }

    const amount = parseFloat(depositAmount);

    // Check if we have enough cash
    if (amount > cashAmount) {
      alert("Insufficient cash balance for this deposit");
      return;
    }

    try {
      // First transaction - cash out (treated as deposit from cash)
      const cashResponse = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          description: `${depositDescription} (Cash out)`,
          type: "deposit", // Changed from "withdrawal" to "deposit"
          amount: amount,
          category: "Bank Deposit",
          method: "cash",
        }),
      });

      // Second transaction - bank in (treated as withdrawal to bank)
      const bankResponse = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          description: `${depositDescription} (Bank in)`,
          type: "withdrawal", // Changed from "deposit" to "withdrawal"
          amount: amount,
          category: "Bank Deposit",
          method: "bank",
        }),
      });

      const cashResult = await cashResponse.json();
      const bankResult = await bankResponse.json();

      if (cashResult.code === "SUCCESS" && bankResult.code === "SUCCESS") {
        setDepositAmount("");
        setDepositDescription("Cash deposit to bank");
        setShowDepositForm(false);

        // Refresh data
        fetchTransactions();
        alert("Deposit completed successfully");
      } else {
        alert("Error processing deposit. Please try again.");
      }
    } catch (error) {
      console.error("Error during deposit:", error);
      alert("Error processing deposit. Please try again.");
    }
  };

  // Withdraw function to get cash from bank
  const handleWithdrawal = async () => {
    if (
      !withdrawalAmount ||
      isNaN(parseFloat(withdrawalAmount)) ||
      parseFloat(withdrawalAmount) <= 0
    ) {
      alert("Please enter a valid withdrawal amount");
      return;
    }

    const amount = parseFloat(withdrawalAmount);

    // Check if we have enough bank balance
    if (amount > bankValue) {
      alert("Insufficient bank balance for this withdrawal");
      return;
    }

    try {
      // First transaction - bank out (treated as deposit from bank)
      const bankResponse = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          description: `${withdrawalDescription} (Bank out)`,
          type: "deposit", // Bank out is a deposit type
          amount: amount,
          category: "Bank Withdrawal",
          method: "bank",
        }),
      });

      // Second transaction - cash in (treated as withdrawal to cash)
      const cashResponse = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          description: `${withdrawalDescription} (Cash in)`,
          type: "withdrawal", // Cash in is a withdrawal type
          amount: amount,
          category: "Bank Withdrawal",
          method: "cash",
        }),
      });

      const bankResult = await bankResponse.json();
      const cashResult = await cashResponse.json();

      if (bankResult.code === "SUCCESS" && cashResult.code === "SUCCESS") {
        setWithdrawalAmount("");
        setWithdrawalDescription("Cash withdrawal from bank");
        setShowWithdrawalForm(false);

        // Refresh data
        fetchTransactions();
        alert("Withdrawal completed successfully");
      } else {
        alert("Error processing withdrawal. Please try again.");
      }
    } catch (error) {
      console.error("Error during withdrawal:", error);
      alert("Error processing withdrawal. Please try again.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount || 0);
  };
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
      value: Math.abs(totalOutstanding), // <-- Ensure always positive
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
  ];
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cashbook</h1>
          <p className="text-gray-600">Manage your cash flow and expenses</p>
        </div>

        {/* Arrears and Overpayment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Arrears Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Arrears</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalArrears)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          {/* Overpayment Card */}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Cash Amount Card */}
          {cardData.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold text-${card.color}-600`}>
                    {formatCurrency(card.value)}
                  </p>
                </div>
                <div className={`p-3 ${card.iconBg} rounded-full`}>
                  <card.Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transactions Table */}
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
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </button>
              <button
                onClick={() => {
                  setShowDepositForm(!showDepositForm);
                  setShowForm(false);
                  setShowWithdrawalForm(false);
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Deposit to Bank
              </button>
              <button
                onClick={() => {
                  setShowWithdrawalForm(!showWithdrawalForm);
                  setShowForm(false);
                  setShowDepositForm(false);
                }}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Get Cash from Bank
              </button>
            </div>
          </div>

          {/* Add Transaction Form */}
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  {/* <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option> */}
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                </select>
                <div className="md:col-span-6 flex gap-2">
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Transaction
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Deposit Form */}
          {showDepositForm && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Deposit Amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="md:col-span-6 flex gap-2">
                  <button
                    onClick={handleDeposit}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Confirm Deposit
                  </button>
                  <button
                    onClick={() => setShowDepositForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal Form */}
          {showWithdrawalForm && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Withdrawal Amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={withdrawalDescription}
                  onChange={(e) => setWithdrawalDescription(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="md:col-span-6 flex gap-2">
                  <button
                    onClick={handleWithdrawal}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Get Cash
                  </button>
                  <button
                    onClick={() => setShowWithdrawalForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No transactions found. Add a transaction to get started.
              </div>
            ) : (
              <>
                <table className="w-full">
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
                    {currentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === "income" ||
                              (transaction.type === "withdrawal" &&
                                transaction.method === "bank") ||
                              (transaction.type === "withdrawal" &&
                                transaction.method === "cash")
                                ? "bg-green-100 text-green-800"
                                : transaction.type === "expense" ||
                                  (transaction.type === "deposit" &&
                                    transaction.method === "cash") ||
                                  (transaction.type === "deposit" &&
                                    transaction.method === "bank")
                                ? "bg-red-100 text-red-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.method === "cash"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {transaction.method}
                          </span>
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                            transaction.type === "income" ||
                            (transaction.type === "withdrawal" &&
                              transaction.method === "bank") ||
                            (transaction.type === "withdrawal" &&
                              transaction.method === "cash")
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ||
                          (transaction.type === "withdrawal" &&
                            transaction.method === "bank") ||
                          (transaction.type === "withdrawal" &&
                            transaction.method === "cash")
                            ? "+"
                            : "-"}
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {indexOfFirstRow + 1} to{" "}
                    {Math.min(indexOfLastRow, transactions.length)} of{" "}
                    {transactions.length} transactions
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
