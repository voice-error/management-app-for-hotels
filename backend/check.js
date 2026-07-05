const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany();
  const reservations = await prisma.reservation.findMany();
  console.log('Orders:', orders.length);
  console.log('Reservations:', reservations.length);
  if (orders.length > 0) console.log('Order branch:', orders[0].branch_id);
  if (reservations.length > 0) console.log('Res branch:', reservations[0].branch_id);
}
main().catch(console.error).finally(() => prisma.$disconnect());
