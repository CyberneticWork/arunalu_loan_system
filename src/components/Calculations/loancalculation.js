export function calculateLoan({
  principal,
  rate,
  term,
  paymentFrequency, // 'Daily', 'Weekly', 'Monthly'
  serviceCharge = 0,
  initialPayment = 0,
  initialPaymentOption = "clientPay",
}) {
  const loanAmount = Number(principal) || 0;
  const interestRate = Number(rate) || 0;
  const serviceChargeAmount = Number(serviceCharge) || 0;
  const initialPaymentAmount = Number(initialPayment) || 0;

  // New calculation: totalInterest = loanAmount * interestRate / 100
  const totalInterest = loanAmount * interestRate / 100;
  const totalPayable = loanAmount + totalInterest;

  return {
    payment: 0, // Not calculated anymore
    totalPrincipal: loanAmount,
    totalInterest: totalInterest,
    totalPayable: totalPayable,
    totalPaymentPeriods: 0, // Not used
    serviceCharge: serviceChargeAmount,
    initialPayment: initialPaymentAmount,
    initialPaymentOption: initialPaymentOption,
  };
}
