const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMemory = require('../middleware/uploadMemory');

// Public routes
router.get('/', galleryController.getAllGalleries);
router.get('/:id', galleryController.getGalleryById);

// Protected routes (Admin only)
router.post('/', authMiddleware, uploadMemory.single('image'), galleryController.createGallery);
router.put('/:id', authMiddleware, uploadMemory.single('image'), galleryController.updateGallery);
router.delete('/:id', authMiddleware, galleryController.deleteGallery);

module.exports = router;
