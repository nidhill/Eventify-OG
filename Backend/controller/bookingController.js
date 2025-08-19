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

        const event = await Event.findById(eventId);
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

        // Send confirmation email to user
        try {
            console.log('Sending confirmation email to user:', req.user.email);
            await sendTicketEmail({
                email: req.user.email,
                event: booking.eventId,
                booking: booking
            });
            console.log('Confirmation email sent successfully to:', req.user.email);
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Continue even if email fails
        }

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
