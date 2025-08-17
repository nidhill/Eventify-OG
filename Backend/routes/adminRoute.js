import express from 'express';
import {
    showDashboard,
    manageUsers,
    banUser,
    unbanUser,
    manageEvents,
    deleteEvent
} from '../controller/adminController.js';
import { isLoggedIn, isAdmin } from '../middlewares/authmiddleware.js';

const router = express.Router();

// Admin routes
router.use(isLoggedIn, isAdmin); // Ee router-ile ellam routesinum ee middleware apply aakum

router.get('/dashboard', showDashboard);
router.get('/manage-users', manageUsers);
router.post('/users/ban/:id', banUser);
router.post('/users/unban/:id', unbanUser);
router.get('/manage-events', manageEvents);
router.post('/events/delete/:id', deleteEvent);

export default router;