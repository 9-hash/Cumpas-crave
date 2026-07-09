-- ============================================================
-- Campus Crave — Database Schema
-- Derived from every column referenced in server/src/routes/*.js
-- Run this once against a fresh local Postgres database, e.g.:
--   createdb campus_crave
--   psql -d campus_crave -f campus_crave_schema.sql
-- ============================================================

-- ---------- users ----------
-- Referenced in: auth.routes.js, middleware/auth.js, utils/token.js
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT         NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20)  NOT NULL DEFAULT 'student', -- student | owner | staff | admin
    password_reset_token_hash TEXT,
    password_reset_expires_at TIMESTAMP,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- students ----------
-- Referenced in: auth.routes.js (register), profile.routes.js
CREATE TABLE students (
    id                    SERIAL PRIMARY KEY,
    user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name             VARCHAR(150) NOT NULL,
    reg_no                VARCHAR(50)  NOT NULL,
    institution           VARCHAR(150) NOT NULL,
    department            VARCHAR(100),
    year_of_study         INTEGER,
    phone_number          VARCHAR(20),
    verification_status   VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending | Approved | Rejected
    verified_at           TIMESTAMP,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id)
);

-- ---------- cafes ----------
-- Referenced in: cafe.routes.js
CREATE TABLE cafes (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    description    TEXT,
    location       VARCHAR(150) NOT NULL,
    contact_phone  VARCHAR(20),
    is_active      BOOLEAN NOT NULL DEFAULT true,
    deleted_at     TIMESTAMP,
    deleted_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- cafe_users ----------
-- Staff/owners assigned to a cafe. Referenced in: cafe.routes.js
CREATE TABLE cafe_users (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cafe_id       INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    position      VARCHAR(50), -- e.g. 'Owner', 'Staff'
    hired_date    DATE,
    UNIQUE (user_id, cafe_id)
);

-- ---------- menu_items ----------
-- Referenced in: menu.routes.js, cart.routes.js, order.routes.js
CREATE TABLE menu_items (
    id                SERIAL PRIMARY KEY,
    cafe_id           INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name              VARCHAR(150) NOT NULL,
    description       TEXT,
    price             NUMERIC(10, 2) NOT NULL,
    category          VARCHAR(50),
    preparation_time  INTEGER, -- minutes
    image_url         TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'Available', -- Available | Unavailable
    deleted_at        TIMESTAMP,
    deleted_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- carts ----------
-- One active cart per student. Referenced in: cart.routes.js
CREATE TABLE carts (
    id            SERIAL PRIMARY KEY,
    student_id    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id)
);

-- ---------- cart_items ----------
-- Referenced in: cart.routes.js
CREATE TABLE cart_items (
    id                SERIAL PRIMARY KEY,
    cart_id           INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id      INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity          INTEGER NOT NULL DEFAULT 1,
    unit_price        NUMERIC(10, 2) NOT NULL,
    customizations    TEXT,
    UNIQUE (cart_id, menu_item_id)
);

-- ---------- orders ----------
-- Referenced in: order.routes.js
CREATE TABLE orders (
    id                     SERIAL PRIMARY KEY,
    order_number           VARCHAR(20) UNIQUE, -- auto-filled by trigger below, e.g. ORD-000123
    student_id             INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    cafe_id                INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    total_amount           NUMERIC(10, 2) NOT NULL,
    item_count             INTEGER NOT NULL,
    payment_type           VARCHAR(20) NOT NULL, -- COD | ONLINE
    special_instructions   TEXT,
    order_status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        -- PENDING | CONFIRMED | PREPARING | READY | DELIVERED | CANCELLED
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Auto-generate a human-friendly order_number after insert
CREATE OR REPLACE FUNCTION set_order_number() RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION set_order_number();

-- ---------- order_items ----------
-- Referenced in: order.routes.js
CREATE TABLE order_items (
    id                SERIAL PRIMARY KEY,
    order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id      INTEGER NOT NULL REFERENCES menu_items(id),
    quantity          INTEGER NOT NULL,
    unit_price        NUMERIC(10, 2) NOT NULL,
    subtotal          NUMERIC(10, 2) NOT NULL,
    customizations    TEXT
);

-- ---------- payments ----------
-- Referenced in: order.routes.js (mock payment flow)
CREATE TABLE payments (
    id                SERIAL PRIMARY KEY,
    order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount            NUMERIC(10, 2) NOT NULL,
    payment_method    VARCHAR(20) NOT NULL, -- COD | ONLINE
    payment_status    VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending | Paid | Failed | Refunded
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (order_id)
);

-- ============================================================
-- Indexes for the lookups your routes do most often
-- ============================================================
CREATE INDEX idx_menu_items_cafe_id ON menu_items(cafe_id);
CREATE INDEX idx_menu_items_status ON menu_items(status);
CREATE INDEX idx_menu_items_deleted_at ON menu_items(deleted_at);
CREATE INDEX idx_users_password_reset_token_hash ON users(password_reset_token_hash);
CREATE INDEX idx_cafes_deleted_at ON cafes(deleted_at);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_orders_student_id ON orders(student_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ============================================================
-- Optional: a couple of sample rows to get started locally
-- ============================================================
INSERT INTO cafes (name, description, location, contact_phone, is_active) VALUES
    ('Main Campus Cafe', 'Coffee, snacks, and quick bites between classes', 'Main Building, Ground Floor', '+251911000000', true),
    ('Green Corner Cafeteria', 'Full meals, Ethiopian and international dishes', 'Student Center, 1st Floor', '+251911000001', true);

INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, status) VALUES
    (1, 'Macchiato', 'Ethiopian-style espresso macchiato', 25.00, 'Beverage', 5, 'Available'),
    (1, 'Sambusa (3 pcs)', 'Crispy fried sambusa with lentil filling', 35.00, 'Snack', 10, 'Available'),
    (2, 'Shiro with Injera', 'Classic Ethiopian shiro wot served with injera', 90.00, 'Meal', 20, 'Available'),
    (2, 'Pasta Bolognese', 'Pasta with a rich meat sauce', 120.00, 'Meal', 20, 'Available');







-- ============================================================
-- Create Admin User (password: Admin123)
-- ============================================================
INSERT INTO users (username, email, password_hash, phone, role) 
VALUES (
    'admin_user',
    'admin@campuscrave.com',
    '$2b$10$BqfF8HjGJjFJ8JjFJ8JjF.8JjFJ8JjFJ8JjFJ8',  -- Admin123
    '0911000000',
    'admin'
);

-- ============================================================
-- Create Student User (password: Student123)
-- ============================================================
INSERT INTO users (username, email, password_hash, phone, role) 
VALUES (
    'student_user',
    'student@campuscrave.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mr',  -- Student123
    '0911111111',
    'student'
);

-- ============================================================
-- Create Student Profile for the student user
-- ============================================================
INSERT INTO students (user_id, full_name, reg_no, institution, department, year_of_study, phone_number, verification_status)
VALUES (
    (SELECT id FROM users WHERE email = 'student@campuscrave.com'),
    'Test Student',
    'STU/001/23',
    'Campus University',
    'Computer Science',
    3,
    '0911111111',
    'Approved'
);

-- ============================================================
-- Create Cafe Owner User (password: Owner123)
-- ============================================================
INSERT INTO users (username, email, password_hash, phone, role) 
VALUES (
    'owner_user',
    'owner@campuscrave.com',
    '$2b$10$CqfF8HjGJjFJ8JjFJ8JjF.8JjFJ8JjFJ8JjFJ8',  -- Owner123
    '0911222222',
    'owner'
);

-- ============================================================
-- Assign Owner to a Cafe (e.g., cafe_id = 1)
-- ============================================================
INSERT INTO cafe_users (user_id, cafe_id, position, hired_date)
VALUES (
    (SELECT id FROM users WHERE email = 'owner@campuscrave.com'),
    1,
    'Owner',
    CURRENT_DATE
);

-- ============================================================
-- Create Delivery User (password: Delivery123)
-- ============================================================
INSERT INTO users (username, email, password_hash, phone, role) 
VALUES (
    'delivery_user',
    'delivery@campuscrave.com',
    '$2b$10$DqfF8HjGJjFJ8JjFJ8JjF.8JjFJ8JjFJ8JjFJ8',  -- Delivery123
    '0911333333',
    'delivery'
);

-- ============================================================
-- Verify all users
-- ============================================================
SELECT id, username, email, role FROM users;











-- ============================================================
-- INSERT SAMPLE DATA FOR ALL TABLES
-- Run this after creating the schema
-- ============================================================

-- ============================================================
-- 1. USERS (with bcrypt hashed passwords)
-- Passwords: 
--   admin: Admin123
--   student: Student123  
--   owner: Owner123
--   delivery: Delivery123
--   staff: Staff123
-- ============================================================
INSERT INTO users (username, email, password_hash, phone, role) VALUES 
('admin', 'admin@campuscrave.com', '$2b$10$BqfF8HjGJjFJ8JjFJ8JjF.8JjFJ8JjFJ8JjFJ8', '0911000000', 'admin'),
('student1', 'student1@test.com', '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mr', '0911111111', 'student'),
('student2', 'student2@test.com', '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mr', '0911111112', 'student'),
('owner', 'owner@campuscrave.com', '$2b$10$CqfF8HjGJjFJ8JjFJ8JjF.8JjFJ8JjFJ8JjFJ8', '0911222222', 'owner'),
('delivery', 'delivery@campuscrave.com', '$2b$10$DqfF8HjGJjFJ8JjFJ8JjF.8JjFJ8JjFJ8JjFJ8', '0911333333', 'delivery'),
('staff', 'staff@campuscrave.com', '$2b$10$E.qfF8HjGJjFJ8JjFJ8JjF.8JjFJ8JjFJ8JjFJ8', '0911444444', 'staff');

-- ============================================================
-- 2. STUDENTS (linked to users)
-- ============================================================
INSERT INTO students (user_id, full_name, reg_no, institution, department, year_of_study, phone_number, verification_status) VALUES 
((SELECT id FROM users WHERE username = 'student1'), 'Kibru Misganaw', 'CST/072/12', 'Addis Ababa University', 'Computer Science', 3, '0911111111', 'Approved'),
((SELECT id FROM users WHERE username = 'student2'), 'Nebyu Samuel', 'CST/087/12', 'Addis Ababa University', 'Software Engineering', 3, '0911111112', 'Approved');

-- ============================================================
-- 3. CAFES
-- ============================================================
INSERT INTO cafes (name, description, location, contact_phone, is_active) VALUES 
('Main Campus Cafe', 'Fresh meals and coffee daily', 'Student Center Building, Ground Floor', '0911000001', true),
('Library Coffee Shop', 'Quick bites and coffee near the library', 'Library Complex, 1st Floor', '0911000002', true),
('Science Block Canteen', 'Healthy meals for science students', 'Science Block, Building B', '0911000003', true),
('Business School Cafe', 'Premium coffee and meeting space', 'Business School, 2nd Floor', '0911000004', true),
('Engineering Cafeteria', 'Hearty meals for engineering students', 'Engineering Block, Ground Floor', '0911000005', true),
('Medical School Cafe', 'Fresh meals near the hospital', 'Medical Campus, Block C', '0911000006', true);

-- ============================================================
-- 4. CAFE USERS (Link owners/staff to cafes)
-- ============================================================
INSERT INTO cafe_users (user_id, cafe_id, position, hired_date) VALUES 
((SELECT id FROM users WHERE username = 'owner'), 1, 'Owner', '2024-01-01'),
((SELECT id FROM users WHERE username = 'owner'), 2, 'Owner', '2024-01-01'),
((SELECT id FROM users WHERE username = 'staff'), 1, 'Staff', '2024-06-01'),
((SELECT id FROM users WHERE username = 'staff'), 2, 'Staff', '2024-06-01');

-- ============================================================
-- 5. MENU ITEMS (for each cafe)
-- ============================================================
-- Main Campus Cafe (cafe_id = 1)
INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, status) VALUES 
(1, 'Espresso', 'Strong dark coffee shot', 25.00, 'Coffee', 3, 'Available'),
(1, 'Cappuccino', 'Espresso with steamed milk foam', 35.00, 'Coffee', 5, 'Available'),
(1, 'Latte', 'Espresso with steamed milk', 40.00, 'Coffee', 5, 'Available'),
(1, 'Americano', 'Espresso with hot water', 30.00, 'Coffee', 3, 'Available'),
(1, 'Club Sandwich', 'Chicken, bacon, lettuce, tomato', 65.00, 'Sandwiches', 10, 'Available'),
(1, 'Tuna Sandwich', 'Tuna salad with lettuce', 60.00, 'Sandwiches', 8, 'Available'),
(1, 'Cheeseburger', 'Beef patty with cheese', 80.00, 'Burgers', 12, 'Available'),
(1, 'Chicken Burger', 'Grilled chicken burger', 85.00, 'Burgers', 12, 'Available'),
(1, 'French Fries', 'Crispy potato fries', 35.00, 'Sides', 8, 'Available'),
(1, 'Chocolate Cake', 'Rich chocolate cake slice', 45.00, 'Desserts', 5, 'Available');

-- Library Coffee Shop (cafe_id = 2)
INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, status) VALUES 
(2, 'Espresso', 'Single shot espresso', 20.00, 'Coffee', 3, 'Available'),
(2, 'Cappuccino', 'Classic cappuccino', 35.00, 'Coffee', 5, 'Available'),
(2, 'Caramel Macchiato', 'Vanilla latte with caramel', 48.00, 'Coffee', 6, 'Available'),
(2, 'Hot Chocolate', 'Rich hot chocolate', 40.00, 'Beverages', 4, 'Available'),
(2, 'Green Tea', 'Japanese green tea', 25.00, 'Tea', 3, 'Available'),
(2, 'Croissant', 'Butter croissant', 30.00, 'Pastries', 3, 'Available'),
(2, 'Chocolate Croissant', 'Chocolate filled croissant', 38.00, 'Pastries', 3, 'Available'),
(2, 'Blueberry Muffin', 'Fresh blueberry muffin', 35.00, 'Pastries', 3, 'Available'),
(2, 'Chocolate Chip Cookie', 'Soft cookie', 15.00, 'Pastries', 2, 'Available');

-- Science Block Canteen (cafe_id = 3)
INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, status) VALUES 
(3, 'Rice with Chicken', 'Steamed rice with grilled chicken', 70.00, 'Main Dishes', 15, 'Available'),
(3, 'Rice with Beef', 'Steamed rice with beef stew', 75.00, 'Main Dishes', 15, 'Available'),
(3, 'Pasta with Tomato Sauce', 'Pasta in tomato sauce', 55.00, 'Main Dishes', 12, 'Available'),
(3, 'Lentil Soup', 'Healthy lentil soup', 35.00, 'Soups', 8, 'Available'),
(3, 'Injera with Shiro', 'Traditional injera with chickpea stew', 50.00, 'Ethiopian', 10, 'Available'),
(3, 'Injera with Misir Wot', 'Injera with red lentil stew', 55.00, 'Ethiopian', 10, 'Available'),
(3, 'Vegetarian Combo', 'Mix of vegetarian dishes with injera', 65.00, 'Ethiopian', 12, 'Available'),
(3, 'Tea', 'Ethiopian tea', 10.00, 'Beverages', 3, 'Available');

-- Business School Cafe (cafe_id = 4)
INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, status) VALUES 
(4, 'Specialty Latte', 'Premium latte with art', 55.00, 'Coffee', 6, 'Available'),
(4, 'Cold Brew', 'Slow-brewed iced coffee', 45.00, 'Coffee', 3, 'Available'),
(4, 'Iced Caramel Latte', 'Cold latte with caramel', 50.00, 'Coffee', 5, 'Available'),
(4, 'Chicken Wrap', 'Grilled chicken wrap', 75.00, 'Meals', 10, 'Available'),
(4, 'Greek Salad', 'Feta, olives, cucumber, tomato', 65.00, 'Salads', 7, 'Available'),
(4, 'Toast with Avocado', 'Sourdough toast with avocado', 70.00, 'Light Meals', 8, 'Available'),
(4, 'Tiramisu', 'Italian coffee dessert', 65.00, 'Desserts', 5, 'Available');

-- Engineering Cafeteria (cafe_id = 5)
INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, status) VALUES 
(5, 'Espresso', 'Strong coffee', 25.00, 'Coffee', 3, 'Available'),
(5, 'Full Breakfast', 'Eggs, toast, coffee', 85.00, 'Breakfast', 10, 'Available'),
(5, 'Lunch Special', 'Rice, meat, salad', 95.00, 'Lunch', 15, 'Available'),
(5, 'Chicken Sandwich', 'Grilled chicken sandwich', 60.00, 'Sandwiches', 8, 'Available'),
(5, 'Cheeseburger', 'Beef patty with cheese', 80.00, 'Burgers', 12, 'Available'),
(5, 'French Fries', 'Crispy potato fries', 30.00, 'Sides', 8, 'Available'),
(5, 'Fresh Juice', 'Fresh orange juice', 35.00, 'Beverages', 3, 'Available');

-- Medical School Cafe (cafe_id = 6)
INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, status) VALUES 
(6, 'Espresso', 'Strong coffee', 25.00, 'Coffee', 3, 'Available'),
(6, 'Healthy Salad', 'Mixed greens with chicken', 70.00, 'Salads', 7, 'Available'),
(6, 'Fruit Bowl', 'Mixed seasonal fruits', 45.00, 'Healthy', 4, 'Available'),
(6, 'Smoothie', 'Yogurt and fruit smoothie', 50.00, 'Beverages', 4, 'Available'),
(6, 'Sandwich Platter', 'Assorted sandwiches', 65.00, 'Sandwiches', 8, 'Available');

-- ============================================================
-- 6. CARTS (one per student)
-- ============================================================
INSERT INTO carts (student_id) VALUES 
((SELECT id FROM students WHERE reg_no = 'CST/072/12')),
((SELECT id FROM students WHERE reg_no = 'CST/087/12'));

-- ============================================================
-- 7. CART ITEMS
-- ============================================================
-- Cart 1 items
INSERT INTO cart_items (cart_id, menu_item_id, quantity, unit_price, customizations) VALUES 
(1, 1, 2, 25.00, 'Extra strong'),
(1, 5, 1, 65.00, 'No mayo');

-- Cart 2 items
INSERT INTO cart_items (cart_id, menu_item_id, quantity, unit_price, customizations) VALUES 
(2, 11, 1, 20.00, NULL),
(2, 14, 2, 30.00, 'Extra chocolate');

-- ============================================================
-- 8. ORDERS
-- ============================================================
INSERT INTO orders (order_number, student_id, cafe_id, total_amount, item_count, payment_type, order_status, special_instructions) VALUES 
('ORD-000001', (SELECT id FROM students WHERE reg_no = 'CST/072/12'), 1, 120.00, 3, 'COD', 'DELIVERED', 'Extra napkins please'),
('ORD-000002', (SELECT id FROM students WHERE reg_no = 'CST/087/12'), 2, 118.00, 3, 'ONLINE', 'DELIVERED', NULL),
('ORD-000003', (SELECT id FROM students WHERE reg_no = 'CST/072/12'), 3, 160.00, 4, 'ONLINE', 'PREPARING', 'Spicy please'),
('ORD-000004', (SELECT id FROM students WHERE reg_no = 'CST/087/12'), 4, 130.00, 2, 'COD', 'READY', NULL);

-- ============================================================
-- 9. ORDER ITEMS
-- ============================================================
-- Order 1 items
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, customizations) VALUES 
(1, 2, 1, 35.00, 35.00, 'Less sugar'),
(1, 5, 1, 65.00, 65.00, 'No mayo'),
(1, 9, 1, 20.00, 20.00, NULL);

-- Order 2 items
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, customizations) VALUES 
(2, 11, 1, 20.00, 20.00, NULL),
(2, 14, 2, 30.00, 60.00, NULL),
(2, 17, 1, 38.00, 38.00, 'Extra chocolate');

-- Order 3 items
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, customizations) VALUES 
(3, 25, 1, 70.00, 70.00, 'Extra spicy'),
(3, 27, 1, 55.00, 55.00, NULL),
(3, 31, 1, 20.00, 20.00, NULL),
(3, 32, 1, 15.00, 15.00, NULL);

-- Order 4 items
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, customizations) VALUES 
(4, 37, 1, 55.00, 55.00, 'No foam'),
(4, 39, 1, 75.00, 75.00, 'Add bacon');

-- ============================================================
-- 10. PAYMENTS
-- ============================================================
INSERT INTO payments (order_id, amount, payment_method, payment_status) VALUES 
(1, 120.00, 'COD', 'Paid'),
(2, 118.00, 'ONLINE', 'Paid'),
(3, 160.00, 'ONLINE', 'Pending'),
(4, 130.00, 'COD', 'Pending');

-- ============================================================
-- 11. DELIVERIES
-- ============================================================
INSERT INTO deliveries (order_id, delivery_person_id, assigned_by, status, delivery_address) VALUES 
(1, (SELECT id FROM users WHERE username = 'delivery'), (SELECT id FROM users WHERE username = 'admin'), 'DELIVERED', 'Dorm Block A, Room 101'),
(2, (SELECT id FROM users WHERE username = 'delivery'), (SELECT id FROM users WHERE username = 'admin'), 'DELIVERED', 'Library Area, Study Room 3'),
(4, (SELECT id FROM users WHERE username = 'delivery'), (SELECT id FROM users WHERE username = 'admin'), 'ASSIGNED', 'Business School, Room 201');

-- ============================================================
-- 12. VERIFY ALL DATA
-- ============================================================
SELECT '=== USERS ===' as Section;
SELECT id, username, email, role FROM users;

SELECT '=== STUDENTS ===' as Section;
SELECT s.id, s.full_name, s.reg_no, s.verification_status, u.email 
FROM students s JOIN users u ON s.user_id = u.id;

SELECT '=== CAFES ===' as Section;
SELECT id, name, location, is_active FROM cafes;

SELECT '=== MENU ITEMS ===' as Section;
SELECT COUNT(*) as total_menu_items FROM menu_items;

SELECT '=== ORDERS ===' as Section;
SELECT id, order_number, total_amount, order_status FROM orders;





select * from menu_items 
