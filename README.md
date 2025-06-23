🛍️ Shop Management & Billing System
📘 Description
This is a device-specific shop billing and management system tailored for retail and wholesale businesses. The application allows shop owners to login, generate bills for retail or wholesale transactions, manage products, customers, and track sales with custom reports (daily, monthly, yearly).

Supports piece-based and weight-based products.
Built using HTML/CSS (frontend), Node.js + Express (backend), and MySQL (XAMPP) for the database.

📁 Project Structure
csharp
Copy
Edit
shop-billing-system/
│
├── public/                 # Frontend (HTML + CSS)
│   ├── index.html
│   └── styles.css
│
├── routes/                 # Express Route Handlers
│   ├── authRoutes.js
│   ├── billRoutes.js
│   ├── productRoutes.js
│   ├── customerRoutes.js
│   └── dashboardRoutes.js
│
├── controllers/            # Controller Logic
│   ├── authController.js
│   ├── billController.js
│   ├── productController.js
│   ├── customerController.js
│   └── dashboardController.js
│
├── db/                     # MySQL Database Connection
│   └── config.js
│
├── middleware/
│   └── authMiddleware.js
│
├── views/                  # EJS templates (optional for rendering)
│
├── app.js                  # Entry Point
└── README.md               # Project Overview
🧰 Technologies
Frontend: HTML5, CSS3

Backend: Node.js, Express.js

Database: MySQL (via XAMPP)

Auth: Session-based Login (can be upgraded to JWT)

Reporting: Sales Tracking, Dues, Customer Insights

🛠️ Installation & Setup
1. Clone the repository
bash
Copy
Edit
git clone https://github.com/yourusername/shop-billing-system.git
cd shop-billing-system
2. Install backend dependencies
bash
Copy
Edit
npm install
3. Configure MySQL
Start XAMPP, enable MySQL and Apache

Create a database named: shop_db

Import the SQL schema (provided below) via phpMyAdmin or CLI

4. Add .env file
env
Copy
Edit
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=shop_db
SESSION_SECRET=yourSecretKey
5. Run the server
bash
Copy
Edit
npm start
🔐 Login Details
Login Page: /login

Only shop owners can log in and access the billing system.

💳 Billing Features
Retail Billing
No customer required

Product selection → retail price applied → bill created

Bill stored automatically

Wholesale Billing
Requires selecting existing or new customer (by name/mobile)

Wholesale price applied

Track partial payments (dues)

View all bills per customer

Show payment summary:

e.g. Bill: ₹1500, Paid: ₹1300, Due: ₹200

📊 Dashboard Features
Sales Summary (Retail & Wholesale)

Filter by Day, Month, Year

Daily Revenue Report

Total Dues by Customer

Customer Management

Bill History

🧾 Database Schema
SQL setup for tables:

sql
Copy
Edit
-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Customers Table
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile_no VARCHAR(15) UNIQUE
);

-- Products Table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('piece', 'weight') NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    retail_price DECIMAL(10,2) NOT NULL,
    wholesale_price DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bills Table
CREATE TABLE bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_type ENUM('retail', 'wholesale') NOT NULL,
    customer_id INT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    due_amount DECIMAL(10,2) NOT NULL,
    bill_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    bill_time TIME NOT NULL DEFAULT (CURRENT_TIME),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Bill Items
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

-- Customer Dues
CREATE TABLE customer_dues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL UNIQUE,
    total_due DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Transactions
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Activity Logs
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT,
    related_table VARCHAR(50),
    related_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
📌 Upcoming Features
PDF Bill Export

Print Support

Role-based Access Control (Admin, Staff)

Chart Analytics (with Chart.js)

Product Low Stock Alerts

📬 Contact
For issues, suggestions, or collaborations:

📧 Email: [you@example.com]
🐙 GitHub: [github.com/yourusername]

© 2025 Shop Billing System. All rights reserved.

