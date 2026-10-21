// Convert numerical amount to Indian currency words
// e.g. 154500.50 -> "Rupees One Lakh Fifty-Four Thousand Five Hundred and Fifty Paise Only"

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertBelowThousand(num) {
  let str = "";
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + " ";
    num %= 10;
  }
  if (num > 0) {
    str += ones[num] + " ";
  }
  return str.trim();
}

export function numberToIndianWords(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "Zero Rupees Only";
  const num = Math.abs(Number(amount));
  if (num === 0) return "Zero Rupees Only";

  const parts = num.toFixed(2).split(".");
  let integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  if (integerPart === 0 && decimalPart === 0) return "Zero Rupees Only";

  let words = "";

  // Crores (>= 1,00,00,000)
  if (integerPart >= 10000000) {
    const crore = Math.floor(integerPart / 10000000);
    words += convertBelowThousand(crore) + " Crore ";
    integerPart %= 10000000;
  }

  // Lakhs (>= 1,00,000)
  if (integerPart >= 100000) {
    const lakh = Math.floor(integerPart / 100000);
    words += convertBelowThousand(lakh) + " Lakh ";
    integerPart %= 100000;
  }

  // Thousands (>= 1,000)
  if (integerPart >= 1000) {
    const thousand = Math.floor(integerPart / 1000);
    words += convertBelowThousand(thousand) + " Thousand ";
    integerPart %= 1000;
  }

  // Hundreds and remainder
  if (integerPart > 0) {
    words += convertBelowThousand(integerPart) + " ";
  }

  words = words.trim();
  let result = words ? `Rupees ${words}` : "Rupees";

  if (decimalPart > 0) {
    const paiseWords = convertBelowThousand(decimalPart);
    result += ` and ${paiseWords} Paise`;
  }

  result += " Only";
  return result;
}

export default numberToIndianWords;
