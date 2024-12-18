const express = require('express');
const router = express.Router();
const eventRegistrationController = require('../controller/eventRegistration');
const {isLoggedIn, isAdmin}= require("../middleware.js");

router.post('/', eventRegistrationController.createRegistration);

router.get('/', eventRegistrationController.getAllRegistrations);
router.get('/:id', eventRegistrationController.getRegistrationById);
router.put('/:id', eventRegistrationController.updateRegistration);
router.delete('/:id', eventRegistrationController.deleteRegistration);

module.exports = router;