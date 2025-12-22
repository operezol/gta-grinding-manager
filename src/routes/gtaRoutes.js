const express = require('express');
const router = express.Router();
const gtaController = require('../controllers/gtaController');

// Get all activities
router.get('/activities', gtaController.getAllActivities);

// Get specific activity
router.get('/activities/:id', gtaController.getActivity);

// Create/update/delete activity
router.post('/activities', gtaController.createActivity);
router.put('/activities/:id', gtaController.updateActivity);
router.delete('/activities/:id', gtaController.deleteActivity);

// Get stats for all activities
router.get('/stats', gtaController.getAllStats);

// Get stats for specific activity
router.get('/stats/:id', gtaController.getActivityStats);

// Create session
router.post('/sessions', gtaController.createSession);

// Update session (end session)
router.put('/sessions/:id', gtaController.updateSession);

// Get recent sessions
router.get('/sessions', gtaController.getRecentSessions);

// Cooldown management
router.post('/cooldowns', gtaController.startCooldown);
router.get('/cooldowns', gtaController.getActiveCooldowns);
router.delete('/cooldowns/:id', gtaController.clearCooldown);

// Resupply management
router.post('/resupply', gtaController.startResupply);
router.get('/resupply', gtaController.getActiveResupply);
router.delete('/resupply/:id', gtaController.clearResupply);

// Production state management
router.get('/production', gtaController.getAllProduction);
router.get('/production/:id', gtaController.getProduction);
router.post('/production', gtaController.updateProduction);
router.delete('/production/:id', gtaController.clearProduction);

// Sell sessions management
router.post('/sell-sessions', gtaController.createSellSession);
router.put('/sell-sessions/:id', gtaController.updateSellSession);
router.get('/sell-sessions', gtaController.getActiveSellSessions);

// Safe collections management
router.post('/safes/collect/:activityId', gtaController.collectSafe);
router.get('/safes/collections', gtaController.getLastCollections);

// Stats management
router.delete('/stats/:id', gtaController.resetActivityStats);
router.delete('/stats', gtaController.resetAllActivityStats);

// Imports
router.post('/import/wiki/category', gtaController.importWikiCategory);
router.post('/import/wiki/categories/search', gtaController.searchWikiCategories);
router.post('/import/wiki/pages/search', gtaController.searchWikiPages);
router.post('/import/wiki/page/sections', gtaController.listWikiPageSections);
router.post('/import/wiki/page-section', gtaController.importWikiPageSection);
router.post('/import/wiki/page-sections', gtaController.importWikiPageSections);

// Bulk operations
router.post('/bulk/activities', gtaController.bulkCreateActivities);
router.post('/bulk/sessions', gtaController.bulkCreateSessions);

module.exports = router;