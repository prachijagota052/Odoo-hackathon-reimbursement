const express = require('express');
const app = express();

app.use(express.json());

const ListingRoutes = require('./routes/ListingRoutes');
const expenseRoutes = require('./src/routes/expenses');

app.use('/api/listings', ListingRoutes);
app.use('/api/expenses', expenseRoutes);

const port = 3000;
app.listen(port, () => {
    console.log(`app listening on port: ${port}`);
});