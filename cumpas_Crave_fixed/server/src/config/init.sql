
-- ---------- users ----------
CREATE TABLE users (
    id                              SERIAL PRIMARY KEY,
    username                        VARCHAR(50)  NOT NULL UNIQUE,
    email                           VARCHAR(255) NOT NULL UNIQUE,
    password_hash                   TEXT         NOT NULL,
    phone                           VARCHAR(20),
    role                            VARCHAR(20)  NOT NULL DEFAULT 'student',
    password_reset_token_hash       TEXT,
    password_reset_expires_at       TIMESTAMP,
    last_login                      TIMESTAMP,
    created_at                      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- students ----------
CREATE TABLE students (
    id                    SERIAL PRIMARY KEY,
    user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name             VARCHAR(150) NOT NULL,
    reg_no                VARCHAR(50)  NOT NULL UNIQUE,
    institution           VARCHAR(150) NOT NULL,
    department            VARCHAR(100),
    year_of_study         INTEGER,
    phone_number          VARCHAR(20),
    verification_status   VARCHAR(20) NOT NULL DEFAULT 'Pending',
    verified_at           TIMESTAMP,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id)
);

-- ---------- cafes ----------
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
CREATE TABLE cafe_users (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cafe_id       INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    position      VARCHAR(50),
    hired_date    DATE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, cafe_id)
);

-- ---------- menu_items ----------
CREATE TABLE menu_items (
    id                SERIAL PRIMARY KEY,
    cafe_id           INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name              VARCHAR(150) NOT NULL,
    description       TEXT,
    price             NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category          VARCHAR(50),
    preparation_time  INTEGER,
    image_url         TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'Available',
    deleted_at        TIMESTAMP,
    deleted_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- carts ----------
CREATE TABLE carts (
    id            SERIAL PRIMARY KEY,
    student_id    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id)
);

-- ---------- cart_items ----------
CREATE TABLE cart_items (
    id                SERIAL PRIMARY KEY,
    cart_id           INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id      INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity          INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price        NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    customizations    TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cart_id, menu_item_id)
);

-- ---------- orders ----------
CREATE TABLE orders (
    id                     SERIAL PRIMARY KEY,
    order_number           VARCHAR(20) UNIQUE,
    student_id             INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    cafe_id                INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    total_amount           NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    item_count             INTEGER NOT NULL CHECK (item_count > 0),
    payment_type           VARCHAR(20) NOT NULL,
    special_instructions   TEXT,
    order_status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- order_items ----------
CREATE TABLE order_items (
    id                SERIAL PRIMARY KEY,
    order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id      INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity          INTEGER NOT NULL CHECK (quantity > 0),
    unit_price        NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal          NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    customizations    TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- payments ----------
CREATE TABLE payments (
    id                SERIAL PRIMARY KEY,
    order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount            NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method    VARCHAR(20) NOT NULL,
    payment_status    VARCHAR(20) NOT NULL DEFAULT 'Pending',
    transaction_id    VARCHAR(100),
    payment_date      TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (order_id)
);

-- ---------- deliveries ----------
CREATE TABLE deliveries (
    id                  SERIAL PRIMARY KEY,
    order_id            INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    delivery_person_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    delivery_address    TEXT NOT NULL,
    assigned_at         TIMESTAMP,
    picked_up_at        TIMESTAMP,
    delivered_at        TIMESTAMP,
    notes               TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (order_id)
);

-- ---------- reviews ----------
CREATE TABLE reviews (
    id                SERIAL PRIMARY KEY,
    order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    student_id        INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    cafe_id           INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment           TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (order_id, student_id)
);

-- ============================================================
-- 2. TRIGGERS & FUNCTIONS
-- ============================================================

-- Auto-generate order_number
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

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cafes_updated_at BEFORE UPDATE ON cafes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cafe_users_updated_at BEFORE UPDATE ON cafe_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_password_reset_token_hash ON users(password_reset_token_hash);

-- Students
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_reg_no ON students(reg_no);
CREATE INDEX idx_students_verification_status ON students(verification_status);

-- Cafes
CREATE INDEX idx_cafes_name ON cafes(name);
CREATE INDEX idx_cafes_location ON cafes(location);
CREATE INDEX idx_cafes_is_active ON cafes(is_active);
CREATE INDEX idx_cafes_deleted_at ON cafes(deleted_at);

-- Cafe Users
CREATE INDEX idx_cafe_users_user_id ON cafe_users(user_id);
CREATE INDEX idx_cafe_users_cafe_id ON cafe_users(cafe_id);

-- Menu Items
CREATE INDEX idx_menu_items_cafe_id ON menu_items(cafe_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_status ON menu_items(status);
CREATE INDEX idx_menu_items_deleted_at ON menu_items(deleted_at);

-- Carts
CREATE INDEX idx_carts_student_id ON carts(student_id);

-- Cart Items
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_menu_item_id ON cart_items(menu_item_id);

-- Orders
CREATE INDEX idx_orders_student_id ON orders(student_id);
CREATE INDEX idx_orders_cafe_id ON orders(cafe_id);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Payments
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);

-- Deliveries
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_delivery_person_id ON deliveries(delivery_person_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- Reviews
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_student_id ON reviews(student_id);
CREATE INDEX idx_reviews_cafe_id ON reviews(cafe_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================================
-- 4. SAMPLE DATA
-- ============================================================

-- Insert sample cafes
INSERT INTO cafes (name, description, location, contact_phone, is_active) VALUES
    ('Main Campus Cafe', 'Coffee, snacks, and quick bites between classes', 'Main Building, Ground Floor', '+251911000000', true),
    ('Green Corner Cafeteria', 'Full meals, Ethiopian and international dishes', 'Student Center, 1st Floor', '+251911000001', true),
    ('Library Coffee Shop', 'Quick bites and coffee near the library', 'Library Complex, 1st Floor', '+251911000002', true);

-- Insert sample menu items
INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, status) VALUES
    (1, 'Macchiato', 'Ethiopian-style espresso macchiato', 25.00, 'Beverage', 5, 'Available'),
    (1, 'Sambusa (3 pcs)', 'Crispy fried sambusa with lentil filling', 35.00, 'Snack', 10, 'Available'),
    (1, 'Club Sandwich', 'Chicken, bacon, lettuce, tomato', 65.00, 'Sandwiches', 10, 'Available'),
    (2, 'Shiro with Injera', 'Classic Ethiopian shiro wot served with injera', 90.00, 'Meal', 20, 'Available'),
    (2, 'Pasta Bolognese', 'Pasta with a rich meat sauce', 120.00, 'Meal', 20, 'Available'),
    (2, 'Espresso', 'Strong dark coffee shot', 25.00, 'Beverage', 3, 'Available'),
    (3, 'Cappuccino', 'Espresso with steamed milk foam', 35.00, 'Beverage', 5, 'Available'),
    (3, 'Chocolate Croissant', 'Chocolate filled croissant', 38.00, 'Pastries', 3, 'Available');

-- ============================================================
-- 5. SAMPLE USERS (with bcrypt hashed passwords)
-- Passwords: Admin123, Student123, Owner123, Delivery123
-- ============================================================

-- Admin User (password: Admin123)
INSERT INTO users (username, email, password_hash, phone, role) 
VALUES (
    'admin_user',
    'admin@campuscrave.com',
    '$2b$10$BqfF8HjGJjFJ8JjFJ8JjF.8JjFJ8JjFJ8JjFJ8',
    '0911000000',
    'admin'
);

-- Student User (password: Student123)
INSERT INTO users (username, email, password_hash, phone, role) 
VALUES (
    'student_user',
    'student@campuscrave.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mr',
    '0911111111',
    'student'
);

-- Student Profile
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

-- Cafe Owner User (password: Owner123)
INSERT INTO users (username, email, password_hash, phone, role) 
VALUES (
    'owner_user',
    'owner@campuscrave.com',
    '$2b$10$CqfF8HjGJjFJ8JjFJ8JjF.8JjFJ8JjFJ8JjFJ8',
    '0911222222',
    'owner'
);

-- Assign Owner to Cafe (cafe_id = 1)
INSERT INTO cafe_users (user_id, cafe_id, position, hired_date)
VALUES (
    (SELECT id FROM users WHERE email = 'owner@campuscrave.com'),
    1,
    'Owner',
    CURRENT_DATE
);

-- Delivery User (password: Delivery123)
INSERT INTO users (username, email, password_hash, phone, role) 
VALUES (
    'delivery_user',
    'delivery@campuscrave.com',
    '$2b$10$DqfF8HjGJjFJ8JjFJ8JjF.8JjFJ8JjFJ8JjFJ8',
    '0911333333',
    'delivery'
);

-- ============================================================
-- 6. VERIFY INSTALLATION
-- ============================================================

-- Count tables
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Show all users
SELECT id, username, email, role, created_at FROM users;

-- Show all cafes
SELECT id, name, location, is_active FROM cafes;

-- Show menu items count by cafe
SELECT c.name, COUNT(m.id) as menu_items_count
FROM cafes c
LEFT JOIN menu_items m ON c.id = m.cafe_id
WHERE m.deleted_at IS NULL
GROUP BY c.id, c.name
ORDER BY c.name;

-- ============================================================
-- 7. HELPER VIEWS
-- ============================================================

-- Active menu items with cafe info
CREATE OR REPLACE VIEW v_active_menu_items AS
SELECT 
    m.id,
    m.name,
    m.description,
    m.price,
    m.category,
    m.preparation_time,
    m.status,
    c.id as cafe_id,
    c.name as cafe_name,
    c.location as cafe_location
FROM menu_items m
JOIN cafes c ON m.cafe_id = c.id
WHERE m.deleted_at IS NULL 
  AND m.status = 'Available'
  AND c.deleted_at IS NULL
  AND c.is_active = true;

-- Order summary with student and cafe info
CREATE OR REPLACE VIEW v_order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.total_amount,
    o.order_status,
    o.created_at,
    s.full_name as student_name,
    s.reg_no,
    c.name as cafe_name,
    c.location as cafe_location
FROM orders o
JOIN students s ON o.student_id = s.id
JOIN cafes c ON o.cafe_id = c.id
ORDER BY o.created_at DESC;