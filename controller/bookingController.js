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

        // Generate attractive ticket with barcode
        const ticketHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Event Ticket - ${booking.eventId.title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body { 
                    font-family: 'Poppins', Arial, sans-serif; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .ticket-container {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    overflow: hidden;
                    max-width: 400px;
                    width: 100%;
                    position: relative;
                }
                
                .ticket-header {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                    position: relative;
                }
                
                .ticket-header::before {
                    content: '';
                    position: absolute;
                    bottom: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 10px solid transparent;
                    border-right: 10px solid transparent;
                    border-top: 10px solid #8b5cf6;
                }
                
                .brand-logo {
                    font-size: 28px;
                    font-weight: 800;
                    margin-bottom: 10px;
                    letter-spacing: 2px;
                }
                
                .event-title {
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                
                .event-date {
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .ticket-body {
                    padding: 30px 20px;
                }
                
                .ticket-info {
                    display: grid;
                    gap: 15px;
                    margin-bottom: 25px;
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .info-label {
                    font-weight: 500;
                    color: #666;
                    font-size: 14px;
                }
                
                .info-value {
                    font-weight: 600;
                    color: #333;
                    font-size: 14px;
                    text-align: right;
                }
                
                .price-highlight {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    padding: 15px;
                    border-radius: 12px;
                    text-align: center;
                    margin: 20px 0;
                }
                
                .price-amount {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 5px;
                }
                
                .price-label {
                    font-size: 12px;
                    opacity: 0.9;
                }
                
                .barcode-section {
                    text-align: center;
                    margin: 25px 0;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 12px;
                }
                
                .barcode {
                    font-family: 'Courier New', monospace;
                    font-size: 16px;
                    font-weight: bold;
                    color: #333;
                    letter-spacing: 2px;
                    margin: 10px 0;
                    padding: 10px;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                }
                
                .barcode-label {
                    font-size: 12px;
                    color: #666;
                    margin-top: 10px;
                }
                
                .ticket-footer {
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #e5e7eb;
                }
                
                .footer-text {
                    font-size: 12px;
                    color: #666;
                    line-height: 1.5;
                    margin-bottom: 10px;
                }
                
                .copyright {
                    font-size: 11px;
                    color: #999;
                }
                
                .status-badge {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: #10b981;
                    color: white;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .ticket-id {
                    background: #f0f0f0;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                    margin-top: 15px;
                }
                
                @media print {
                    body { background: white; }
                    .ticket-container { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="ticket-container">
                <div class="status-badge">Valid</div>
                
                <div class="ticket-header">
                    <div class="brand-logo">EVENTIFY</div>
                    <div class="event-title">${booking.eventId.title}</div>
                    <div class="event-date">${new Date(booking.eventId.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                
                <div class="ticket-body">
                    <div class="ticket-info">
                        <div class="info-row">
                            <span class="info-label">Location</span>
                            <span class="info-value">${booking.eventId.location}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Customer</span>
                            <span class="info-value">${booking.customerName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Phone</span>
                            <span class="info-value">${booking.customerPhone}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Quantity</span>
                            <span class="info-value">${booking.quantity} ticket${booking.quantity > 1 ? 's' : ''}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Booking Date</span>
                            <span class="info-value">${new Date(booking.bookingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        ${booking.couponApplied ? `
                        <div class="info-row">
                            <span class="info-label">Coupon</span>
                            <span class="info-value" style="color: #10b981; font-weight: 700;">Applied ✓</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="price-highlight">
                        <div class="price-amount">₹${booking.totalAmount.toFixed(2)}</div>
                        <div class="price-label">Total Amount</div>
                    </div>
                    
                    <div class="barcode-section">
                        <div class="barcode">${booking._id.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</div>
                        <div class="barcode-label">Scan this code at the venue</div>
                    </div>
                    
                    <div class="ticket-id">
                        Ticket ID: ${booking._id}
                    </div>
                </div>
                
                <div class="ticket-footer">
                    <div class="footer-text">
                        <strong>Important:</strong> Please bring this ticket to the event. This is your official entry pass.
                    </div>
                    <div class="copyright">
                        © 2025 Eventify - All rights reserved
                    </div>
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
