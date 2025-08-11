import Event from '../models/eventModel.js';

// എല്ലാ ഇവന്റുകളും കാണിക്കാൻ (ഫിൽട്ടർ ലോജിക്കോടുകൂടി)
export const showAllEvents = async (req, res) => {
    try {
        const { search, category, location } = req.query;
        const filterQuery = {};

        if (search) {
            filterQuery.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) {
            filterQuery.category = category;
        }
        if (location) {
            filterQuery.location = location;
        }

        const allEvents = await Event.find(filterQuery);
        
        res.render('events', { 
            events: allEvents, 
            user: req.user,
            query: req.query 
        });

    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).send('Error fetching events');
    }
};

// ഒരു പ്രത്യേക ഇവന്റിന്റെ വിവരങ്ങൾ കാണിക്കാൻ (പേര് മാറ്റിയിരിക്കുന്നു)
export const showEventBookingPage = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).send('Event not found');
        }
        // 'eventsDetails' എന്നതിന് പകരം 'eventBooking' എന്ന പേജ് റെൻഡർ ചെയ്യുന്നു
        res.render('eventBooking', { event: event, user: req.user });
    } catch (error) {
        console.error("Error fetching event details:", error);
        res.status(500).send('Server Error');
    }
};

// പുതിയ ഫംഗ്ഷൻ: ഇവന്റ് ഉണ്ടാക്കാനുള്ള പേജ് കാണിക്കാൻ
export const showCreateEventPage = async (req, res) => {
    try {
        console.log('Showing create event page for user:', req.user ? req.user.username : 'Not logged in');
        res.render('create-event', { 
            user: req.user,
            error: null 
        });
    } catch (error) {
        console.error("Error showing create event page:", error);
        res.status(500).send('Something went wrong!');
    }
};

// പുതിയ ഫംഗ്ഷൻ: ഇവന്റ് ഉണ്ടാക്കി ഡാറ്റാബേസിൽ സേവ് ചെയ്യാൻ
export const createEvent = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('User:', req.user);
        
        const { title, description, date, time, location, image, price, category, isPrivate } = req.body;
        
        // Validate required fields
        if (!title || !description || !date || !time || !location || !image || !price || !category) {
            console.log('Missing fields:', { title: !!title, description: !!description, date: !!date, time: !!time, location: !!location, image: !!image, price: !!price, category: !!category });
            return res.render('create-event', { 
                user: req.user,
                error: 'All required fields must be filled.' 
            });
        }

        // Combine date and time
        const dateTimeString = `${date}T${time}`;
        const eventDateTime = new Date(dateTimeString);
        
        // Validate date
        if (isNaN(eventDateTime.getTime())) {
            console.log('Invalid date/time:', { date, time, dateTimeString, eventDateTime });
            return res.render('create-event', { 
                user: req.user,
                error: 'Invalid date or time format.' 
            });
        }

        console.log('Creating event with data:', { 
            title, 
            description, 
            date, 
            time, 
            dateTimeString,
            eventDateTime,
            location, 
            image, 
            price, 
            category, 
            isPrivate,
            createdBy: req.user._id
        });

        const newEvent = await Event.create({
            title: title.trim(),
            description: description.trim(),
            date: eventDateTime,
            location: location.trim(),
            image: image.trim(),
            price: parseFloat(price),
            category,
            isPrivate: isPrivate === 'on', // Checkbox value
            createdBy: req.user._id // ലോഗിൻ ചെയ്ത യൂസറിന്റെ ID
        });

        console.log('Event created successfully:', newEvent._id);

        res.redirect('/events'); // വിജയകരമായാൽ ഇവന്റ്സ് പേജിലേക്ക് പോകുന്നു

    } catch (error) {
        console.error("Error creating event:", error);
        console.error("Error details:", {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        let errorMessage = 'Failed to create event. Please try again.';
        
        // Provide more specific error messages
        if (error.name === 'ValidationError') {
            errorMessage = 'Please check your input. Some fields may be invalid.';
        } else if (error.code === 11000) {
            errorMessage = 'An event with this title already exists.';
        }
        
        res.render('create-event', { 
            user: req.user,
            error: errorMessage
        });
    }
};
    
// പുതിയ ഫംഗ്ഷൻ: യൂസർ ഉണ്ടാക്കിയ ഇവന്റുകൾ കാണിക്കാൻ
export const showMyEvents = async (req, res) => {
    try {
        const userEvents = await Event.find({ createdBy: req.user._id }).sort({ date: 1 });
        
        res.render('my-events', { 
            events: userEvents, 
            user: req.user 
        });
    } catch (error) {
        console.error("Error fetching user events:", error);
        res.status(500).send('Error fetching your events');
    }
};

// പുതിയ ഫംഗ്ഷൻ: ഇവന്റ് എഡിറ്റ് ചെയ്യാനുള്ള പേജ് കാണിക്കാൻ
export const showEditEventPage = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).send('Event not found');
        }
        
        // യൂസർ ഈ ഇവന്റിന്റെ ക്രിയേറ്റർ ആണോ എന്ന് പരിശോധിക്കുക
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).send('You are not authorized to edit this event');
        }
        
        // Date and time രൂപത്തിൽ വേർതിരിക്കുക
        const eventDate = event.date.toISOString().split('T')[0];
        const eventTime = event.date.toTimeString().split(' ')[0];
        
        res.render('edit-event', { 
            event: event, 
            user: req.user,
            eventDate: eventDate,
            eventTime: eventTime,
            error: null 
        });
    } catch (error) {
        console.error("Error showing edit event page:", error);
        res.status(500).send('Something went wrong!');
    }
};

// പുതിയ ഫംഗ്ഷൻ: ഇവന്റ് അപ്ഡേറ്റ് ചെയ്യാൻ
export const updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { title, description, date, time, location, image, price, category, isPrivate } = req.body;
        
        // Validate required fields
        if (!title || !description || !date || !time || !location || !image || !price || !category) {
            return res.render('edit-event', { 
                event: { _id: eventId, title, description, date, time, location, image, price, category, isPrivate },
                user: req.user,
                eventDate: date,
                eventTime: time,
                error: 'All required fields must be filled.' 
            });
        }

        // Check if event exists and user is authorized
        const existingEvent = await Event.findById(eventId);
        if (!existingEvent) {
            return res.status(404).send('Event not found');
        }
        
        if (existingEvent.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).send('You are not authorized to edit this event');
        }

        // Combine date and time
        const dateTimeString = `${date}T${time}`;
        const eventDateTime = new Date(dateTimeString);
        
        // Validate date
        if (isNaN(eventDateTime.getTime())) {
            return res.render('edit-event', { 
                event: { _id: eventId, title, description, date, time, location, image, price, category, isPrivate },
                user: req.user,
                eventDate: date,
                eventTime: time,
                error: 'Invalid date or time format.' 
            });
        }

        // Update event
        const updatedEvent = await Event.findByIdAndUpdate(eventId, {
            title: title.trim(),
            description: description.trim(),
            date: eventDateTime,
            location: location.trim(),
            image: image.trim(),
            price: parseFloat(price),
            category,
            isPrivate: isPrivate === 'on'
        }, { new: true });

        console.log('Event updated successfully:', updatedEvent._id);
        res.redirect('/events/my-events');

    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).send('Failed to update event. Please try again.');
    }
};

// പുതിയ ഫംഗ്ഷൻ: ഇവന്റ് ഡിലീറ്റ് ചെയ്യാൻ
export const deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        
        // Check if event exists and user is authorized
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this event' });
        }

        // Delete event
        await Event.findByIdAndDelete(eventId);
        
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
};
    