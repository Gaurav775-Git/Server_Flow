const express = require('express');
const router = express.Router();

const getusers = require('../controllers/userController');
const adduser = require('../controllers/addUser');

router.get('/show',getusers);
router.get('/add', adduser);

module.exports = router;