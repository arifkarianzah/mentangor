const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/stats',    authMiddleware, ctrl.getStats);
router.get('/hotspots', authMiddleware, ctrl.getHotspots);
router.get('/recent',   authMiddleware, ctrl.getRecentReports);

module.exports = router;
