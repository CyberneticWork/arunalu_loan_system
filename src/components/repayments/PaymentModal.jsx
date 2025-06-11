import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PaymentModal({
  isOpen,
  onClose,
  payments = [],
  isMultiple,
  onPaymentComplete, // Add this new prop
}) {
  // Reset payment details when payments prop changes
  useEffect(() => {
    if (payments.length > 0) {
      setPaymentDetails(
        isMultiple
          ? payments.map((p) => ({
              id: p.id,
              amount: "",
              method: "cash",
            }))
          : { amount: "", method: "cash" }
      );
    }
  }, [payments, isMultiple]);

  const [paymentDetails, setPaymentDetails] = useState(
    isMultiple
      ? payments.map((p) => ({
          id: p.id,
          amount: "",
          method: "cash",
        }))
      : { amount: "", method: "cash" }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount =
    payments?.reduce((sum, p) => sum + Number(p?.remainingAmount || 0), 0) || 0;

  const handleAmountChange = (id, value) => {
    if (isMultiple) {
      setPaymentDetails((prev) =>
        prev.map((p) => (p.id === id ? { ...p, amount: value } : p))
      );
    } else {
      setPaymentDetails((prev) => ({ ...prev, amount: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const paymentsToSubmit = isMultiple
        ? paymentDetails.map((payment, index) => ({
            loanId: payments[index].id,
            loanAmount: parseFloat(payments[index].remainingAmount).toFixed(2),
            fullLoanAmount: parseFloat(payments[index].Totalpay).toFixed(2),
            paidAmount: parseFloat(payment.amount).toFixed(2),
            paymentMethod: payment.method,
            setalment: (
              parseFloat(payments[index].remainingAmount) -
              parseFloat(payment.amount)
            ).toFixed(2),
          }))
        : [
            {
              loanId: payments[0].id,
              loanAmount: parseFloat(payments[0].remainingAmount).toFixed(2),
              fullLoanAmount: parseFloat(payments[0].Totalpay).toFixed(2),
              paidAmount: parseFloat(paymentDetails.amount).toFixed(2),
              paymentMethod: paymentDetails.method,
              setalment: (
                parseFloat(payments[0].remainingAmount) -
                parseFloat(paymentDetails.amount)
              ).toFixed(2),
            },
          ];

      const response = await fetch("/api/repayments/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payments: paymentsToSubmit,
        }),
      });

      const data = await response.json();

      if (data.code === "SUCCESS") {
        // Close modal on success
        onClose();
        // Trigger refresh of payments list
        onPaymentComplete?.();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      alert("Failed to submit payment"); // Simple error feedback
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!payments.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${isMultiple ? "sm:max-w-[600px]" : "sm:max-w-[425px]"}`}
      >
        <DialogHeader>
          <DialogTitle>
            {isMultiple ? "Multiple Payments" : "Make Payment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {isMultiple ? (
            <>
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {payments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="border p-4 rounded-lg space-y-4 bg-white"
                  >
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <Label>Customer Name</Label>
                        <div className="text-sm text-gray-700 font-medium">
                          {payment.customerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Contract: {payment.telno}
                        </div>
                      </div>
                      <div className="space-y-1 text-right">
                        <Label>Total Amount</Label>
                        <div className="text-sm text-gray-700 font-medium">
                          LKR {Number(payment.Totalpay).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`amount-${payment.id}`}>
                          Payment Amount
                        </Label>
                        <Input
                          id={`amount-${payment.id}`}
                          type="number"
                          placeholder="Enter amount"
                          value={paymentDetails[index]?.amount || ""}
                          onChange={(e) =>
                            handleAmountChange(payment.id, e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`method-${payment.id}`}>
                          Payment Method
                        </Label>
                        <Select
                          value={paymentDetails[index]?.method || "cash"}
                          onValueChange={(value) =>
                            setPaymentDetails((prev) =>
                              prev.map((p) =>
                                p.id === payment.id
                                  ? { ...p, method: value }
                                  : p
                              )
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <Label>Remaining Amount</Label>
                      <div className="text-sm text-gray-700 font-medium">
                        LKR {Number(payment.remainingAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {payments.length} payments
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Total Amount to Pay
                    </div>
                    <div className="text-lg font-semibold">
                      LKR {totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Single payment form
            <>
              <div className="grid gap-2">
                <Label>Customer Name</Label>
                <div className="text-sm text-gray-700 font-medium">
                  {payments[0]?.customerName}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Total Amount</Label>
                <div className="text-sm text-gray-700 font-medium">
                  LKR {Number(payments[0]?.Totalpay).toLocaleString()}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={paymentDetails?.amount || ""}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      amount: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select
                  value={paymentDetails?.method || "cash"}
                  onValueChange={(value) =>
                    setPaymentDetails({ ...paymentDetails, method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Remaining Amount</Label>
                <div className="text-sm text-gray-700 font-medium">
                  LKR {Number(payments[0]?.remainingAmount).toLocaleString()}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                `Submit Payment${isMultiple ? "s" : ""}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
