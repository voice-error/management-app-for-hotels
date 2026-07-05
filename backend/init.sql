BEGIN;

-- ============================================================
-- 1. SUPER ADMIN IDENTITY
-- ============================================================

CREATE TABLE super_admin_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,         -- 'OWNER', 'FINANCE', 'SUPPORT', 'AUDITOR'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE super_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id INT NOT NULL REFERENCES super_admin_roles(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. RETAILER / RESELLER
-- ============================================================

CREATE TABLE retailers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    address TEXT,
    contact VARCHAR(50),
    email VARCHAR(150),
    commission_rate DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. BUSINESS (TENANT) CORE (Upgraded for Soft Deletes)
-- ============================================================

CREATE TABLE business_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE          -- 'RESORT', 'RESTAURANT', 'BOTH'
);

CREATE TABLE business (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_type_id INT REFERENCES business_type(id),
    name VARCHAR(150) NOT NULL,
    address TEXT,
    owner_name VARCHAR(100),
    contact1 VARCHAR(50),
    contact2 VARCHAR(50),
    email VARCHAR(150),
    retailer_id UUID REFERENCES retailers(id),
    verified_by UUID REFERENCES super_users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','active','suspended','terminated')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- SOFT DELETE FLAG
    date_onboarded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_terminated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE branch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id), 
    address TEXT,
    contact VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. BUSINESS ADMIN (tenant root user, created by super admin)
-- ============================================================

CREATE TABLE business_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES super_users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. FEATURE CATALOG & ENTITLEMENT
-- ============================================================

CREATE TABLE feature_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL                 -- 'RESORT', 'RESTAURANT', 'CORE', 'ACCOUNTING'
);

CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES feature_category(id),
    code VARCHAR(50) NOT NULL UNIQUE,       -- 'ROOM_BOOKING', 'MENU_MGMT', 'INVENTORY'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_addon BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','inactive'))
);

CREATE TABLE business_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id), 
    feature_id INT NOT NULL REFERENCES features(id),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    enabled_by UUID REFERENCES super_users(id),
    enabled_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disabled_on TIMESTAMP WITH TIME ZONE,
    UNIQUE(business_id, feature_id)
);

-- ============================================================
-- 6. SUBSCRIPTION PLANS & BILLING
-- ============================================================

CREATE TABLE subscription_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL
        CHECK (billing_cycle IN ('monthly','yearly')),
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscription_features (
    id SERIAL PRIMARY KEY,
    subscription_type_id INT NOT NULL REFERENCES subscription_type(id) ON DELETE CASCADE,
    feature_id INT NOT NULL REFERENCES features(id),
    UNIQUE(subscription_type_id, feature_id)
);

CREATE TABLE business_subscription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id), -- Removed CASCADE
    subscription_type_id INT NOT NULL REFERENCES subscription_type(id),
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','expired','cancelled')),
    custom_price DECIMAL(10,2),
    created_by UUID REFERENCES super_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. ACCOUNTING (double-entry, platform billing of businesses)
-- ============================================================

CREATE TABLE chart_of_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('ASSET','LIABILITY','REVENUE','EXPENSE','EQUITY'))
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    entry_date DATE NOT NULL,
    reference VARCHAR(100),
    note TEXT,
    created_by UUID REFERENCES super_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INT NOT NULL REFERENCES chart_of_accounts(id),
    debit DECIMAL(12,2) NOT NULL DEFAULT 0,
    credit DECIMAL(12,2) NOT NULL DEFAULT 0,
    CHECK (debit >= 0 AND credit >= 0)
);

CREATE TABLE platform_invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    business_subscription_id UUID REFERENCES business_subscription(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (status IN ('unpaid','paid','overdue','cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE platform_payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES platform_invoice(id),
    business_id UUID NOT NULL REFERENCES business(id),
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(30),                      -- 'card', 'bank_transfer', 'manual'
    gateway_transaction_id VARCHAR(100),     -- ADDED: Stripe/PayPal transaction ID
    gateway_response JSONB,                  -- ADDED: Full API response receipt
    paid_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES super_users(id)
);

-- ============================================================
-- 8. AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id VARCHAR(255) NOT NULL,
    actor_type VARCHAR(20) NOT NULL DEFAULT 'super_admin',
    action VARCHAR(100) NOT NULL,             -- 'SUSPEND_BUSINESS','CHANGE_PRICE'
    target_type VARCHAR(50) NOT NULL,         -- 'business','business_admin'
    target_id VARCHAR(255) NOT NULL,          -- VARCHAR handles both UUID targets and SERIAL targets safely
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. IMPERSONATION SESSION TRACKING
-- ============================================================

CREATE TABLE impersonation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_user_id UUID NOT NULL REFERENCES super_users(id),
    business_admin_id UUID NOT NULL REFERENCES business_admin(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    reason TEXT
);

-- ============================================================
-- INDEXES (Optimized for UUIDs and Multi-Tenant queries)
-- ============================================================

CREATE INDEX idx_business_status ON business(status);
CREATE INDEX idx_business_is_deleted ON business(is_deleted);
CREATE INDEX idx_branch_business_id ON branch(business_id);
CREATE INDEX idx_business_admin_business_id ON business_admin(business_id);
CREATE INDEX idx_business_features_business_id ON business_features(business_id);
CREATE INDEX idx_business_subscription_business_id ON business_subscription(business_id);
CREATE INDEX idx_business_subscription_status ON business_subscription(status);
CREATE INDEX idx_journal_entries_business_id ON journal_entries(business_id);
CREATE INDEX idx_journal_entry_lines_entry_id ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_platform_invoice_business_id ON platform_invoice(business_id);
CREATE INDEX idx_platform_invoice_status ON platform_invoice(status);
CREATE INDEX idx_audit_log_target ON audit_log(target_type, target_id);

-- ============================================================
-- SEED DATA 
-- ============================================================

INSERT INTO super_admin_roles (name, description) VALUES
('OWNER', 'Full access to all platform functions'),
('FINANCE', 'Billing, invoices, receivables only'),
('SUPPORT', 'View/impersonate businesses for support, no billing edits'),
('AUDITOR', 'Read-only access to all data and logs');

INSERT INTO business_type (name) VALUES
('RESORT'),
('RESTAURANT'),
('BOTH');

INSERT INTO feature_category (name) VALUES
('CORE'),
('RESORT'),
('RESTAURANT'),
('ACCOUNTING');

INSERT INTO chart_of_accounts (name, type) VALUES
('Subscription Revenue', 'REVENUE'),
('Accounts Receivable', 'ASSET'),
('Cash', 'ASSET'),
('Accounts Payable', 'LIABILITY'),
('Refunds Expense', 'EXPENSE');

COMMIT;