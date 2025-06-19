// components/loan-approval/loan-details-card.jsx
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function LoanDetailsCard({
  loan,
  onClose,
  onApprove,
  onReject,
}) {
  // Check if this loan can be approved or rejected
  console.log("Loan Details Card Rendered", loan);
  const canApprove =
    loan.status.toLowerCase() === "pending" ||
    loan.status.toLowerCase() === "under review";

  // Check if details are still loading
  if (loan.loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if there was an error loading details
  if (loan.error) {
    return (
      <div className="p-6">
        <p className="text-red-500 mb-4">
          Error loading loan details: {loan.error}
        </p>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 max-h-[70vh] overflow-y-auto">
      {/* Basic loan information */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Loan ID</p>
          <p className="font-medium">{loan.id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Contract ID</p>
          <p className="font-medium">{loan.contractId}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Customer</p>
          <p className="font-medium">{loan.customerName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <Badge
            className={`${
              loan.status === "Active" || loan.status === "Waiting for Funds"
                ? "bg-green-100 text-green-800"
                : loan.status === "Rejected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {loan.status}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-gray-500">Loan Type</p>
          <p className="font-medium">{loan.loanType}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Amount</p>
          <p className="font-medium">{loan.revenueAmount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">CRO</p>
          <p className="font-medium">{loan.croName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Application Date</p>
          <p className="font-medium">{loan.applicationDate}</p>
        </div>
      </div>

      {/* Additional details if available */}
      {loan.details && (
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2">Additional Details</h3>

          {/* Customer Details */}
          {loan.details.customer && (
            <div className="border rounded-md p-3 mb-3 space-y-2">
              <h4 className="font-medium text-sm">Customer Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Full Name</p>
                  <p>{loan.details.customer.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-500">NIC</p>
                  <p>{loan.details.customer.nic}</p>
                </div>
                <div>
                  <p className="text-gray-500">Gender</p>
                  <p>{loan.details.customer.gender}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p>{loan.details.customer.telNo}</p>
                </div>
                <div>
                  <p className="text-gray-500">Address</p>
                  <p>{loan.details.customer.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loan Details */}
          {loan.details.loan && (
            <div className="border rounded-md p-3 mb-3 space-y-2">
              <h4 className="font-medium text-sm">Loan Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {loan.id.startsWith("A") ? (
                  <>
                    <div>
                      <p className="text-gray-500">Loan Amount</p>
                      <p>
                        LKR{" "}
                        {Number(loan.details.loan.loan_amount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Term (Months)</p>
                      <p>{loan.details.loan.loan_term_months}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Interest Rate</p>
                      <p>{loan.details.loan.interest_rate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Monthly Payment</p>
                      <p>
                        LKR{" "}
                        {Number(
                          loan.details.loan.monthly_payment
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Resident Type</p>
                      <p>{loan.details.loan.residenttype || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Bill Type</p>
                      <p>{loan.details.loan.billtype || "N/A"}</p>
                    </div>
                    {loan.details.loan.comment && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Comment</p>
                        <p>{loan.details.loan.comment}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-gray-500">Loan Amount</p>
                      <p>
                        LKR{" "}
                        {Number(loan.details.loan.loanAmount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Term</p>
                      <p>{loan.details.loan.term}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Interest Rate</p>
                      <p>{loan.details.loan.rate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Installment</p>
                      <p>
                        LKR{" "}
                        {Number(loan.details.loan.Installment).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Resident Type</p>
                      <p>{loan.details.loan.residenttype || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Bill Type</p>
                      <p>{loan.details.loan.billtype || "N/A"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Details for Auto Loans */}
          {loan.id.startsWith("A") &&
            loan.details.additionalDetails?.vehicleDetails && (
              <div className="border rounded-md p-3 mb-3 space-y-2">
                <h4 className="font-medium text-sm">Vehicle Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p>{loan.details.additionalDetails.vehicleDetails.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Make</p>
                    <p>{loan.details.additionalDetails.vehicleDetails.make}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Model</p>
                    <p>{loan.details.additionalDetails.vehicleDetails.model}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vehicle No</p>
                    <p>
                      {loan.details.additionalDetails.vehicleDetails.vehicle_no}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Year</p>
                    <p>{loan.details.additionalDetails.vehicleDetails.yom}</p>
                  </div>
                </div>
              </div>
            )}

          {/* Business Details for Business Loans */}
          {loan.id.startsWith("B") &&
            loan.details.additionalDetails?.businessDetails && (
              <div className="border rounded-md p-3 mb-3 space-y-2">
                <h4 className="font-medium text-sm">Business Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p>{loan.details.additionalDetails.businessDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Registration No.</p>
                    <p>
                      {loan.details.additionalDetails.businessDetails.regno}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p>{loan.details.additionalDetails.businessDetails.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Nature</p>
                    <p>
                      {loan.details.additionalDetails.businessDetails.nature}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p>
                      {loan.details.additionalDetails.businessDetails.addres}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Financial Details for Business Loans */}
          {loan.id.startsWith("B") &&
            loan.details.additionalDetails?.financialDetails && (
              <div className="border rounded-md p-3 mb-3 space-y-2">
                <h4 className="font-medium text-sm">Financial Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Business Income</p>
                    <p>
                      LKR{" "}
                      {Number(
                        loan.details.additionalDetails.financialDetails.Bincume
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Income</p>
                    <p>
                      LKR{" "}
                      {Number(
                        loan.details.additionalDetails.financialDetails
                          .Totalincome
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Business Expenses</p>
                    <p>
                      LKR{" "}
                      {Number(
                        loan.details.additionalDetails.financialDetails.Bexpence
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Expenses</p>
                    <p>
                      LKR{" "}
                      {Number(
                        loan.details.additionalDetails.financialDetails
                          .totalexpence
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex justify-end space-x-2">
        {canApprove && (
          <>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onReject(loan.id)}
              className="flex items-center"
            >
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onApprove(loan.id)}
              className="flex items-center"
              disabled={loan.details.btnStatus}
            >
              <Clock className="mr-2 h-4 w-4" />{" "}
              {!loan.details.btnStatus
                ? "Submit for Funding"
                : "Insufficient Funds"}
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
