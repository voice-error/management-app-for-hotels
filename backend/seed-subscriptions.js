require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.subscription_type.createMany({
        data: [
            { name: 'Basic Tier', billing_cycle: 'monthly', price: 99.00 },
            { name: 'Professional Tier', billing_cycle: 'monthly', price: 199.00 },
            { name: 'Enterprise Tier', billing_cycle: 'yearly', price: 1999.00 }
        ],
        skipDuplicates: true
    });
    console.log("Subscription types seeded.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
