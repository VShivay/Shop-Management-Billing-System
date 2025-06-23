const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const apiRoutes = require('./routes/api');
const cors = require("cors");
const path = require('path');
app.use(cors());

app.use(express.static(path.join(__dirname, "../frontend")));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.use(express.json()); // parse JSON body
app.use('/api/auth', authRoutes);
//app.use('/api/dashboard', dashboardRoutes);

app.use('/api', apiRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
