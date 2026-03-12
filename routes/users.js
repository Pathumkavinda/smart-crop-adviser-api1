// routes/users.js
const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/userController");

// CRUD
router.post("/", userCtrl.createUser);
router.get("/", userCtrl.getAllUsers);
router.get("/:id", userCtrl.getUserById);
router.put("/:id", userCtrl.updateUser);
router.delete("/:id", userCtrl.deleteUser);


router.post("/login", userCtrl.loginUser);

module.exports = router;
