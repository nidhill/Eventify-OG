import express from 'express';
import { proceedToPayment, confirmBooking, showTicket } from '../controller/bookingController.js';
import { isLoggedIn } from '../middlewares/authmiddleware.js';

const router = express.Router();

router.post('/proceed-to-payment', isLoggedIn, proceedToPayment);
router.post('/confirm', isLoggedIn, confirmBooking);
router.get('/ticket/:bookingId', isLoggedIn, showTicket);

export default router;