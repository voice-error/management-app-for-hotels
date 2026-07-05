require('dotenv').config();
const prisma = require('./db');

async function main() {
  const existing = await prisma.subscription_type.findMany();
  console.log("Existing Subscriptions:", existing);

  const subs = [
    { name: 'Restaurant Only', price: 850, billing_cycle: 'monthly', status: 'active' },
    { name: 'Hotel Only', price: 1000, billing_cycle: 'monthly', status: 'active' },
    { name: 'Hotel & Restaurant', price: 1250, billing_cycle: 'monthly', status: 'active' }
  ];

  for (const s of subs) {
    try {
      await prisma.subscription_type.create({
        data: s
      });
      console.log(`Created: ${s.name}`);
    } catch (e) {
      console.error(`Failed to create ${s.name}:`, e.message);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
