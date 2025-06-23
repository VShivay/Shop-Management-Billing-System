
# 🛍️ Shop Management & Billing System

## 📘 Description

This is a device-specific **shop billing and management system** tailored for **retail and wholesale** businesses. The application allows **shop owners** to login, generate **bills** for **retail** or **wholesale** transactions, manage **products**, **customers**, and track **sales** with **custom reports** (daily, monthly, yearly).

> Supports **piece-based** and **weight-based** products.  
> Built using **HTML/CSS (frontend)**, **Node.js + Express (backend)**, and **MySQL (XAMPP)** for the database.

---

## 📁 Project Structure

```
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
```

---

## 🧰 Technologies

- **Frontend:** HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MySQL (via XAMPP)
- **Auth:** Session-based Login (can be upgraded to JWT)
- **Reporting:** Sales Tracking, Dues, Customer Insights

---

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/shop-billing-system.git
cd shop-billing-system
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure MySQL

- Start **XAMPP**, enable **MySQL** and **Apache**
- Create a database named: `shop_db`
- Import the SQL schema (provided below) via **phpMyAdmin** or CLI

### 4. Add `.env` file

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=shop_db
SESSION_SECRET=yourSecretKey
```

### 5. Run the server

```bash
npm start
```

---

## 🔐 Login Details

- **Login Page:** `/login`
- Only **shop owners** can log in and access the billing system.

---

## 💳 Billing Features

### Retail Billing

- No customer required
- Product selection → retail price applied → bill created
- Bill stored automatically

### Wholesale Billing

- Requires selecting **existing** or **new customer** (by name/mobile)
- Wholesale price applied
- Track **partial payments** (dues)
- View all bills per customer
- Show payment summary:  
  > e.g. Bill: ₹1500, Paid: ₹1300, Due: ₹200

---

## 📊 Dashboard Features

- Sales Summary (Retail & Wholesale)
- Filter by Day, Month, Year
- Daily Revenue Report
- Total Dues by Customer
- Customer Management
- Bill History

---

## 🧾 Database Schema

[Refer to the schema provided in the SQL section of this repository.]

---

## 📌 Upcoming Features

- PDF Bill Export
- Print Support
- Role-based Access Control (Admin, Staff)
- Chart Analytics (with Chart.js)
- Product Low Stock Alerts

---

## 📬 Contact

For issues, suggestions, or collaborations:

📧 Email: [you@example.com]  
🐙 GitHub: [github.com/yourusername]

---

> © 2025 Shop Billing System. All rights reserved.
