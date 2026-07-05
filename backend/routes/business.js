const express = require('express');
const router = express.Router();
const prisma = require('../db');
const bcrypt = require('bcryptjs');

// GET Business Admin Dashboard metrics
router.get('/dashboard', async (req, res) => {
    try {
        const businessId = req.userContext.businessId;

        // Total branches
        const totalBranches = await prisma.branch.count({
            where: { business_id: businessId }
        });

        // Get all branches to calculate aggregated metrics and return a list
        const branches = await prisma.branch.findMany({
            where: { business_id: businessId },
            include: {
                _count: {
                    select: {
                        rooms: true,
                        reservations: true,
                        orders: true
                    }
                }
            }
        });

        let totalRooms = 0;
        let totalReservations = 0;
        let totalOrders = 0;

        branches.forEach(branch => {
            totalRooms += branch._count.rooms;
            totalReservations += branch._count.reservations;
            totalOrders += branch._count.orders;
        });

        res.json({
            metrics: {
                totalBranches,
                totalRooms,
                totalReservations,
                totalOrders
            },
            branches: branches
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
});

// ==========================================
// BRANCH MANAGEMENT
// ==========================================

router.get('/branches', async (req, res) => {
    try {
        const branches = await prisma.branch.findMany({
            where: { business_id: req.userContext.businessId },
            include: {
                staff: {
                    where: { role: 'Branch Manager' },
                    select: { name: true }
                }
            }
        });
        
        // Map to expected frontend format
        const formatted = branches.map(b => ({
            id: b.id,
            name: b.name || b.address || `Branch ${b.id.substring(0,6)}`,
            address: b.address,
            contact: b.contact,
            status: b.status,
            manager: b.staff.length > 0 ? b.staff[0].name : 'Pending'
        }));
        
        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch branches' });
    }
});

router.post('/branches', async (req, res) => {
    try {
        const { name, address, contact } = req.body;
        const branch = await prisma.branch.create({
            data: {
                business_id: req.userContext.businessId,
                name,
                address,
                contact,
                status: 'active'
            }
        });
        res.status(201).json(branch);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create branch' });
    }
});

router.put('/branches/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, contact, status } = req.body;
        
        // Ensure the branch belongs to the business
        const existingBranch = await prisma.branch.findFirst({
            where: { id, business_id: req.userContext.businessId }
        });
        if (!existingBranch) return res.status(403).json({ error: 'Unauthorized branch' });

        const branch = await prisma.branch.update({
            where: { id },
            data: {
                name,
                address,
                contact,
                status
            }
        });
        res.json(branch);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update branch' });
    }
});

// ==========================================
// MASTER CATALOG
// ==========================================

// CATEGORIES
router.get('/catalog/categories', async (req, res) => {
    try {
        const categories = await prisma.menu_category.findMany({
            where: { business_id: req.userContext.businessId }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

router.post('/catalog/categories', async (req, res) => {
    try {
        const { name } = req.body;
        const category = await prisma.menu_category.create({
            data: {
                name,
                business_id: req.userContext.businessId
            }
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// MENU ITEMS
router.get('/catalog/menu-items', async (req, res) => {
    try {
        const items = await prisma.menu_item.findMany({
            where: { business_id: req.userContext.businessId, status: { not: 'archived' } },
            include: { category: true }
        });
        const formatted = items.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category?.name,
            category_id: item.category_id,
            price: parseFloat(item.price),
            description: item.description,
            status: item.status
        }));
        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

router.post('/catalog/menu-items', async (req, res) => {
    try {
        const { name, category_id, price, description, status } = req.body;
        const item = await prisma.menu_item.create({
            data: {
                business_id: req.userContext.businessId,
                category_id,
                name,
                price,
                description,
                status: status || 'active'
            },
            include: { category: true }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create menu item' });
    }
});

router.put('/catalog/menu-items/:id', async (req, res) => {
    try {
        const { name, category_id, price, description, status } = req.body;
        const item = await prisma.menu_item.update({
            where: { id: req.params.id, business_id: req.userContext.businessId },
            data: { name, category_id, price, description, status },
            include: { category: true }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update menu item' });
    }
});

router.delete('/catalog/menu-items/:id', async (req, res) => {
    try {
        await prisma.menu_item.update({
            where: { id: req.params.id, business_id: req.userContext.businessId },
            data: { status: 'archived' }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
});

// ROOM TYPES
router.get('/catalog/room-types', async (req, res) => {
    try {
        const types = await prisma.room_type.findMany({
            where: { business_id: req.userContext.businessId, status: { not: 'archived' } }
        });
        const formatted = types.map(t => ({
            id: t.id,
            name: t.name,
            capacity: t.capacity,
            basePrice: parseFloat(t.base_price),
            description: t.description,
            status: t.status
        }));
        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch room types' });
    }
});

router.post('/catalog/room-types', async (req, res) => {
    try {
        const { name, capacity, basePrice, description, status } = req.body;
        const roomType = await prisma.room_type.create({
            data: {
                business_id: req.userContext.businessId,
                name,
                capacity: parseInt(capacity, 10),
                base_price: basePrice,
                description,
                status: status || 'active'
            }
        });
        res.json(roomType);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create room type' });
    }
});

router.put('/catalog/room-types/:id', async (req, res) => {
    try {
        const { name, capacity, basePrice, description, status } = req.body;
        const roomType = await prisma.room_type.update({
            where: { id: req.params.id, business_id: req.userContext.businessId },
            data: {
                name,
                capacity: parseInt(capacity, 10),
                base_price: basePrice,
                description,
                status
            }
        });
        res.json(roomType);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update room type' });
    }
});

router.delete('/catalog/room-types/:id', async (req, res) => {
    try {
        await prisma.room_type.update({
            where: { id: req.params.id, business_id: req.userContext.businessId },
            data: { status: 'archived' }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete room type' });
    }
});

// BRANCH AVAILABILITY
router.get('/catalog/menu-items/:id/availability', async (req, res) => {
    try {
        const avail = await prisma.branch_menu_items.findMany({
            where: { menu_item_id: req.params.id, is_available: true }
        });
        res.json(avail.map(a => a.branch_id));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

router.put('/catalog/menu-items/:id/availability', async (req, res) => {
    try {
        const { branchIds } = req.body; // array of branch_id
        await prisma.branch_menu_items.deleteMany({ where: { menu_item_id: req.params.id } });
        if (branchIds && branchIds.length > 0) {
            await prisma.branch_menu_items.createMany({
                data: branchIds.map(bid => ({ branch_id: bid, menu_item_id: req.params.id, is_available: true }))
            });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update availability' });
    }
});

router.get('/catalog/room-types/:id/availability', async (req, res) => {
    try {
        const avail = await prisma.branch_room_types.findMany({
            where: { room_type_id: req.params.id, is_available: true }
        });
        res.json(avail.map(a => a.branch_id));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

router.put('/catalog/room-types/:id/availability', async (req, res) => {
    try {
        const { branchIds } = req.body;
        await prisma.branch_room_types.deleteMany({ where: { room_type_id: req.params.id } });
        if (branchIds && branchIds.length > 0) {
            await prisma.branch_room_types.createMany({
                data: branchIds.map(bid => ({ branch_id: bid, room_type_id: req.params.id, is_available: true }))
            });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update availability' });
    }
});

// ==========================================
// BRANCH STAFF
// ==========================================

router.get('/staff', async (req, res) => {
    try {
        const branches = await prisma.branch.findMany({
            where: { business_id: req.userContext.businessId },
            select: { id: true, address: true }
        });
        const branchIds = branches.map(b => b.id);
        
        const staff = await prisma.branch_staff.findMany({
            where: { branch_id: { in: branchIds } },
            include: { branch: true }
        });
        
        const formatted = staff.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            branch: s.branch.address || `Branch ${s.branch.id.substring(0,6)}`,
            role: s.role,
            status: s.status
        }));
        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
});

router.post('/staff', async (req, res) => {
    try {
        const { branchId, name, email, password, role, status } = req.body;
        // Basic check to ensure branch belongs to this business
        const branch = await prisma.branch.findFirst({
            where: { id: branchId, business_id: req.userContext.businessId }
        });
        if (!branch) return res.status(403).json({ error: 'Unauthorized branch' });

        const hash = await bcrypt.hash(password || 'password123', 10);
        
        const staff = await prisma.branch_staff.create({
            data: {
                branch_id: branchId,
                name,
                email,
                role,
                password_hash: hash,
                status: status || 'active'
            }
        });
        res.status(201).json(staff);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create staff' });
    }
});

// ==========================================
// FINANCIALS
// ==========================================

router.get('/financials', async (req, res) => {
    try {
        const branches = await prisma.branch.findMany({
            where: { business_id: req.userContext.businessId },
            include: {
                orders: true,
                reservations: true
            }
        });
        
        // Mocking end of day grouping by branch for simplicity here
        const reports = branches.map(b => {
            const posRevenue = b.orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
            const hotelRevenue = b.reservations.reduce((sum, res) => sum + parseFloat(res.total_amount), 0);
            return {
                date: new Date().toISOString().split('T')[0],
                branch: b.address || `Branch ${b.id.substring(0,6)}`,
                posRevenue,
                hotelRevenue,
                total: posRevenue + hotelRevenue
            };
        });
        
        res.json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch financials' });
    }
});

router.get('/financials/chart', async (req, res) => {
    try {
        const { filter } = req.query; // 'week', 'month', 'year'
        
        const branches = await prisma.branch.findMany({
            where: { business_id: req.userContext.businessId }
        });

        if (branches.length === 0) {
            return res.json([]);
        }
        const branchIds = branches.map(b => b.id);

        let orders = await prisma.order.findMany({
            where: { branch_id: { in: branchIds } }
        });
        let reservations = await prisma.reservation.findMany({
            where: { branch_id: { in: branchIds } }
        });

        if (orders.length === 0 && reservations.length === 0) {
            // Generate Dummy Data for the first branch
            const dummyBranchId = branchIds[0];
            const now = new Date();
            const newOrders = [];
            const newReservations = [];
            
            let room = await prisma.room.findFirst({ where: { branch_id: dummyBranchId } });
            if (!room) {
                let rt = await prisma.room_type.findFirst({ where: { business_id: req.userContext.businessId }});
                if (!rt) {
                    rt = await prisma.room_type.create({
                        data: { business_id: req.userContext.businessId, name: 'Standard', base_price: 100, capacity: 2 }
                    });
                }
                room = await prisma.room.create({
                    data: { branch_id: dummyBranchId, room_type_id: rt.id, room_number: '101' }
                });
            }

            for (let i = 0; i < 150; i++) {
                const randomDaysAgo = Math.floor(Math.random() * 365);
                const d = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
                
                newOrders.push({
                    branch_id: dummyBranchId,
                    table_number: 'T1',
                    total_amount: Math.floor(Math.random() * 300) + 50,
                    status: 'completed',
                    created_at: d,
                    updated_at: d
                });

                newReservations.push({
                    branch_id: dummyBranchId,
                    room_id: room.id,
                    guest_name: 'Dummy Guest',
                    check_in_date: d,
                    check_out_date: new Date(d.getTime() + 2 * 24 * 60 * 60 * 1000),
                    total_amount: Math.floor(Math.random() * 800) + 150,
                    status: 'completed',
                    created_at: d,
                    updated_at: d
                });
            }

            await prisma.order.createMany({ data: newOrders });
            await prisma.reservation.createMany({ data: newReservations });

            orders = await prisma.order.findMany({ where: { branch_id: { in: branchIds } } });
            reservations = await prisma.reservation.findMany({ where: { branch_id: { in: branchIds } } });
        }

        const buckets = [];
        const now = new Date();
        if (filter === 'week') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                buckets.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), dateStr: d.toDateString(), hotel: 0, pos: 0 });
            }
        } else if (filter === 'month') {
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                buckets.push({ name: `${d.getMonth() + 1}/${d.getDate()}`, dateStr: d.toDateString(), hotel: 0, pos: 0 });
            }
        } else {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                buckets.push({ name: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), month: d.getMonth(), year: d.getFullYear(), hotel: 0, pos: 0 });
            }
        }

        const processRecord = (record, type) => {
            const date = new Date(record.created_at);
            for (const b of buckets) {
                if (filter === 'week' || filter === 'month') {
                    if (date.toDateString() === b.dateStr) {
                        b[type] += parseFloat(record.total_amount);
                        break;
                    }
                } else {
                    if (date.getMonth() === b.month && date.getFullYear() === b.year) {
                        b[type] += parseFloat(record.total_amount);
                        break;
                    }
                }
            }
        };

        reservations.forEach(r => processRecord(r, 'hotel'));
        orders.forEach(o => processRecord(o, 'pos'));

        res.json(buckets.map(b => ({ name: b.name, hotel: b.hotel, pos: b.pos })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

module.exports = router;
