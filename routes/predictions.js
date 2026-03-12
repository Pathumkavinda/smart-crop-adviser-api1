// routes/predictions.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/predictionController");

// CRUD
router.post("/", ctrl.createPrediction);
router.get("/", ctrl.getAllPredictions);
router.get("/:id", ctrl.getPredictionById);
router.put("/:id", ctrl.updatePrediction);
router.delete("/:id", ctrl.deletePrediction);

// Specials
router.get("/user/:userId", ctrl.getPredictionsByUserId);
router.get("/user/:userId/latest", ctrl.getLatestPredictionForUser);
router.get("/crop/:cropName", ctrl.getPredictionsByCrop);
router.get("/by-created/window", ctrl.getPredictionsByCreatedWindow);

module.exports = router;
