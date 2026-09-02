const xlsx = require('xlsx');

const files = [
  'C:\\Users\\Faizan\\Downloads\\1.xlsx',
  'C:\\Users\\Faizan\\Downloads\\2.xlsx'
];

let totalRows = 0;
let uniqueProducts = new Map(); // productCode -> product object
let allVariants = [];
let allImages = new Set();
let allVideos = new Set();
const allColumns = new Set();

files.forEach(file => {
  const workbook = xlsx.readFile(file);
  const sheet2 = workbook.Sheets['Sheet2'];
  
  if (!sheet2) return;
  
  const data = xlsx.utils.sheet_to_json(sheet2, { header: 1 });
  const headers = data[0];
  
  if(!headers) return;
  
  headers.forEach(h => {
    if(h) allColumns.add(h);
  });
  
  const rows = data.slice(1).filter(row => row.length > 0 && row.some(cell => cell !== undefined && cell !== null && cell !== ""));
  totalRows += rows.length;
  
  const codeIdx = headers.indexOf('Product Code');
  const skuIdx = headers.indexOf('Sku Id');
  const img1Idx = headers.indexOf('Image 1');
  const vid1Idx = headers.indexOf('Video 1');
  
  rows.forEach(row => {
    const code = row[codeIdx];
    if (code) {
      if (!uniqueProducts.has(code)) {
        uniqueProducts.set(code, { variants: [] });
      }
      uniqueProducts.get(code).variants.push(row);
      allVariants.push(row);
      
      // count media
      for(let i=1; i<=10; i++) {
        const imgIdx = headers.indexOf(`Image ${i}`);
        if(imgIdx !== -1 && row[imgIdx]) allImages.add(row[imgIdx]);
      }
      for(let i=1; i<=2; i++) {
        const vidIdx = headers.indexOf(`Video ${i}`);
        if(vidIdx !== -1 && row[vidIdx]) allVideos.add(row[vidIdx]);
      }
    }
  });
});

console.log(`- Number of rows in Sheet2: ${totalRows}`);
console.log(`- Number of unique products: ${uniqueProducts.size}`);
console.log(`- Number of variants: ${allVariants.length}`);
console.log(`- Number of image URLs: ${allImages.size}`);
console.log(`- Number of video URLs: ${allVideos.size}`);

// Conflict check
const conflicts = Array.from(uniqueProducts.keys()).filter(code => code === 'UD-5002-BL');
console.log(`- Number of products that would conflict with existing database records: ${conflicts.length} (${conflicts.join(', ')})`);

// Map the columns
console.log("\nMAPPING:");
Array.from(allColumns).forEach(col => {
  console.log(`COLUMN: ${col}`);
});
