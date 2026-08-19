const express = require('express');
const router = express.Router();

const defaultRoutes = require('./default');
router.use('/default', defaultRoutes);

module.exports = router;