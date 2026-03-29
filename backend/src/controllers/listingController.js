const db = require('../config/db');

exports.getAllListings = async (req, res) => {
    try {
        const query = "Select * from listings";
        const [result] = await db.query(query);
        
        res.status(200).json({
            success: true,
            data: result 
        });
    } catch (err) {
        console.log("Error fetching listings");
        res.status(500).json({
            success: false,
            message: "Fetching data failed",
            error: err.message
        });
    }
}

exports.getListingById = async (req, res) => {
    try {
        const id = req.params.id; 
        const query = `Select * from listings where id = ?`;
        
        const [result] = await db.query(query, [id]); 
        
        res.status(200).json({
            success: true,
            data: result[0] 
        });

    } catch (err) {
        console.log("Error fetching listing");
        res.status(500).json({
            success: false,
            message: "Fetching data failed",
            error: err.message
        });
    }
}

exports.createListing = async (req, res) => {
    try {
        // Rectified: We MUST extract the variables from the incoming request body
        const { 
            user_id, title, description, price, location, 
            country, guests, bedrooms, bathrooms 
        } = req.body; 

        const query = `
            INSERT INTO listings 
            (user_id, title, description, price, location, country, guests, bedrooms, bathrooms) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Rectified: Added the absolutely crucial 'await' keyword here
        const [result] = await db.query(query, [
            user_id, title, description, price, location, 
            country, guests, bedrooms, bathrooms
        ]);

        res.status(201).json({ // 201 is standard for "Created"
            success: true,
            message: "Listing created",
            insertId: result.insertId // Good practice: return the new ID
        });
    } catch (err) {
        console.log("create listing failed.");
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}