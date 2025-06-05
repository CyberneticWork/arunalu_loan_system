export function calculateLoan({
  principal,
  rate,
  term,
  paymentFrequency, // 'Daily', 'Weekly', 'Monthly'
  serviceCharge = 0,
  initialPayment = 0,
  initialPaymentOption = 'clientPay' // 'capitalizeCharges', 'clientPay', 'withdrawFromCapital'
}) {
  // Normalize inputs
  const loanAmount = Number(principal) || 0;
  const interestRate = Number(rate) || 0;
  const duration = Number(term) || 0;
  const serviceChargeAmount = Number(serviceCharge) || 0;
  const initialPaymentAmount = Number(initialPayment) || 0;

  // Frequency normalization
  let periods = duration;
  let interestFrequency = 'yearly'; // Default to yearly for flat rate
  let periodsPerYear = 365;
  if (paymentFrequency === 'Weekly') {
    periodsPerYear = 52;
  } else if (paymentFrequency === 'Monthly') {
    periodsPerYear = 12;
  }

  // Calculation base
  let calculationBase = loanAmount;
  if (initialPaymentOption === 'capitalizeCharges') {
    calculationBase += initialPaymentAmount;
  }

  // Interest calculation (simple interest for demonstration)
  let totalInterest = 0;
  if (paymentFrequency === 'Daily') {
    totalInterest = calculationBase * (interestRate / 100) * (duration / 365);
  } else if (paymentFrequency === 'Weekly') {
    totalInterest = calculationBase * (interestRate / 100) * (duration / 52);
  } else if (paymentFrequency === 'Monthly') {
    totalInterest = calculationBase * (interestRate / 100) * (duration / 12);
  }

  // Add service charge
  totalInterest += serviceChargeAmount;

  // Total payable
  let totalPayable = calculationBase + totalInterest;
  if (initialPaymentOption === 'withdrawFromCapital') {
    totalPayable = calculationBase + totalInterest; // Adjust if needed
  }

  // Per-period payment
  const payment = periods > 0 ? totalPayable / periods : 0;

  return {
    payment: payment,
    totalPrincipal: loanAmount,
    totalInterest: totalInterest,
    totalPayable: totalPayable,
    totalPaymentPeriods: periods,
    serviceCharge: serviceChargeAmount,
    initialPayment: initialPaymentAmount,
    initialPaymentOption: initialPaymentOption
  };
}