    import express from 'express';
    import { showAllEvents, showEventBookingPage, showCreateEventPage, createEvent, showEditEventPage, updateEvent, deleteEvent, showMyEvents } from '../controller/eventController.js';
    import { isLoggedIn, isCreator, isCreatorOrAdmin, isNotBanned } from '../middlewares/authmiddleware.js';

    const router = express.Router();

    // Specific routes must come BEFORE parameterized routes
    // ഇവന്റ് ഉണ്ടാക്കാനുള്ള പേജ് കാണിക്കാൻ (GET)
    router.get('/create', isLoggedIn, isCreatorOrAdmin, isNotBanned, showCreateEventPage);

    // എന്റെ ഇവന്റുകൾ കാണിക്കാൻ (GET)
    router.get('/my-events', isLoggedIn, isNotBanned, showMyEvents);

    // എല്ലാ ഇവന്റുകളും കാണിക്കാൻ (GET)
    router.get('/', isLoggedIn, showAllEvents);

    // ഇവന്റ് ഉണ്ടാക്കാൻ (POST)
    router.post('/', isLoggedIn, isCreatorOrAdmin, isNotBanned, createEvent);

    // Parameterized routes come AFTER specific routes
    // ഇവന്റ് എഡിറ്റ് ചെയ്യാനുള്ള പേജ് കാണിക്കാൻ (GET)
    router.get('/:id/edit', isLoggedIn, isNotBanned, showEditEventPage);

    // ഇവന്റ് അപ്ഡേറ്റ് ചെയ്യാൻ (PUT)
    router.put('/:id', isLoggedIn, isNotBanned, updateEvent);

    // ഇവന്റ് ഡിലീറ്റ് ചെയ്യാൻ (DELETE)
    router.delete('/:id', isLoggedIn, isNotBanned, deleteEvent);

    // ഇവന്റ് ബുക്കിംഗ് പേജ് കാണിക്കാൻ (GET)
    router.get('/:id', isLoggedIn, showEventBookingPage);

    export default router;
    