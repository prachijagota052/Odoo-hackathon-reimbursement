DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS rule_approvers;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS approval_rules;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;

CREATE DATABASE IF NOT EXISTS reimbursement_system;
USE reimbursement_system;

CREATE TABLE companies (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100),
    currency    VARCHAR(10),
    country     VARCHAR(100),
    timezone    VARCHAR(50)     DEFAULT 'UTC',
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    name                    VARCHAR(100),
    email                   VARCHAR(100)    UNIQUE,
    password                TEXT,
    password_reset_token    TEXT            NULL,
    token_expires_at        TIMESTAMP       NULL,
    role                    ENUM('admin', 'manager', 'employee'),
    manager_id              INT             NULL,
    company_id              INT,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id)    REFERENCES users(id),
    FOREIGN KEY (company_id)    REFERENCES companies(id)
);

CREATE TABLE approval_rules (
    id                          INT AUTO_INCREMENT PRIMARY KEY,
    company_id                  INT,
    name                        VARCHAR(100),
    rule_type                   ENUM('percentage', 'all_required', 'hybrid') DEFAULT 'percentage',
    min_approvals_percentage    INT,
    manager_is_approver         BOOLEAN         DEFAULT FALSE,
    enforce_sequence            BOOLEAN         DEFAULT FALSE,
    manager_id                  INT             NULL,
    created_at                  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id)    REFERENCES companies(id),
    FOREIGN KEY (manager_id)    REFERENCES users(id)
);

CREATE TABLE expenses (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT,
    rule_id             INT,

    -- Receipt storage
    -- receipt_url      : raw path / local reference before Cloudinary upload
    -- receipt_image_url: final Cloudinary CDN URL after successful upload
    receipt_url         TEXT,
    receipt_image_url   VARCHAR(255)        NULL,

    -- OCR extracted fields (auto-filled from receipt scan; employee reviews before submit)
    vendor_name         VARCHAR(100),
    expense_date        DATE,

    -- Amount as it appears on the physical receipt
    original_amount     DECIMAL(10,2),
    original_currency   VARCHAR(10),

    -- Company default currency — copied from companies.currency at submit time.
    -- Stored here for audit integrity: if the company changes its currency later,
    -- historical expenses still reflect what was active at time of submission.
    company_currency    VARCHAR(10)         NOT NULL,

    -- Exchange rate locked in at submit time from the live API (e.g. exchangeratesapi.io).
    -- Locking it prevents the reimbursed amount from drifting after submission.
    exchange_rate       DECIMAL(10,6)       DEFAULT 1.000000,

    -- Final reimbursable amount: original_amount x exchange_rate
    converted_amount    DECIMAL(10,2)       NULL,

    -- amount / currency mirror converted_amount / company_currency for quick queries
    -- without needing to re-join or re-calculate.
    amount              DECIMAL(10,2),
    currency            VARCHAR(10),

    -- User-reviewed / manually entered fields
    category            VARCHAR(50),
    description         TEXT,

    -- Who physically paid for the expense (employee or company card)
    paid_by             VARCHAR(50),

    -- Workflow
    status              ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'pending',
    current_step        INT                 DEFAULT 1,
    resolved_at         TIMESTAMP           NULL,
    created_at          TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (rule_id)   REFERENCES approval_rules(id)
);

CREATE TABLE approvals (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    expense_id      INT,
    approver_id     INT,
    approval_type   ENUM('manager', 'rule')                 DEFAULT 'rule',
    status          ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    comment         TEXT,
    step_order      INT,
    created_at      TIMESTAMP                               DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id)    REFERENCES expenses(id),
    FOREIGN KEY (approver_id)   REFERENCES users(id)
);

CREATE TABLE rule_approvers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    rule_id         INT,
    approver_id     INT,
    step_order      INT,
    is_required     BOOLEAN     DEFAULT FALSE,
    can_override    BOOLEAN     DEFAULT FALSE,   -- TRUE = CFO-style; approval skips all remaining steps
    FOREIGN KEY (rule_id)       REFERENCES approval_rules(id),
    FOREIGN KEY (approver_id)   REFERENCES users(id)
);

CREATE TABLE notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT,
    expense_id  INT,
    type        ENUM('submitted', 'approved', 'rejected', 'pending_review'),
    message     TEXT,
    is_read     BOOLEAN     DEFAULT FALSE,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)       REFERENCES users(id),
    FOREIGN KEY (expense_id)    REFERENCES expenses(id)
);

-- Companies
INSERT INTO companies (name, currency, country, timezone) VALUES
    ('TestCorp',  'INR', 'India',         'Asia/Kolkata'),
    ('GlobalInc', 'USD', 'United States', 'America/New_York');

-- Users
-- Admin has no manager. Managers report to admin. Employees report to managers.
INSERT INTO users (name, email, password, role, manager_id, company_id) VALUES
    ('Admin User',      'admin@test.com',       '123', 'admin',    NULL, 1),  -- id 1
    ('Manager One',     'manager1@test.com',    '123', 'manager',  1,   1),   -- id 2
    ('Manager Two',     'manager2@test.com',    '123', 'manager',  1,   1),   -- id 3
    ('CFO',             'cfo@test.com',         '123', 'manager',  1,   1),   -- id 4
    ('Employee Alice',  'alice@test.com',       '123', 'employee', 2,   1),   -- id 5
    ('Employee Bob',    'bob@test.com',         '123', 'employee', 2,   1),   -- id 6
    ('Employee Carol',  'carol@test.com',       '123', 'employee', 3,   1),   -- id 7
    ('Global Admin',    'gadmin@global.com',    '123', 'admin',    NULL, 2), -- id 8
    ('Global Manager',  'gmanager@global.com',  '123', 'manager',  8,   2),  -- id 9
    ('Global Employee', 'gemp@global.com',      '123', 'employee', 9,   2);  -- id 10

-- Approval Rules
INSERT INTO approval_rules (company_id, name, rule_type, min_approvals_percentage, manager_is_approver, enforce_sequence, manager_id) VALUES
    (1, 'Standard Approval',   'percentage',   50,  TRUE,  FALSE, 2),   -- id 1: Manager One is approver, 50% needed
    (1, 'High Value Approval', 'all_required', 100, TRUE,  TRUE,  2),   -- id 2: Manager One, all required, sequential
    (1, 'CFO Hybrid Rule',     'hybrid',       50,  FALSE, FALSE, NULL),-- id 3: No manager as approver (CFO handles step 2)
    (2, 'Global Standard',     'percentage',   50,  TRUE,  FALSE, 9);   -- id 4: Global Manager is approver

-- Rule Approvers
INSERT INTO rule_approvers (rule_id, approver_id, step_order, is_required, can_override) VALUES
    -- Rule 1: Standard — Manager One or Manager Two (50% = either one is enough)
    (1, 2, 1, FALSE, FALSE),
    (1, 3, 2, FALSE, FALSE),
    -- Rule 2: High Value — Manager One (step 1) then Admin (step 2), both required
    (2, 2, 1, TRUE,  FALSE),
    (2, 1, 2, TRUE,  FALSE),
    -- Rule 3: CFO Hybrid — finance team votes in step 1, CFO can override in step 2
    (3, 2, 1, FALSE, FALSE),
    (3, 3, 1, FALSE, FALSE),
    (3, 4, 2, FALSE, TRUE),  -- CFO: can_override TRUE skips all remaining steps on approval
    -- Rule 4: Global Standard
    (4, 9, 1, TRUE,  FALSE);

-- Expenses
-- Column order: user_id, rule_id,
--               receipt_url, receipt_image_url,
--               vendor_name, expense_date,
--               original_amount, original_currency,
--               company_currency, exchange_rate, converted_amount,
--               amount, currency,
--               category, description, paid_by,
--               status, current_step, resolved_at
INSERT INTO expenses (
    user_id, rule_id,
    receipt_url, receipt_image_url,
    vendor_name, expense_date,
    original_amount, original_currency,
    company_currency, exchange_rate, converted_amount,
    amount, currency,
    category, description, paid_by,
    status, current_step, resolved_at
) VALUES

-- 1: Approved domestic travel (INR → INR, no conversion needed)
(5, 1,
 'uploads/receipts/r001.jpg', 'https://res.cloudinary.com/testcorp/image/upload/receipts/r001.jpg',
 'Ola Cabs', '2025-03-10',
 1500.00, 'INR',   'INR', 1.000000, 1500.00,   1500.00, 'INR',
 'Travel', 'Cab to client site', 'employee',
 'approved', 1, '2025-03-11 10:00:00'),

-- 2: Pending high-value equipment (manager approved, waiting on rule step 1)
(5, 2,
 'uploads/receipts/r002.jpg', 'https://res.cloudinary.com/testcorp/image/upload/receipts/r002.jpg',
 'Amazon India', '2025-03-12',
 45000.00, 'INR',   'INR', 1.000000, 45000.00,   45000.00, 'INR',
 'Equipment', 'Mechanical keyboard for WFH', 'company_card',
 'pending', 1, NULL),

-- 3: Pending team food (waiting on manager step)
(6, 1,
 'uploads/receipts/r003.jpg', 'https://res.cloudinary.com/testcorp/image/upload/receipts/r003.jpg',
 'Swiggy', '2025-03-13',
 800.00, 'INR',   'INR', 1.000000, 800.00,   800.00, 'INR',
 'Food', 'Team lunch', 'company_card',
 'pending', 1, NULL),

-- 4: Draft — saved but not submitted yet; no Cloudinary URL yet
(6, 1,
 NULL, NULL,
 'Local Print Shop', '2025-03-14',
 200.00, 'INR',   'INR', 1.000000, 200.00,   200.00, 'INR',
 'Miscellaneous', 'Printed documents for meeting', 'employee',
 'draft', 1, NULL),

-- 5: Rejected conference flight
(7, 2,
 'uploads/receipts/r005.jpg', 'https://res.cloudinary.com/testcorp/image/upload/receipts/r005.jpg',
 'IndiGo Airlines', '2025-03-05',
 3200.00, 'INR',   'INR', 1.000000, 3200.00,   3200.00, 'INR',
 'Travel', 'Flight to Mumbai conference', 'employee',
 'rejected', 1, '2025-03-06 14:00:00'),

-- 6: Pending software subscription (waiting on Manager Two)
(7, 1,
 'uploads/receipts/r006.jpg', 'https://res.cloudinary.com/testcorp/image/upload/receipts/r006.jpg',
 'Figma', '2025-03-15',
 999.00, 'INR',   'INR', 1.000000, 999.00,   999.00, 'INR',
 'Software', 'Figma monthly subscription', 'company_card',
 'pending', 1, NULL),

-- 7: Approved foreign currency — USD receipt converted to INR
-- 120 USD x 83.00 = 9,960 INR
(5, 3,
 'uploads/receipts/r007.jpg', 'https://res.cloudinary.com/testcorp/image/upload/receipts/r007.jpg',
 'The Capital Grille', '2025-03-08',
 120.00, 'USD',   'INR', 83.000000, 9960.00,   9960.00, 'INR',
 'Food', 'Client dinner in New York', 'company_card',
 'approved', 2, '2025-03-09 18:00:00'),

-- 8: Pending CFO hybrid — USD hotel converted to INR, waiting on CFO step
-- 500 USD x 83.00 = 41,500 INR
(5, 3,
 'uploads/receipts/r008.jpg', 'https://res.cloudinary.com/testcorp/image/upload/receipts/r008.jpg',
 'Marriott NYC', '2025-03-16',
 500.00, 'USD',   'INR', 83.000000, 41500.00,   41500.00, 'INR',
 'Travel', 'Hotel stay for client visit', 'company_card',
 'pending', 2, NULL),

-- 9: GlobalInc — approved USD domestic flight (no conversion needed)
(10, 4,
 'uploads/receipts/r009.jpg', 'https://res.cloudinary.com/globalinc/image/upload/receipts/r009.jpg',
 'Delta Airlines', '2025-03-10',
 300.00, 'USD',   'USD', 1.000000, 300.00,   300.00, 'USD',
 'Travel', 'Domestic flight for conference', 'company_card',
 'approved', 1, '2025-03-11 09:00:00'),

-- 10: GlobalInc — pending client lunch
(10, 4,
 'uploads/receipts/r010.jpg', 'https://res.cloudinary.com/globalinc/image/upload/receipts/r010.jpg',
 'Shake Shack', '2025-03-17',
 75.00, 'USD',   'USD', 1.000000, 75.00,   75.00, 'USD',
 'Food', 'Lunch with client', 'employee',
 'pending', 1, NULL);

-- Approvals (full audit trail — every step recorded)
INSERT INTO approvals (expense_id, approver_id, approval_type, status, comment, step_order) VALUES
    -- Expense 1: manager approved → rule step approved
    (1, 2, 'manager', 'approved', 'Looks good.',                              1),
    (1, 2, 'rule',    'approved', 'Approved as rule step.',                   1),

    -- Expense 2: manager approved → rule step 1 still pending
    (2, 2, 'manager', 'approved', 'Valid purchase, forwarding.',              1),
    (2, 2, 'rule',    'pending',  NULL,                                       1),

    -- Expense 3: waiting on manager
    (3, 2, 'manager', 'pending',  NULL,                                       1),

    -- Expense 5: manager rejected → admin confirmed rejection, flow stopped
    (5, 2, 'manager', 'rejected', 'Amount exceeds project budget.',           1),
    (5, 1, 'rule',    'rejected', 'Agreed with manager, policy violated.',    2),

    -- Expense 6: waiting on Manager Two
    (6, 3, 'manager', 'pending',  NULL,                                       1),

    -- Expense 7: manager approved → finance approved → CFO override triggered
    (7, 2, 'manager', 'approved', 'Valid foreign expense.',                   1),
    (7, 2, 'rule',    'approved', 'Finance step approved.',                   1),
    (7, 4, 'rule',    'approved', 'CFO override — all remaining steps auto-approved.', 2),

    -- Expense 8: manager approved → finance approved → CFO pending
    (8, 2, 'manager', 'approved', 'Large spend, escalating to CFO.',          1),
    (8, 2, 'rule',    'approved', 'Finance team approved.',                   1),
    (8, 4, 'rule',    'pending',  NULL,                                       2),

    -- Expense 9: Global Manager approved both steps
    (9, 9, 'manager', 'approved', 'Standard travel, approved.',               1),
    (9, 9, 'rule',    'approved', 'Rule step complete.',                      1),

    -- Expense 10: waiting on Global Manager
    (10, 9, 'manager','pending',  NULL,                                       1);

-- Notifications
INSERT INTO notifications (user_id, expense_id, type, message, is_read) VALUES
    (5,  1,  'approved',       'Your travel expense of ₹1,500 has been approved.',                   TRUE),
    (2,  2,  'pending_review', 'A high-value expense of ₹45,000 from Alice awaits your review.',     FALSE),
    (2,  3,  'pending_review', 'An expense of ₹800 from Bob awaits your review.',                    FALSE),
    (7,  5,  'rejected',       'Your flight expense of ₹3,200 was rejected: Amount exceeds budget.', TRUE),
    (3,  6,  'pending_review', 'An expense of ₹999 from Carol awaits your review.',                  FALSE),
    (5,  7,  'approved',       'Your client dinner expense of ₹9,960 has been approved.',            TRUE),
    (4,  8,  'pending_review', 'A high-value expense of ₹41,500 requires your CFO review.',          FALSE),
    (10, 9,  'approved',       'Your flight expense of $300 has been approved.',                     TRUE),
    (9,  10, 'pending_review', 'An expense of $75 from Global Employee awaits your review.',         FALSE);