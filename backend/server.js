require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const requireTenantAuth = require('./middleware/tenantAuth');
const prisma = require('./db');

const hotelRoutes = require('./routes/hotel');
const posRoutes = require('./routes/pos');
const businessRoutes = require('./routes/business');

const app = express();
const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());


app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await prisma.business_admin.findUnique({ where: { email } });
        let role = 'BUSINESS_ADMIN';
        let businessId = user ? user.business_id : null;
        let isMatch = false;

        if (user) {
            isMatch = await bcrypt.compare(password, user.password_hash);
        }

        // If not found as business admin, or password didn't match business admin, try super user
        if (!user || !isMatch) {
            user = await prisma.super_users.findUnique({ where: { email } });
            role = 'SUPER_ADMIN';
            businessId = null;
            if (user) {
                isMatch = await bcrypt.compare(password, user.password_hash);
            }
        }

        if (!user || !isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const tokenPayload = {
            userId: user.id,
            name: user.name || user.user_name,
            businessId: businessId,
            role: role
        };

        // 4. Sign the Token
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: '8h'
        });

        // 5. Send token via HttpOnly Cookie
        res.cookie('saas_auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000
        });

        res.json({ message: 'Login successful', role });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.cookie('saas_auth_token', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', requireTenantAuth, (req, res) => {
    res.json(req.userContext);
});

app.get('/api/admin/tenants', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const tenants = await prisma.business.findMany({
            include: {
                business_subscription: {
                    include: { subscription_type: true }
                }
            }
        });
        res.json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch tenants' });
    }
});

app.get('/api/admin/subscription-types', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const types = await prisma.subscription_type.findMany({ where: { status: 'active' } });
        res.json(types);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch subscription types' });
    }
});

app.post('/api/admin/tenants', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    const { name, owner_name, email, contact1, contact2, address, business_type_id, retailer_id, password, subscription_type_id } = req.body;
    
    try {
        const password_hash = await bcrypt.hash(password, 10);
        
        const newTenant = await prisma.$transaction(async (tx) => {
            const business = await tx.business.create({
                data: {
                    name,
                    owner_name,
                    email,
                    contact1,
                    contact2: contact2 || null,
                    address: address || null,
                    business_type_id: business_type_id ? parseInt(business_type_id, 10) : null,
                    retailer_id: retailer_id || null,
                    status: 'active',
                    verified_by: req.userContext.userId,
                    verified_at: new Date()
                }
            });

            await tx.business_admin.create({
                data: {
                    business_id: business.id,
                    user_name: owner_name || 'Admin',
                    email: email,
                    password_hash: password_hash,
                    created_by: req.userContext.userId,
                    status: 'active'
                }
            });

            if (subscription_type_id) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() + 21); // 21 days setup period

                const subType = await tx.subscription_type.findUnique({
                    where: { id: parseInt(subscription_type_id, 10) }
                });

                await tx.business_subscription.create({
                    data: {
                        business_id: business.id,
                        subscription_type_id: parseInt(subscription_type_id, 10),
                        start_date: startDate,
                        auto_renew: true,
                        status: 'active',
                        custom_price: subType ? subType.price : null,
                        created_by: req.userContext.userId
                    }
                });
            }

            await tx.audit_log.create({
                data: {
                    actor_id: `(${req.userContext.userId}) ${req.userContext.name || 'Unknown'}`,
                    actor_type: req.userContext.role,
                    action: 'create_tenant',
                    target_type: 'business',
                    target_id: `(${business.id}) ${business.name}`,
                    new_value: { name, email, owner_name },
                    ip_address: req.ip
                }
            });

            return business;
        });

        res.status(201).json(newTenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create tenant' });
    }
});

app.put('/api/admin/tenants/:id', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    const { name, owner_name, email, contact1, contact2, address, business_type_id, password } = req.body;
    try {
        const updateData = { name, owner_name, email, contact1, contact2, address };
        if (business_type_id) {
            updateData.business_type_id = parseInt(business_type_id, 10);
        }

        const updatedTenant = await prisma.business.update({
            where: { id: req.params.id },
            data: updateData
        });
        
        let passwordChanged = false;
        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            
            // Find the first admin for this business to update their password
            const admin = await prisma.business_admin.findFirst({
                where: { business_id: req.params.id }
            });

            if (admin) {
                await prisma.business_admin.update({
                    where: { id: admin.id },
                    data: { password_hash }
                });
                passwordChanged = true;
            }
        }

        await prisma.audit_log.create({
            data: {
                actor_id: `(${req.userContext.userId}) ${req.userContext.name || 'Unknown'}`,
                actor_type: req.userContext.role,
                action: 'edit_tenant',
                target_type: 'business',
                target_id: req.params.id,
                new_value: { name, owner_name, email, business_type_id, password_changed: passwordChanged },
                ip_address: req.ip
            }
        });

        res.json(updatedTenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update tenant' });
    }
});

app.put('/api/admin/tenants/:id/status', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    const { status } = req.body; // e.g., 'active' or 'suspended'
    try {
        const updatedTenant = await prisma.business.update({
            where: { id: req.params.id },
            data: { status }
        });

        await prisma.audit_log.create({
            data: {
                actor_id: `(${req.userContext.userId}) ${req.userContext.name || 'Unknown'}`,
                actor_type: req.userContext.role,
                action: 'update_tenant_status',
                target_type: 'business',
                target_id: req.params.id,
                new_value: { status },
                ip_address: req.ip
            }
        });

        res.json(updatedTenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update tenant status' });
    }
});

app.put('/api/admin/tenants/:id/subscription', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    const { subscription_type_id } = req.body;
    try {
        // Find the active subscription for this business
        const activeSub = await prisma.business_subscription.findFirst({
            where: { business_id: req.params.id, status: 'active' },
            orderBy: { created_at: 'desc' }
        });

        let updatedSub;
        if (activeSub) {
            // Update the existing active subscription type
            const subType = await prisma.subscription_type.findUnique({
                where: { id: parseInt(subscription_type_id, 10) }
            });

            updatedSub = await prisma.business_subscription.update({
                where: { id: activeSub.id },
                data: {
                    subscription_type_id: parseInt(subscription_type_id, 10),
                    custom_price: subType ? subType.price : null
                }
            });
        } else {
            // Create a new active subscription if none exists
            const subType = await prisma.subscription_type.findUnique({
                where: { id: parseInt(subscription_type_id, 10) }
            });

            const startDate = new Date();
            updatedSub = await prisma.business_subscription.create({
                data: {
                    business_id: req.params.id,
                    subscription_type_id: parseInt(subscription_type_id, 10),
                    start_date: startDate,
                    auto_renew: true,
                    status: 'active',
                    custom_price: subType ? subType.price : null,
                    created_by: req.userContext.userId
                }
            });
        }

        await prisma.audit_log.create({
            data: {
                actor_id: `(${req.userContext.userId}) ${req.userContext.name || 'Unknown'}`,
                actor_type: req.userContext.role,
                action: 'manage_subscription',
                target_type: 'business_subscription',
                target_id: updatedSub.id,
                new_value: { subscription_type_id },
                ip_address: req.ip
            }
        });

        res.json(updatedSub);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to manage subscription' });
    }
});

app.get('/api/admin/users', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const users = await prisma.super_users.findMany({
            include: { super_admin_roles: true }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/admin/users', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, email, password, role_id } = req.body;
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const newUser = await prisma.super_users.create({
            data: {
                name,
                email,
                password_hash,
                role_id: parseInt(role_id, 10)
            },
            include: { super_admin_roles: true }
        });

        await prisma.audit_log.create({
            data: {
                actor_id: `(${req.userContext.userId}) ${req.userContext.name || 'Unknown'}`,
                actor_type: req.userContext.role,
                action: 'create_super_user',
                target_type: 'super_users',
                target_id: `(${newUser.id}) ${newUser.name}`,
                new_value: { name, email, role_id },
                ip_address: req.ip
            }
        });

        res.json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.get('/api/admin/roles', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const roles = await prisma.super_admin_roles.findMany();
        res.json(roles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

app.post('/api/admin/users/:id/revoke', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.userContext.userId === req.params.id) {
        return res.status(403).json({ error: 'Cannot revoke your own access' });
    }
    try {
        const user = await prisma.super_users.findUnique({ where: { id: req.params.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const newStatus = user.status === 'active' ? 'revoked' : 'active';
        const updated = await prisma.super_users.update({
            where: { id: req.params.id },
            data: { status: newStatus },
            include: { super_admin_roles: true }
        });

        await prisma.audit_log.create({
            data: {
                actor_id: `(${req.userContext.userId}) ${req.userContext.name || 'Unknown'}`,
                actor_type: req.userContext.role,
                action: newStatus === 'revoked' ? 'revoke_super_user' : 'restore_super_user',
                target_type: 'super_users',
                target_id: `(${updated.id}) ${updated.name}`,
                old_value: { status: user.status },
                new_value: { status: updated.status },
                ip_address: req.ip
            }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to revoke access' });
    }
});

app.post('/api/admin/users/:id/reset-password', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const updated = await prisma.super_users.update({
            where: { id: req.params.id },
            data: { password_hash }
        });

        await prisma.audit_log.create({
            data: {
                actor_id: `(${req.userContext.userId}) ${req.userContext.name || 'Unknown'}`,
                actor_type: req.userContext.role,
                action: 'reset_password',
                target_type: 'super_users',
                target_id: `(${updated.id}) ${updated.name}`,
                ip_address: req.ip
            }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

app.get('/api/admin/logs', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const logs = await prisma.audit_log.findMany({
            orderBy: { created_at: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});
app.get('/api/branches', requireTenantAuth, async (req, res) => {
    try {

        const branches = await prisma.branch.findMany({
            where: {
                business_id: req.userContext.businessId
            }
        });

        res.json(branches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch branches' });
    }
});

app.use('/api/hotel', requireTenantAuth, hotelRoutes);
app.use('/api/pos', requireTenantAuth, posRoutes);

// --- PRESET CRUD ENDPOINTS ---

app.get('/api/admin/business-types', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const types = await prisma.business_type.findMany();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch business types' });
    }
});

app.post('/api/admin/business-types', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { name } = req.body;
        const newType = await prisma.business_type.create({ data: { name } });
        res.status(201).json(newType);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create business type' });
    }
});

app.put('/api/admin/business-types/:id', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { name } = req.body;
        const updated = await prisma.business_type.update({
            where: { id: parseInt(req.params.id, 10) },
            data: { name }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update business type' });
    }
});

app.post('/api/admin/subscription-types', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { name, billing_cycle, price, currency } = req.body;
        const newSub = await prisma.subscription_type.create({
            data: { name, billing_cycle, price: parseFloat(price), currency: currency || 'USD', status: 'active' }
        });
        res.status(201).json(newSub);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create subscription type' });
    }
});

app.put('/api/admin/subscription-types/:id', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { name, billing_cycle, price, currency, status } = req.body;
        const updated = await prisma.subscription_type.update({
            where: { id: parseInt(req.params.id, 10) },
            data: { name, billing_cycle, price: price !== undefined ? parseFloat(price) : undefined, currency, status }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update subscription type' });
    }
});

app.get('/api/admin/retailers', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const retailers = await prisma.retailers.findMany();
        res.json(retailers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch retailers' });
    }
});

app.post('/api/admin/retailers', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { name, address, contact, email, commission_rate } = req.body;
        const newRetailer = await prisma.retailers.create({
            data: { name, address, contact, email, commission_rate: commission_rate ? parseFloat(commission_rate) : 0, status: 'active' }
        });
        res.status(201).json(newRetailer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create retailer' });
    }
});

app.put('/api/admin/retailers/:id', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { name, address, contact, email, commission_rate, status } = req.body;
        const updated = await prisma.retailers.update({
            where: { id: req.params.id },
            data: { name, address, contact, email, commission_rate: commission_rate !== undefined ? parseFloat(commission_rate) : undefined, status }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update retailer' });
    }
});

app.post('/api/admin/tenants/:id/renew', requireTenantAuth, async (req, res) => {
    if (req.userContext.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const businessId = req.params.id;

        // Find the active subscription for this business
        const activeSub = await prisma.business_subscription.findFirst({
            where: { business_id: businessId, status: 'active' },
            include: { subscription_type: true },
            orderBy: { created_at: 'desc' }
        });

        if (!activeSub) {
            return res.status(404).json({ error: 'No active subscription found for this business' });
        }

        // Calculate new end date based on billing cycle
        let newEndDate = activeSub.end_date ? new Date(activeSub.end_date) : new Date();
        if (activeSub.subscription_type.billing_cycle === 'monthly') {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
        } else if (activeSub.subscription_type.billing_cycle === 'yearly') {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        }

        // Update the subscription: extend end date and UPDATE custom_price to the LATEST price
        const updatedSub = await prisma.business_subscription.update({
            where: { id: activeSub.id },
            data: {
                end_date: newEndDate,
                custom_price: activeSub.subscription_type.price // Snapshots the latest price upon renewal!
            }
        });

        // Audit Log
        await prisma.audit_log.create({
            data: {
                actor_id: `(${req.userContext.userId}) ${req.userContext.name || 'Unknown'}`,
                actor_type: req.userContext.role,
                action: 'renew_subscription',
                target_type: 'business_subscription',
                target_id: updatedSub.id,
                old_value: { end_date: activeSub.end_date, custom_price: activeSub.custom_price },
                new_value: { end_date: updatedSub.end_date, custom_price: updatedSub.custom_price },
                ip_address: req.ip
            }
        });

        res.json(updatedSub);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to renew subscription' });
    }
});

app.use('/api/business', requireTenantAuth, businessRoutes);
app.use('/api/hotel', requireTenantAuth, hotelRoutes);
app.use('/api/pos', requireTenantAuth, posRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
});