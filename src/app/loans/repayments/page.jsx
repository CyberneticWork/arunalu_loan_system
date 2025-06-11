"use client";

import { useState, useEffect } from "react";
import RepaymentsTable from "@/components/repayments/RepaymentsTable";

export default function RepaymentsPage() {
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRepayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/repayments");
      const data = await response.json();
      if (data.code === "SUCCESS") {
        setRepayments(data.data);
      }
    } catch (error) {
      console.error("Error fetching repayments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepayments();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Loan Repayments
        </h1>
        <p className="text-gray-500">Manage and track all loan repayments</p>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading repayments...</div>
      ) : (
        <RepaymentsTable data={repayments} onRefresh={fetchRepayments} />
      )}
    </div>
  );
}
