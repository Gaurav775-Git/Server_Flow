const express = require("express");
const router = express.Router();

const {
	createProject,
	getProjects,
	getProject,
	updateProject,
	deleteProject,
} = require("../controllers/projectController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.use(verifyToken);
router.post("/createProject", createProject);
router.post("/getProjects", getProjects);
router.get("/", getProjects);
router.get("/:id", getProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);

module.exports = router;