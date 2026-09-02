const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

const files = [
  'C:\\Users\\Faizan\\Downloads\\1.xlsx',
  'C:\\Users\\Faizan\\Downloads\\2.xlsx'
];

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const uniqueProducts = new Map();

  files.forEach(file => {
    const workbook = xlsx.readFile(file);
    const sheet2 = workbook.Sheets['Sheet2'];
    if (!sheet2) return;
    
    const data = xlsx.utils.sheet_to_json(sheet2, { header: 1 });
    const headers = data[0];
    if (!headers) return;
    
    const rows = data.slice(1).filter(r => r.length > 0 && r.some(c => c !== undefined && c !== null && c !== ""));
    
    const getVal = (row, headerName) => {
      const idx = headers.indexOf(headerName);
      if (idx === -1) return null;
      return row[idx] !== undefined && row[idx] !== "" ? row[idx] : null;
    };

    rows.forEach(row => {
      const code = getVal(row, 'Product Code');
      if (!code) return;

      if (!uniqueProducts.has(code)) {
        uniqueProducts.set(code, {
          product: {
            sku: code,
            name: getVal(row, 'Name') || 'Unknown Product',
            salePrice: parseFloat(getVal(row, 'Selling Price') || 0),
            price: parseFloat(getVal(row, 'MRP') || 0),
            costPrice: parseFloat(getVal(row, 'Cost Price') || 0),
            description: getVal(row, 'Description') || null,
            status: getVal(row, 'Visibility') === 'False' ? 'DRAFT' : 'ACTIVE',
            color: getVal(row, 'Colour') || null,
            category: getVal(row, 'Product Type') || getVal(row, 'attr_Product Type') || null,
            gstPercentage: parseFloat(getVal(row, 'GST %') || 0),
            hsnCode: (getVal(row, 'HSN Code') || '').toString(),
            packagingLength: parseFloat(getVal(row, 'Packaging Length (in cm)') || 0),
            packagingBreadth: parseFloat(getVal(row, 'Packaging Breadth (in cm)') || 0),
            packagingHeight: parseFloat(getVal(row, 'Packaging Height (in cm)') || 0),
            packagingWeight: parseFloat(getVal(row, 'Packaging Weight (in kg)') || 0),
            
            upperMaterial: getVal(row, 'attr_Outer Material') || null,
            sole: getVal(row, 'attr_Sole Material') || getVal(row, 'attr_Sloe Material') || getVal(row, 'attr_Sole Matrial') || getVal(row, 'attr_Sole Type') || null,
            gender: (getVal(row, 'attr_Ideal For') || getVal(row, 'attr_Ideal for') || 'MEN').toUpperCase(),

            attributes: {
              "Amazon ASIN": getVal(row, 'Amazon ASIN'),
              "Size Type": getVal(row, 'Size Type'),
              "Return Condition": getVal(row, 'Return/Exchange Condition'),
              "Size Chart": getVal(row, 'Size Chart'),
              "Closure Type": getVal(row, 'attr_Closure Type'),
              "Water Resistant": getVal(row, 'attr_Water Resistant'),
              "Article Number": getVal(row, 'attr_Article Number'),
              "Colour Code": getVal(row, 'attr_Colour Code'),
              "Secondary Color": getVal(row, 'attr_Secondary Color'),
              "Brand Color": getVal(row, 'attr_Brand Color'),
              "Style Code": getVal(row, 'attr_Style Code'),
              "Occasion": getVal(row, 'attr_Occasion'),
              "Heel Height": getVal(row, 'attr_Heel Height (inch)'),
              "Pack Of": getVal(row, 'attr_Pack Of'),
              "Type for Casual": getVal(row, 'attr_Type for Casual'),
              "Type for Sports": getVal(row, 'attr_Type for Sports')
            }
          },
          variants: [],
          media: new Map() // url -> { isVideo, sortOrder }
        });
      }

      const prodGroup = uniqueProducts.get(code);

      // Add variant
      const skuId = getVal(row, 'Sku Id') || `${code}-${getVal(row, 'Size')}`;
      if (!prodGroup.variants.some(v => v.sku === skuId)) {
        prodGroup.variants.push({
          sku: skuId,
          size: (getVal(row, 'Size') || 'OS').toString(),
          stock: parseInt(getVal(row, 'Quantity') || 0)
        });
      }

      // Add images
      for (let i = 1; i <= 10; i++) {
        const url = getVal(row, `Image ${i}`);
        if (url && !prodGroup.media.has(url)) {
          prodGroup.media.set(url, { isVideo: false, sortOrder: i });
        }
      }
      
      // Add videos
      for (let i = 1; i <= 2; i++) {
        const url = getVal(row, `Video ${i}`);
        if (url && !prodGroup.media.has(url)) {
          prodGroup.media.set(url, { isVideo: true, sortOrder: 10 + i });
        }
      }
    });
  });

  console.log(`Parsed ${uniqueProducts.size} unique products.`);

  for (const [code, data] of uniqueProducts.entries()) {
    const slug = slugify(data.product.name) || code.toLowerCase();
    
    // Clean up nulls in attributes
    const cleanAttributes = {};
    for (const [k, v] of Object.entries(data.product.attributes)) {
      if (v !== null && v !== undefined) {
        cleanAttributes[k] = v;
      }
    }

    try {
      const existing = await prisma.product.findUnique({ where: { sku: code } });
      if (existing) {
        console.log(`Product ${code} already exists. Skipping or you can choose to update.`);
        continue;
      }

      console.log(`Creating product: ${code} - ${data.product.name}`);
      await prisma.product.create({
        data: {
          ...data.product,
          slug,
          attributes: cleanAttributes,
          images: {
            create: Array.from(data.media.entries()).map(([url, meta]) => ({
              imageUrl: url,
              isVideo: meta.isVideo,
              sortOrder: meta.sortOrder
            }))
          },
          variants: {
            create: data.variants.map(v => ({
              sku: v.sku,
              size: v.size,
              stock: v.stock
            }))
          }
        }
      });
      console.log(`Successfully created ${code}!`);
    } catch (err) {
      console.error(`Failed to insert product ${code}:`, err.message);
    }
  }

  console.log("Import process complete.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
