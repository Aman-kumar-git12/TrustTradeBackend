const express = require('express');
const router = express.Router();
const { runFeaturedEventExpiryCron } = require('../controllers/cronController');

router.get('/featured-event-expiry', runFeaturedEventExpiryCron);

module.exports = router;
