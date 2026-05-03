const express = require('express');
const router = express.Router();
const pyqsController = require('../controllers/pyqsController');

router.get('/info', pyqsController.getInfo);
router.post('/create-order', pyqsController.createOrder);
router.get('/check-access', pyqsController.checkAccess);

module.exports = router;
