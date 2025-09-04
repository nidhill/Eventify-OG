import Event from '../models/eventModel.js';
import Booking from '../models/bookingModel.js';
import { sendTicketEmail } from '../utils/sendEmail.js';

// ബുക്കിംഗ് പേജ് കാണിക്കാൻ
export const showBookingPage = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).send('Event not found');
        res.render('booking', { event, user: req.user });
    } catch (error) {
        console.error("Error showing booking page:", error);
        res.status(500).send('Server Error');
    }
};

// പേയ്‌മെന്റ് പേജിലേക്ക് പോകാൻ
export const proceedToPayment = async (req, res) => {
    try {
        console.log('Proceed to payment request body:', req.body);
        
        const { eventId, quantity, customerName, customerPhone, couponCode, couponApplied } = req.body;
        
        if (!eventId || !quantity || !customerName || !customerPhone) {
            console.error('Missing required fields:', { eventId, quantity, customerName, customerPhone });
            return res.status(400).send('Missing required fields');
        }

        const event = await Event.findById(eventId, {
            title: 1,
            price: 1,
            date: 1,
            location: 1
        });
        if (!event) {
            console.error('Event not found for ID:', eventId);
            return res.status(404).send('Event not found');
        }

        const subTotal = event.price * parseInt(quantity, 10);
        const convenienceFee = subTotal * 0.05; // 5% ഫീസ്
        let totalAmount = subTotal + convenienceFee;
        let isCouponApplied = false;

        // കൂപ്പൺ കോഡ് ശരിയാണോ എന്ന് പരിശോധിക്കുന്നു
        if (couponCode && couponCode.trim().toUpperCase() === 'EVENTFREE') {
            totalAmount = 0; // കൂപ്പൺ ശരിയാണെങ്കിൽ വില പൂജ്യമാക്കുന്നു
            isCouponApplied = true;
        }

        console.log('Calculated amounts:', { subTotal, convenienceFee, totalAmount, isCouponApplied });

        const newBooking = new Booking({
            eventId,
            userId: req.user._id,
            quantity: parseInt(quantity, 10),
            customerName,
            customerPhone,
            totalAmount,
            couponApplied: isCouponApplied
        });

        console.log('Saving booking:', newBooking);

        await newBooking.save();

        console.log('Booking saved successfully, rendering payment page');

        // Ensure all required data is available for the payment page
        res.render('payment', { 
            booking: newBooking, 
            event: event,
            user: req.user 
        });

    } catch (error) {
        console.error("Error proceeding to payment:", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Check if it's a validation error
        if (error.name === 'ValidationError') {
            return res.status(400).send(`Validation Error: ${error.message}`);
        }
        
        // Check if it's a MongoDB error
        if (error.name === 'MongoError' || error.name === 'MongoServerError') {
            return res.status(500).send('Database error occurred. Please try again.');
        }
        
        res.status(500).send('Something went wrong! Please try again.');
    }
};

// പേയ്‌മെന്റ് സ്ഥിരീകരിക്കാൻ
export const confirmBooking = async (req, res) => {
    try {
        console.log('Confirm booking request body:', req.body);
        
        const { bookingId } = req.body;
        if (!bookingId) {
            console.error('Booking ID is missing');
            return res.status(400).send('Booking ID is required');
        }

        console.log('Looking for booking with ID:', bookingId);

        const booking = await Booking.findById(bookingId).populate('eventId');
        if (!booking) {
            console.error('Booking not found for ID:', bookingId);
            return res.status(404).send('Booking not found');
        }

        console.log('Found booking:', booking);

        booking.status = 'Completed';
        await booking.save();
        
        console.log('Booking status updated to Completed');

        // Ensure we have the event data
        if (!booking.eventId) {
            console.error('Event not found for booking:', bookingId);
            return res.status(404).send('Event not found for this booking');
        }

        // Send confirmation email asynchronously (don't wait)
        sendTicketEmail({
            email: req.user.email,
            event: booking.eventId,
            booking: booking
        }).then(() => {
            console.log('✅ Confirmation email sent successfully to:', req.user.email);
        }).catch((emailError) => {
            console.error('❌ Failed to send confirmation email:', emailError);
        });

        console.log('Redirecting to ticket page');

        // Redirect to the ticket page instead of rendering booking-success
        res.redirect(`/booking/ticket/${bookingId}`);

    } catch (error) {
        console.error("Error confirming booking:", error);
        res.status(500).send('Something went wrong! Please try again.');
    }
};

// ടിക്കറ്റ് പേജ് കാണിക്കാൻ
export const showTicket = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        if (!bookingId) {
            return res.status(400).send('Booking ID is required');
        }

        console.log('Looking for booking with ID:', bookingId);

        const booking = await Booking.findById(bookingId).populate('eventId');
        if (!booking) {
            console.error('Booking not found for ID:', bookingId);
            return res.status(404).send('Booking not found');
        }

        // Ensure we have the event data
        if (!booking.eventId) {
            console.error('Event not found for booking:', bookingId);
            return res.status(404).send('Event not found for this booking');
        }

        console.log('Rendering ticket page for booking:', bookingId);

        res.render('ticket', { 
            booking: booking, 
            event: booking.eventId,
            user: req.user 
        });

    } catch (error) {
        console.error("Error showing ticket:", error);
        res.status(500).send('Something went wrong! Please try again.');
    }
};

// ഉപയോക്താവിന്റെ എല്ലാ ടിക്കറ്റുകളും കാണിക്കാൻ
export const showUserTickets = async (req, res) => {
    try {
        console.log('Fetching tickets for user:', req.user._id);

        const bookings = await Booking.find({ 
            userId: req.user._id,
            status: 'Completed'
        })
        .populate('eventId', 'title date location price image')
        .sort({ bookingDate: -1 }); // Latest bookings first

        console.log('Found bookings:', bookings.length);

        res.render('my-tickets', { 
            bookings: bookings,
            user: req.user 
        });

    } catch (error) {
        console.error("Error fetching user tickets:", error);
        res.status(500).send('Something went wrong! Please try again.');
    }
};

// ടിക്കറ്റ് ഡൗൺലോഡ് ചെയ്യാൻ
export const downloadTicket = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        if (!bookingId) {
            return res.status(400).send('Booking ID is required');
        }

        console.log('Downloading ticket for booking ID:', bookingId);

        const booking = await Booking.findById(bookingId).populate('eventId');
        if (!booking) {
            console.error('Booking not found for ID:', bookingId);
            return res.status(404).send('Booking not found');
        }

        // Verify user owns this booking
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).send('Unauthorized access to this ticket');
        }

        // Ensure we have the event data
        if (!booking.eventId) {
            console.error('Event not found for booking:', bookingId);
            return res.status(404).send('Event not found for this booking');
        }

        // Generate PDF content (simple HTML to PDF conversion)
        const ticketHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Event Ticket - ${booking.eventId.title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .ticket { border: 2px solid #333; padding: 20px; max-width: 600px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
                .event-title { font-size: 24px; font-weight: bold; color: #333; }
                .details { margin: 10px 0; }
                .label { font-weight: bold; color: #666; }
                .value { margin-left: 10px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="header">
                    <h1>EVENTIFY</h1>
                    <div class="event-title">${booking.eventId.title}</div>
                </div>
                
                <div class="details">
                    <div><span class="label">Date:</span><span class="value">${new Date(booking.eventId.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                    <div><span class="label">Location:</span><span class="value">${booking.eventId.location}</span></div>
                    <div><span class="label">Customer Name:</span><span class="value">${booking.customerName}</span></div>
                    <div><span class="label">Phone:</span><span class="value">${booking.customerPhone}</span></div>
                    <div><span class="label">Quantity:</span><span class="value">${booking.quantity} ticket${booking.quantity > 1 ? 's' : ''}</span></div>
                    <div><span class="label">Total Amount:</span><span class="value">₹${booking.totalAmount.toFixed(2)}</span></div>
                    <div><span class="label">Booking ID:</span><span class="value">${booking._id}</span></div>
                    <div><span class="label">Booking Date:</span><span class="value">${new Date(booking.bookingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                    ${booking.couponApplied ? '<div><span class="label">Coupon:</span><span class="value">Applied</span></div>' : ''}
                </div>
                
                <div class="footer">
                    <p>This is your official event ticket. Please bring this ticket to the event.</p>
                    <p>© 2025 Eventify - All rights reserved</p>
                </div>
            </div>
        </body>
        </html>
        `;

        // Set headers for PDF download
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${bookingId}.html"`);
        
        res.send(ticketHtml);

    } catch (error) {
        console.error("Error downloading ticket:", error);
        res.status(500).send('Something went wrong while downloading the ticket!');
    }
};
