"use client";
import { useState, useEffect } from "react";

export default function AddBranch() {
  const [branch, setBranch] = useState("");
  const [shortcode, setShortcode] = useState("");
  const [message, setMessage] = useState("");
  const [branches, setBranches] = useState([]);
  const [editId, setEditId] = useState(null);

  // Fetch branches
  async function fetchBranches() {
    const res = await fetch("/api/branches/add", { method: "GET" });
    const data = await res.json();
    setBranches(data);
  }

  useEffect(() => {
    fetchBranches();
  }, []);

  // Add or update branch
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    if (editId) {
      // Update branch
      const res = await fetch("/api/branches/add", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, branch, shortcode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Branch updated successfully!");
        setEditId(null);
        setBranch("");
        setShortcode("");
        fetchBranches();
      } else {
        setMessage(data.error || "Error updating branch");
      }
    } else {
      // Add branch
      const res = await fetch("/api/branches/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch, shortcode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Branch added successfully!");
        setBranch("");
        setShortcode("");
        fetchBranches();
      } else {
        setMessage(data.error || "Error adding branch");
      }
    }
  }

  // Delete branch
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    const res = await fetch("/api/branches/add", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMessage("Branch deleted!");
      fetchBranches();
    } else {
      const data = await res.json();
      setMessage(data.error || "Error deleting branch");
    }
  }

  // Edit branch
  function handleEdit(branchObj) {
    setEditId(branchObj.id);
    setBranch(branchObj.branch);
    setShortcode(branchObj.shortcode);
    setMessage("");
  }

  // Cancel edit
  function handleCancelEdit() {
    setEditId(null);
    setBranch("");
    setShortcode("");
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Branch Management
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Add, edit, and manage your branch locations
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600">
            {editId ? "Edit Branch" : "Add New Branch"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch Name
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                required
                placeholder="Enter branch name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shortcode
              </label>
              <input
                type="text"
                value={shortcode}
                onChange={(e) => setShortcode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                required
                placeholder="Enter shortcode"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                {editId ? "Update Branch" : "Add Branch"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            {message && (
              <p
                className={`text-center py-2 rounded-lg ${
                  message.includes("success") || message.includes("deleted")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>

        {/* Table Card */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Branches</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shortcode
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No branches found.
                    </td>
                  </tr>
                ) : (
                  branches.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {b.branch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {b.shortcode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(b)}
                          className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded-md hover:bg-indigo-50 transition-colors mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="text-red-600 hover:text-red-900 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}