const express = require('express');
const router = express.Router();
const default_controller = require('../controllers/default.controller');
const { validate } = require('../middleware/validate');

router.post('/user/post', default_controller.handler);

router.get('/user/get', default_controller.handler);

module.exports = router;