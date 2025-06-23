-- Table for users (shop owners)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);
-- Table for customers
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile_no VARCHAR(15) UNIQUE
);
-- Table for products
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('piece', 'weight') NOT NULL,         -- product type (e.g., 'piece' or 'weight')
    cost_price DECIMAL(10,2) NOT NULL,             -- cost per unit
    retail_price DECIMAL(10,2) NOT NULL,           -- price for retail customers
    wholesale_price DECIMAL(10,2) NOT NULL,        -- price for wholesale customers
    quantity DECIMAL(10,2) NOT NULL,               -- stock quantity
    unit VARCHAR(10),                              -- e.g., 'pcs', 'kg', 'g', 'lbs'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Table for bills
CREATE TABLE bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_type ENUM('retail', 'wholesale') NOT NULL, -- type of bill
    customer_id INT NULL,                         -- NULL for retail bills
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    due_amount DECIMAL(10,2) NOT NULL,
    bill_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    bill_time TIME NOT NULL DEFAULT (CURRENT_TIME),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
-- Table for individual items within a bill
CREATE TABLE bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
-- Table to track outstanding dues for customers (primarily wholesale)
CREATE TABLE customer_dues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL UNIQUE,                -- UNIQUE constraint ensures one due entry per customer
    total_due DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
-- Table to log financial transactions (e.g., payments against dues)
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
-- Table for system activity logs
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,              -- e.g., 'login', 'add_product', 'update_product', 'create_bill', 'payment'
    action_description TEXT,                       -- human-readable description of the action
    related_table VARCHAR(50),                     -- optional: table affected (e.g., 'products', 'bills')
    related_id INT,                                -- optional: ID of affected record
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE customers
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
