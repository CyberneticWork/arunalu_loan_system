export const BusinessLoanCalculator = (
  principal,
  rate,
  term,
  paymentFrequency,
  interestFrequency,
  serviceCharge = 0,
  initialPayment = 0,
  initialPaymentOption = 'clientPay' // 'capitalizeCharges', 'clientPay', 'withdrawFromCapital'
) => {
  // Convert inputs to numbers to ensure proper calculation
  const loanAmount = Number(principal);
  const initialPaymentAmount = Number(initialPayment);
  const serviceChargeAmount = Number(serviceCharge);
  
  // Define standard periods
  const DAYS_PER_MONTH = 30; // Consistently using 30 days per month
  const DAYS_PER_YEAR = 365;
  const MONTHS_PER_YEAR = 12;
  const WEEKS_PER_YEAR = 52;
  const DAYS_PER_WEEK = 7;
  
  let daysPerPeriod;
  let totalPaymentPeriods, totalInterest, totalPayable, payment;
  let calculationBase;
  
  // Set the base for interest calculation based on the initial payment option
  if (initialPaymentOption === 'capitalizeCharges') {
    console.log(initialPaymentAmount);
    
    // For "capitalize initial charges", interest is calculated on (Loan Amount + Initial Payment)
    calculationBase = loanAmount + initialPaymentAmount;
    console.log(calculationBase);
    
  } else {
    // For "client pay initial charges" and "withdrawal from capital", interest is calculated only on Loan Amount
    calculationBase = loanAmount;
  }
  
  // Calculate interest based on payment frequency and interest frequency
  if (paymentFrequency === 'daily') {
    daysPerPeriod = 1; // 1 day per period
    
    if (typeof term === 'string' || term instanceof Date) {
      term = (new Date(term) - new Date()) / (1000 * 3600 * 24);
    }
    
    if (interestFrequency === 'monthly') {
      const monthlyRate = rate / 100;
      totalInterest = calculationBase * monthlyRate * (term / DAYS_PER_MONTH);
    } else if (interestFrequency === 'yearly') {
      const dailyRate = rate / DAYS_PER_YEAR / 100;
      totalInterest = calculationBase * dailyRate * term;
    } else {
      // Assuming daily rate is provided directly
      const dailyRate = rate / 100;
      totalInterest = calculationBase * dailyRate * term;
    }
    
    totalPaymentPeriods = term;
  } else if (paymentFrequency === 'monthly') {
    daysPerPeriod = DAYS_PER_MONTH;
    
    if (interestFrequency === 'yearly') {
      const monthlyRate = rate / MONTHS_PER_YEAR / 100;
      totalInterest = calculationBase * monthlyRate * term;
    } else if (interestFrequency === 'weekly') {
      const monthlyEquivalentRate = rate * (DAYS_PER_MONTH / DAYS_PER_WEEK) / 100;
      totalInterest = calculationBase * monthlyEquivalentRate * term;
    } else if (interestFrequency === 'daily') {
      const monthlyEquivalentRate = rate * DAYS_PER_MONTH / 100;
      totalInterest = calculationBase * monthlyEquivalentRate * term;
    } else {
      // Assuming monthly rate is provided directly
      const monthlyRate = rate / 100;
      totalInterest = calculationBase * monthlyRate * term;
    }
    
    totalPaymentPeriods = term;
  } else if (paymentFrequency === 'weekly') {
    daysPerPeriod = DAYS_PER_WEEK;
    
    // Convert term to weeks if provided in another unit
    let termInWeeks = term;
    
    if (interestFrequency === 'yearly') {
      const weeklyRate = rate / WEEKS_PER_YEAR / 100;
      totalInterest = calculationBase * weeklyRate * termInWeeks;
    } else if (interestFrequency === 'monthly') {
      // First, convert the monthly rate to a weekly equivalent
      const weeklyEquivalentRate = rate * (DAYS_PER_WEEK / DAYS_PER_MONTH) / 100;
      totalInterest = calculationBase * weeklyEquivalentRate * termInWeeks;
    } else if (interestFrequency === 'daily') {
      const weeklyEquivalentRate = rate * DAYS_PER_WEEK / 100;
      totalInterest = calculationBase * weeklyEquivalentRate * termInWeeks;
    } else {
      // Assuming weekly rate is provided directly
      const weeklyRate = rate / 100;
      totalInterest = calculationBase * weeklyRate * termInWeeks;
    }
    
    totalPaymentPeriods = termInWeeks;
  }
  
  // Add service charge to total interest
  totalInterest += serviceChargeAmount;
  
  // Calculate the total payable amount based on the initial payment option
  if (initialPaymentOption === 'capitalizeCharges' || initialPaymentOption === 'clientPay') {
    // For both "capitalize initial charges" and "client pay initial charges":
    // Total Payable = Loan Amount + Total Interest
    // totalPayable = loanAmount + totalInterest + calculationBase;
    totalPayable =  totalInterest + calculationBase;
  } else if (initialPaymentOption === 'withdrawFromCapital') {
    // For "withdrawal from capital":
    // Total Payable = (Loan Amount + Total Interest) - Initial Payment
    // totalPayable = (loanAmount + totalInterest) - initialPaymentAmount;
    totalPayable = (loanAmount ) + totalInterest ;
  }
  
  // Calculate the payment per period
  payment = totalPayable / totalPaymentPeriods;
  
  return {
    payment: payment,
    totalPrincipal: loanAmount,
    totalInterest: totalInterest,
    totalPayable: totalPayable,
    totalPaymentPeriods: totalPaymentPeriods,
    daysPerPeriod: daysPerPeriod,
    serviceCharge: serviceChargeAmount,
    initialPayment: initialPaymentAmount,
    initialPaymentOption: initialPaymentOption
  };
};