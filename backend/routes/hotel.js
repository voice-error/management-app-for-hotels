const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { resolveBranchId } = require('../utils/branchHelper');

// ==========================================
// ROOMS
// ==========================================

// GET all rooms
router.get('/rooms', async (req, res) => {
    try {
        const branchId = await resolveBranchId(req);
        const rooms = await prisma.room.findMany({
            where: { branch_id: branchId }
        });
        res.json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// POST a new room
router.post('/rooms', async (req, res) => {
    try {
        const branchId = await resolveBranchId(req);
        const { room_number, type, capacity, price_per_night, status } = req.body;
        
        const newRoom = await prisma.room.create({
            data: {
                branch_id: branchId,
                room_number,
                type,
                capacity,
                price_per_night,
                status: status || 'available'
            }
        });
        res.status(201).json(newRoom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// PUT update a room
router.put('/rooms/:id', async (req, res) => {
    try {
        const branchId = await resolveBranchId(req);
        const { id } = req.params;
        const { room_number, type, capacity, price_per_night, status } = req.body;

        const updatedRoom = await prisma.room.update({
            where: { 
                id: id,
                branch_id: branchId // Ensuring tenant boundary
            },
            data: { room_number, type, capacity, price_per_night, status }
        });
        res.json(updatedRoom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update room' });
    }
});

// DELETE a room
router.delete('/rooms/:id', async (req, res) => {
    try {
        const branchId = await resolveBranchId(req);
        const { id } = req.params;
        await prisma.room.delete({
            where: {
                id: id,
                branch_id: branchId
            }
        });
        res.json({ message: 'Room deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});

// ==========================================
// RESERVATIONS
// ==========================================

// GET all reservations
router.get('/reservations', async (req, res) => {
    try {
        const branchId = await resolveBranchId(req);
        const reservations = await prisma.reservation.findMany({
            where: { branch_id: branchId }
        });
        res.json(reservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch reservations' });
    }
});

// POST a reservation
router.post('/reservations', async (req, res) => {
    try {
        const branchId = await resolveBranchId(req);
        const { room_id, guest_name, check_in_date, check_out_date, total_amount, status } = req.body;
        
        const newReservation = await prisma.reservation.create({
            data: {
                branch_id: branchId,
                room_id,
                guest_name,
                check_in_date: new Date(check_in_date),
                check_out_date: new Date(check_out_date),
                total_amount,
                status: status || 'pending'
            }
        });
        res.status(201).json(newReservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

// PUT update a reservation
router.put('/reservations/:id', async (req, res) => {
    try {
        const branchId = await resolveBranchId(req);
        const { id } = req.params;
        const { room_id, guest_name, check_in_date, check_out_date, total_amount, status } = req.body;

        const updatedReservation = await prisma.reservation.update({
            where: {
                id: id,
                branch_id: branchId
            },
            data: {
                room_id,
                guest_name,
                check_in_date: check_in_date ? new Date(check_in_date) : undefined,
                check_out_date: check_out_date ? new Date(check_out_date) : undefined,
                total_amount,
                status
            }
        });
        res.json(updatedReservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update reservation' });
    }
});

// DELETE a reservation
router.delete('/reservations/:id', async (req, res) => {
    try {
        const branchId = await resolveBranchId(req);
        const { id } = req.params;
        await prisma.reservation.delete({
            where: {
                id: id,
                branch_id: branchId
            }
        });
        res.json({ message: 'Reservation deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete reservation' });
    }
});

module.exports = router;
