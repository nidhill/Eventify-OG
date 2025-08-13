import User from '../models/userModel.js';
import Event from '../models/eventModel.js';
import { sendBanEmail, sendUnbanEmail } from '../utils/sendEmail.js';

// Admin Dashboard kaanikkunnu
export const showDashboard = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const eventCount = await Event.countDocuments();
        const bannedUsers = await User.countDocuments({ isBanned: true });
        const activeUsers = await User.countDocuments({ isBanned: false });
        
        res.render('admin/dashboard', {
            user: req.user,
            userCount,
            eventCount,
            bannedUsers,
            activeUsers
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Error loading dashboard');
    }
};

// Usersine manage cheyyാനുള്ള page
export const manageUsers = async (req, res) => {
    try {
        const users = await User.find({});
        const successMessage = req.session.successMessage;
        
        // Clear the message after displaying
        if (req.session.successMessage) {
            delete req.session.successMessage;
        }
        
        res.render('admin/manage-users', {
            user: req.user,
            users: users,
            successMessage: successMessage
        });
    } catch (error) {
        console.error('Error in manageUsers:', error);
        res.status(500).send('Error fetching users');
    }
};

// Oru userine ban cheyyunnu
export const banUser = async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update user to banned
        await User.findByIdAndUpdate(req.params.id, { 
            isBanned: true,
            banReason: reason || 'Violation of community guidelines'
        });

        // Send ban notification email
        await sendBanEmail({
            email: user.email,
            username: user.username,
            reason: reason || 'Violation of community guidelines and terms of service.'
        });

        // Set success message
        req.session.successMessage = `User ${user.username} has been banned successfully for: "${reason || 'Violation of community guidelines'}". Ban notification email sent.`;
        res.redirect('/admin/manage-users');
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).send('Error banning user');
    }
};

// Userinte ban remove cheyyunnu
export const unbanUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Store the previous ban reason before clearing it
        const previousBanReason = user.banReason;

        await User.findByIdAndUpdate(req.params.id, { 
            isBanned: false,
            banReason: '' // Clear ban reason
        });

        // Send unban notification email
        await sendUnbanEmail({
            email: user.email,
            username: user.username,
            previousReason: previousBanReason
        });

        // Set success message
        req.session.successMessage = `User ${user.username} has been unbanned successfully. Unban notification email sent.`;
        res.redirect('/admin/manage-users');
    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).send('Error unbanning user');
    }
};

// Events manage cheyyാനുള്ള page
export const manageEvents = async (req, res) => {
    try {
        console.log('User accessing manageEvents:', req.user.username, 'isAdmin:', req.user.isAdmin);
        
        const events = await Event.find({}).populate('createdBy', 'username email');
        console.log('Total events found:', events.length);
        
        if (events.length > 0) {
            console.log('Events with populated createdBy:', events.map(e => ({
                title: e.title,
                createdBy: e.createdBy ? e.createdBy.username : 'Unknown User'
            })));
        } else {
            console.log('No events found in database');
        }
        
        res.render('admin/manage-events', {
            user: req.user,
            events: events
        });
    } catch (error) {
        console.error('Error in manageEvents:', error);
        res.status(500).send('Error fetching events: ' + error.message);
    }
};

// Oru event delete cheyyunnu
export const deleteEvent = async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.redirect('/admin/manage-events');
    } catch (error) {
        res.status(500).send('Error deleting event');
    }
};