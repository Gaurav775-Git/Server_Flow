// const express = require("express");
// const router = express.Router();

// // const getusers = require('../controllers/authController');
// // const adduser = require('../controllers/userController');

// // router.get('/show',getusers);
// // router.get('/add', adduser);

// // module.exports = router;
const express = require("express");
const { updateProfile, updatePassword } = require("../controllers/userController");
const { verifyToken } = require("../middlewares/authMiddleware"); // Updated import

const router = express.Router();

// Protected profile update endpoints
router.put("/me", verifyToken, updateProfile);
router.put("/me/password", verifyToken, updatePassword);

module.exports = router;