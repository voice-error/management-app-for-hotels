const express = require('express');
const router = express.Router();
const prisma = require('../db');

// ==========================================
// MENU CATALOG
// ==========================================

// GET all menu categories and items
router.get('/menu', async (req, res) => {
    try {
        const menu = await prisma.menu_category.findMany({
            where: { business_id: req.userContext.businessId },
            include: { menu_items: true }
        });
        res.json(menu);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

// POST a menu category
router.post('/categories', async (req, res) => {
    try {
        const { name } = req.body;
        
        const newCategory = await prisma.menu_category.create({
            data: {
                business_id: req.userContext.businessId,
                name
            }
        });
        res.status(201).json(newCategory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// POST a menu item
router.post('/items', async (req, res) => {
    try {
        const { category_id, name, price, description } = req.body;
        
        // Ensure the category actually belongs to the tenant
        const category = await prisma.menu_category.findUnique({
            where: { id: category_id, business_id: req.userContext.businessId }
        });

        if (!category) {
            return res.status(404).json({ error: 'Menu category not found' });
        }

        const newItem = await prisma.menu_item.create({
            data: {
                business_id: req.userContext.businessId,
                category_id,
                name,
                price,
                description
            }
        });
        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create menu item' });
    }
});

// ==========================================
// POS ORDERS
// ==========================================

// GET active orders
router.get('/orders', async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { business_id: req.userContext.businessId },
            include: { order_items: { include: { menu_item: true } } }
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// POST an order
router.post('/orders', async (req, res) => {
    try {
        // Expected items format: [{ menu_item_id: "uuid", quantity: 2, price_at_time_of_order: 12.00 }]
        const { table_number, total_amount, status, items } = req.body;
        
        const newOrder = await prisma.order.create({
            data: {
                business_id: req.userContext.businessId,
                table_number,
                total_amount,
                status: status || 'pending',
                order_items: {
                    create: items.map(item => ({
                        business_id: req.userContext.businessId,
                        menu_item_id: item.menu_item_id,
                        quantity: item.quantity,
                        price_at_time_of_order: item.price_at_time_of_order
                    }))
                }
            },
            include: { order_items: true }
        });
        res.status(201).json(newOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// PUT update an order
router.put('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, total_amount, table_number } = req.body;

        const updatedOrder = await prisma.order.update({
            where: {
                id: id,
                business_id: req.userContext.businessId
            },
            data: {
                status,
                total_amount,
                table_number
            }
        });
        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

module.exports = router;
