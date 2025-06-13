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
  const monthlyRate = Number(rate) || 0;
  const duration = Number(term) || 0;
  const serviceChargeAmount = Number(serviceCharge) || 0;
  const initialPaymentAmount = Number(initialPayment) || 0;

  let periodRate = 0;
  switch (paymentFrequency) {
    case "Daily":
      periodRate = monthlyRate / 100 / 30;
      break;
    case "Weekly":
      periodRate = monthlyRate / 100 / 4;
      break;
    case "Monthly":
      periodRate = monthlyRate / 100;
      break;
    default:
      periodRate = monthlyRate / 100;
  }

  let calculationBase = loanAmount;
  if (initialPaymentOption === "capitalizeCharges") {
    calculationBase += initialPaymentAmount;
  }

  const totalInterest = calculationBase * periodRate * duration;
  const totalPayable = calculationBase + totalInterest;
  const payment = duration > 0 ? totalPayable / duration : 0;

  return {
    payment: payment,
    totalPrincipal: loanAmount,
    totalInterest: totalInterest,
    totalPayable: totalPayable,
    totalPaymentPeriods: duration,
    serviceCharge: serviceChargeAmount,
    initialPayment: initialPaymentAmount,
    initialPaymentOption: initialPaymentOption,
  };
}
