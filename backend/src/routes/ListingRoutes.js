const express = require('express');
const router = express.Router();

const {
    getAllListings,
    getListingById,
    createListing
} = require('../controller/listingController');

router.route('/')
    .get(getAllListings)
    .post(createListing);

router.route('/:id')
    .get(getListingById);

module.exports = router;