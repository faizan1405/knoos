const xlsx = require('xlsx');

const workbook = xlsx.readFile('C:\\Users\\Faizan\\Downloads\\RANK ZIO MASTER SHEET.xlsx');
const sheet2 = workbook.Sheets['Sheet2'];

if (!sheet2) {
  console.error("Sheet2 not found!");
  process.exit(1);
}

const data = xlsx.utils.sheet_to_json(sheet2, { header: 1 });
const headers = data[0];
const rows = data.slice(1).filter(row => row.length > 0 && row.some(cell => cell !== undefined && cell !== null && cell !== ""));

console.log(`\nA. Total product rows in Sheet2: ${rows.length}`);

// Assuming 'Product Code' is the parent SKU
const productCodeIndex = headers.indexOf('Product Code');
const uniqueProducts = new Set();
let variantCount = 0;

rows.forEach(row => {
  const code = row[productCodeIndex];
  if (code) {
    uniqueProducts.add(code);
    variantCount++; // Each row is a variant
  }
});

console.log(`B. Number of unique products based on Product Code: ${uniqueProducts.size}`);
console.log(`C. Number of variants (rows with product codes): ${variantCount}`);
console.log(`\nD. All Excel columns in Sheet2:`);
headers.forEach((header, i) => {
  if(header) console.log(`- ${header}`);
});
