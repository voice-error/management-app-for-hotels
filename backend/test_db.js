require('dotenv').config();
const prisma = require('./db');

async function main() {
  try {
    const types = await prisma.business_type.findMany();
    console.log("Business Types in DB:", types);
  } catch (err) {
    console.error("Error fetching business types:", err);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
