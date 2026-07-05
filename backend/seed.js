require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting seed...');

    // 0. Seed Business Types
    await prisma.business_type.createMany({
        data: [
            { name: 'RESORT' },
            { name: 'RESTAURANT' },
            { name: 'BOTH' }
        ],
        skipDuplicates: true
    });
    console.log(`✅ Business Types seeded.`);

    // 1. Create a Super Admin Role
    const superAdminRole = await prisma.super_admin_roles.upsert({
        where: { name: 'Super Admin' },
        update: {},
        create: {
            name: 'Super Admin',
            description: 'System Genesis Super Admin Role',
        },
    });

    console.log(`✅ Super Admin Role created or exists: ${superAdminRole.name}`);

    // 2. Create the Genesis Super User
    const superUserPassword = await bcrypt.hash('superadmin123', 10);
    const superUser = await prisma.super_users.upsert({
        where: { email: 'superadmin@saas.com' },
        update: {
            name: 'Marcus Vance',
            phone: '+1 (555) 019-8372'
        },
        create: {
            name: 'Marcus Vance',
            email: 'superadmin@saas.com',
            phone: '+1 (555) 019-8372',
            password_hash: superUserPassword,
            role_id: superAdminRole.id,
            status: 'active',
        },
    });

    console.log(`✅ Genesis Super User created or exists: ${superUser.email}`);

    // 3. Create the first Business (Tenant)
    // We'll check if a business already exists to prevent duplicates, or we can just create it.
    // Since we don't have a unique constraint on name or email for business, we'll search by name.
    let firstBusiness = await prisma.business.findFirst({
        where: { email: 'admin@firsthotel.com' }
    });

    if (!firstBusiness) {
        firstBusiness = await prisma.business.create({
            data: {
                name: 'The Grand Hotel',
                owner_name: 'John Doe',
                email: 'admin@firsthotel.com',
                status: 'active',
            },
        });
        console.log(`✅ First Business created: ${firstBusiness.name}`);
    } else {
        console.log(`✅ First Business already exists: ${firstBusiness.name}`);
    }

    // 4. Create the Business Admin for the first Business
    const businessAdminPassword = await bcrypt.hash('password123', 10);
    const businessAdmin = await prisma.business_admin.upsert({
        where: { email: 'admin@firsthotel.com' },
        update: {},
        create: {
            user_name: 'Grand Hotel Admin',
            email: 'admin@firsthotel.com',
            password_hash: businessAdminPassword,
            business_id: firstBusiness.id,
            status: 'active',
            created_by: superUser.id
        },
    });

    console.log(`✅ Business Admin created or exists: ${businessAdmin.email}`);
    
    // 4.5 Create a Branch for the first Business
    let firstBranch = await prisma.branch.findFirst({
        where: { business_id: firstBusiness.id }
    });
    
    if (!firstBranch) {
        firstBranch = await prisma.branch.create({
            data: {
                business_id: firstBusiness.id,
                address: '123 Main St',
                contact: '+1 (555) 123-4567',
                status: 'active'
            }
        });
        console.log(`✅ First Branch created: ${firstBranch.id}`);
    } else {
        console.log(`✅ First Branch already exists: ${firstBranch.id}`);
    }
    
    // ==========================================
    // EXTENDED SEEDING: Hotel & POS Modules
    // ==========================================
    console.log('\nCleaning up old dummy module data...');
    // We wipe everything (ignoring where clause since we force reset anyway, or use the new keys)
    await prisma.order_item.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menu_item.deleteMany();
    await prisma.menu_category.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.room.deleteMany();
    await prisma.room_type.deleteMany();
    await prisma.branch_staff.deleteMany();

    // 5. Create Hotel Room Types and Rooms
    console.log('Creating Hotel Room Types and Rooms...');
    const singleType = await prisma.room_type.create({
        data: { business_id: firstBusiness.id, name: 'Standard Single', capacity: 1, base_price: 100.00 }
    });
    const doubleType = await prisma.room_type.create({
        data: { business_id: firstBusiness.id, name: 'Deluxe Double', capacity: 2, base_price: 150.00 }
    });
    const suiteType = await prisma.room_type.create({
        data: { business_id: firstBusiness.id, name: 'Presidential Suite', capacity: 4, base_price: 300.00 }
    });

    await prisma.room.createMany({
        data: [
            { branch_id: firstBranch.id, room_number: '101', room_type_id: singleType.id },
            { branch_id: firstBranch.id, room_number: '102', room_type_id: doubleType.id },
            { branch_id: firstBranch.id, room_number: '201', room_type_id: suiteType.id },
        ]
    });
    const createdRoom = await prisma.room.findFirst({ where: { branch_id: firstBranch.id } });
    console.log('✅ Hotel Rooms seeded');

    // 6. Create a Reservation
    console.log('Creating Reservations...');
    await prisma.reservation.create({
        data: {
            branch_id: firstBranch.id,
            room_id: createdRoom.id,
            guest_name: 'Alice Johnson',
            check_in_date: new Date('2026-07-10T14:00:00Z'),
            check_out_date: new Date('2026-07-15T11:00:00Z'),
            total_amount: 500.00,
            status: 'confirmed'
        }
    });
    console.log('✅ Reservation seeded');

    // 7. Create Menu Categories & Items
    console.log('Creating Menu Categories and Items...');
    const beveragesCategory = await prisma.menu_category.create({
        data: { business_id: firstBusiness.id, name: 'Beverages' }
    });
    const mainsCategory = await prisma.menu_category.create({
        data: { business_id: firstBusiness.id, name: 'Mains' }
    });

    const coke = await prisma.menu_item.create({
        data: { business_id: firstBusiness.id, category_id: beveragesCategory.id, name: 'Coca Cola', price: 3.50, description: 'Chilled can of Coke' }
    });
    const burger = await prisma.menu_item.create({
        data: { business_id: firstBusiness.id, category_id: mainsCategory.id, name: 'Cheeseburger', price: 12.00, description: 'Classic beef cheeseburger with fries' }
    });
    console.log('✅ Menu Categories & Items seeded');

    // 8. Create POS Order
    console.log('Creating POS Order...');
    const newOrder = await prisma.order.create({
        data: { branch_id: firstBranch.id, table_number: 'Table 5', total_amount: 15.50, status: 'completed' }
    });

    await prisma.order_item.createMany({
        data: [
            { order_id: newOrder.id, menu_item_id: coke.id, quantity: 1, price_at_time_of_order: 3.50 },
            { order_id: newOrder.id, menu_item_id: burger.id, quantity: 1, price_at_time_of_order: 12.00 }
        ]
    });
    console.log('✅ POS Order seeded');

    // 9. Create Branch Staff
    console.log('Creating Branch Staff...');
    await prisma.branch_staff.create({
        data: {
            branch_id: firstBranch.id,
            name: 'John BranchManager',
            email: 'john@firsthotel.com',
            password_hash: await bcrypt.hash('password123', 10),
            role: 'Branch Manager',
            status: 'active'
        }
    });
    console.log('✅ Branch Staff seeded');

    console.log('\n--- Seed Complete ---');
    console.log('You can now log in via Postman to /api/auth/login using:');
    console.log('Email: admin@firsthotel.com');
    console.log('Password: password123');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
