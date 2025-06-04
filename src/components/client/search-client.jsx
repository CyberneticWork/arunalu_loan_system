// components/client/search-client.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button";

export function SearchClient({ clients, onAddNewClick, loading, onSearch, searchFilter, setSearchFilter, searchQuery, setSearchQuery, error }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClient, setMenuClient] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);
  const router = useRouter();

  // Handle outside click to close menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setMenuClient(null);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleMenuOpen = (e, client) => {
    e.preventDefault();
    setMenuOpen(true);
    setMenuClient(client);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleUpdate = (client) => {
    setMenuOpen(false);
    setMenuClient(null);
    router.push(`/clients/update/${client.nic}`);
  };

  const handleLoans = (client) => {
    setMenuOpen(false);
    setMenuClient(null);
    router.push(`/loan-info/${client.id}`);
    // handle loans logic
  };

  const handleCreateLoan = (client) => {
    setMenuOpen(false);
    setMenuClient(null);
    router.push(`/loans/${`CLN-${client.id.toString().padStart(3, '0')}`}`);
  };

  // --- SEARCH HANDLING ---
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };
  const handleFilterChange = (e) => {
    setSearchFilter(e.target.value);
  };
  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      onSearch(searchFilter, searchQuery.trim());
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearchClick();
  };

  // --- CARD VIEW ---
  return (
    <>
      {/* Search Bar & Filter */}
      <div className="bg-white rounded-lg shadow mb-6 p-4 flex flex-col md:flex-row gap-2 md:items-center">
        <div className="flex gap-2 flex-1">
          <select value={searchFilter} onChange={handleFilterChange} className="border rounded px-2 py-1">
            <option value="name">Name</option>
            <option value="nic">NIC</option>
            <option value="id">Customer ID</option>
            <option value="telno">Telephone No</option>
            <option value="location">Branch</option>
          </select>
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder={`Search by ${searchFilter}`}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <button
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            onClick={handleSearchClick}
            disabled={loading || !searchQuery.trim()}
          >
            <Search className="inline h-4 w-4 mr-1" /> Search
          </button>
        </div>
        
      </div>

      {/* Error State */}
      {!loading && error && (
        <div className="text-center py-4 text-red-600 font-semibold">{error}</div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-10 text-gray-500">Loading clients...</div>
      )}

      {/* Card View */}
      {!loading && !error && clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={`CLN-${client.id.toString().padStart(3, '0')}`}
              className="bg-white rounded-lg shadow p-4 hover:shadow-lg cursor-pointer relative overflow-hidden"
              style={{ minHeight: '220px', wordBreak: 'break-word', maxWidth: '100%' }}
              onClick={(e) => handleMenuOpen(e, client)}
            >
              <div className="font-bold text-blue-700 text-lg mb-1 truncate" title={client.fullname}>{client.fullname}</div>
              <div className="text-sm text-gray-600 mb-1">ID: <span className="font-mono break-all">CLN-{client.id.toString().padStart(3, '0')}</span></div>
              <div className="text-sm text-gray-600 mb-1 break-all">NIC: {client.nic}</div>
              <div className="text-sm text-gray-600 mb-1">Telephone: {client.telno || <span className="text-gray-400">N/A</span>}</div>
              <div className="text-sm text-gray-600 mb-1">Gender: {typeof client.gender === 'number' ? (client.gender === 1 ? 'Male' : client.gender === 2 ? 'Female' : client.gender) : client.gender}</div>
              <div className="text-sm text-gray-600 mb-1 break-all">Address: <span className="break-words">{client.address}</span></div>
              <div className="text-sm text-gray-600 mb-1">District: {client.district}</div>
              <div className="text-sm text-gray-600 mb-2">Active Loans: <Badge variant={client.activeLoans > 0 ? "default" : "outline"} className={client.activeLoans > 0 ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}>{client.activeLoans > 0 ? `${client.activeLoans} Active Loans` : "No Loans"}</Badge></div>
              <div className="absolute top-2 right-2">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, client); }}>
                  <span className="sr-only">Open menu</span>
                  ...
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && clients.length === 0 && searchQuery && (
        <div className="text-center py-10 text-gray-500">No clients found for "{searchQuery}"</div>
      )}

      {/* Floating context menu */}
      {menuOpen && menuClient && (
        <div
          ref={menuRef}
          className="fixed z-50 mt-2 w-56 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-10 focus:outline-none animate-fade-in border border-gray-200"
          style={{ top: menuPosition.y + 8, left: menuPosition.x + 8, minWidth: 200 }}
        >
          <div className="py-2">
            <button className="w-full flex items-center gap-2 px-5 py-3 text-base text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-700 transition rounded-lg group" onClick={() => handleUpdate(menuClient)}>
              <svg className="w-5 h-5 text-blue-500 group-hover:text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6 3 3-6 6H9v-3z" /></svg>
              Update Client
            </button>
            <button className="w-full flex items-center gap-2 px-5 py-3 text-base text-gray-700 font-medium hover:bg-green-50 hover:text-green-700 transition rounded-lg group" onClick={() => handleLoans(menuClient)}>
              <svg className="w-5 h-5 text-green-500 group-hover:text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Loans List
            </button>
            <button className="w-full flex items-center gap-2 px-5 py-3 text-base text-gray-700 font-medium hover:bg-purple-50 hover:text-purple-700 transition rounded-lg group" onClick={() => handleCreateLoan(menuClient)}>
              <svg className="w-5 h-5 text-purple-500 group-hover:text-purple-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Create Loan
            </button>
          </div>
        </div>
      )}
    </>
  );
}
