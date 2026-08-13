const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMemory = require('../middleware/uploadMemory');

// Public routes
router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);

// Protected routes (Admin only)
router.post('/', authMiddleware, uploadMemory.single('image'), newsController.createNews);
router.put('/:id', authMiddleware, uploadMemory.single('image'), newsController.updateNews);
router.delete('/:id', authMiddleware, newsController.deleteNews);

module.exports = router;
