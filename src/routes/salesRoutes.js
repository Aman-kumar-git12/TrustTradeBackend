const express = require('express');
const router = express.Router();
const { createSale, deleteSale } = require('../controllers/salesController');

router.post('/sales', createSale);
router.delete('/:id', deleteSale);

module.exports = router;
