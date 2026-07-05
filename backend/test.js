require('dotenv').config();
const prisma = require('./db');
const bcrypt = require('bcryptjs');

async function main() {
    const email = 'test2@test.com';
    const password = 'mypassword123';
    
    // 1. Hash password
    const hash = await bcrypt.hash(password, 10);
    
    // 2. Create user in DB
    const role = await prisma.super_admin_roles.findFirst();
    const user = await prisma.super_users.create({
        data: {
            name: 'Test',
            email: email,
            password_hash: hash,
            role_id: role.id
        }
    });
    console.log("Created user:", user.email);
    
    // 3. Retrieve user
    const dbUser = await prisma.super_users.findUnique({ where: { email: email } });
    
    // 4. Compare
    const isMatch = await bcrypt.compare(password, dbUser.password_hash);
    console.log("Is Match?", isMatch);

    // 5. Test login endpoint via fetch
    const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    console.log("Login Status:", res.status);
}

main().finally(() => prisma.$disconnect());
