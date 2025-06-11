import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LoanSubmissionDisplay({
  loanData,
  guarantors,
  onAddGuarantor,
  onEditGuarantor,
  onRemoveGuarantor,
}) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const router = useRouter();

  const [loanTypeMode, setLoanTypeMode] = useState("normal");
  const [groupName, setGroupName] = useState("");

  const handleConfirmProcess = async () => {
    setLoading(true);
    setResult(null);
    setNotification("");
    try {
      // 1. Get client details
      const clientRes = await fetch(
        `/api/customer/searchbyid?clid=${loanData.clientInfo.id}`
      );
      const clientJson = await clientRes.json();
      const client = clientJson.customer || {};

      // Get CROid from localStorage
      let CROid = null;
      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("user");
        if (token) {
          try {
            CROid = JSON.parse(token)["id"];
          } catch {}
        }
      }

      // Prepare data to send
      const dataToSend = {
        loanData: {
          ...loanData,
          loanTypeMode,
          ...(loanTypeMode === "group" ? { groupName } : {}),
        },
        client: {
          ...loanData.clientInfo,
          location: client.location,
          gs: client.gs,
          ds: client.ds,
          province: client.province,
        },
        CROid,
        guarantors,
      };

      // Call the API to submit the loan and guarantors
      const apiRes = await fetch("/api/submitLoan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const apiData = await apiRes.json();

      if (apiData.code === "SUCCESS") {
        setNotification("Loan submitted successfully!");
        setTimeout(() => {
          // router.push("/your-loan-details-page"); // add redirect path
          router.push("/loans/0"); // Redirect to loan types page for now
        }, 2000);
      } else {
        setNotification("Failed to submit loan. Please try again.");
      }

      setResult(dataToSend);
    } catch (e) {
      console.error("Loan submission error:", e); // <-- Add this line
      setResult({ error: e.message });
      setNotification(
        "An error occurred. Please try again. " + (e.message || "")
      );
    }
    setLoading(false);
  };

  return (
    <>
      {/* Client Information Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b">
          <span>Client Information</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Client Name</label>
            <p className="font-medium">{loanData.clientInfo?.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Client ID</label>
            <p className="font-medium">{loanData.clientInfo?.id}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">NIC</label>
            <p className="font-medium">{loanData.clientInfo?.NIC}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Account Manager</label>
            <p className="font-medium">{loanData.selectedOfficer}</p>
          </div>
        </div>
      </div>

      {/* Loan Details Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b">
          Loan Details
        </h2>
        <div className="mb-4 flex items-center gap-6">
          <span className="font-medium">Loan Type:</span>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="loanTypeMode"
              value="normal"
              checked={loanTypeMode === "normal"}
              onChange={() => setLoanTypeMode("normal")}
            />
            Normal
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="loanTypeMode"
              value="group"
              checked={loanTypeMode === "group"}
              onChange={() => setLoanTypeMode("group")}
            />
            Group
          </label>
          {loanTypeMode === "group" && (
            <input
              type="text"
              className="ml-4 border rounded px-2 py-1"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ minWidth: 180 }}
            />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Loan Type</label>
            <p className="font-medium">{loanData.loanType}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Loan Name</label>
            <p className="font-medium">{loanData.loanName}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Loan Category</label>
            <p className="font-medium">{loanData.selectedSubLoanCategory}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Loan Duration</label>
            <p className="font-medium">{loanData.loanDuration} days</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Payment Frequency</label>
            <p className="font-medium">{loanData.loanFrequency}</p>
          </div>
        </div>
      </div>

      {/* Financial Details Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b">
          Financial Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Loan Amount</label>
            <p className="font-medium">
              LKR{" "}
              {Number(loanData.loanAmount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Interest Rate</label>
            <p className="font-medium">{loanData.interestRate}%</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Service Charge</label>
            <p className="font-medium">
              LKR{" "}
              {Number(loanData.serviceCharge).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Total Amount</label>
            <p className="font-medium text-green-700">
              LKR{" "}
              {Number(loanData.totalAmount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Guarantor Information Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b flex justify-between items-center">
          <span>Guarantor Information</span>
          <Button
            onClick={onAddGuarantor}
            disabled={guarantors.length >= 2}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Guarantor {guarantors.length}/2
          </Button>
        </h2>

        {guarantors.length === 0 ? (
          <p className="text-sm text-gray-500">No guarantors added yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guarantors.map((guarantor, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Guarantor {index + 1}</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-500">Name:</span>{" "}
                    {guarantor.name}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">NIC:</span> {guarantor.nic}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Phone:</span>{" "}
                    {guarantor.phone}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Occupation:</span>{" "}
                    {guarantor.occupation}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Monthly Income:</span> LKR{" "}
                    {Number(guarantor.monthlyIncome).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => onEditGuarantor(index)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => onRemoveGuarantor(index)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Submission Date</p>
            <p className="font-medium">
              {new Date(loanData.submittedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              className={`px-4 py-2 rounded-md text-white ${
                loading || guarantors.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              onClick={handleConfirmProcess}
              disabled={loading || guarantors.length === 0}
            >
              {loading ? "Processing..." : "Confirm & Process"}
            </button>
            {guarantors.length === 0 && (
              <span className="text-xs text-red-500 ml-2">
                Add at least 1 guarantor
              </span>
            )}
          </div>
        </div>
        {result && (
          <div className="mt-4">
            <div className="mb-2 font-semibold text-blue-700">
              All details ready to send:
            </div>
            <pre className="bg-white p-3 rounded text-xs text-left overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {notification && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-800 font-semibold text-center">
          {notification}
        </div>
      )}
    </>
  );
}
