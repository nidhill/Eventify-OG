// Featured Events Rotation System
import Event from '../models/eventModel.js';

// Cache for featured events
let featuredEventsCache = [];
let lastRotationTime = 0;
const ROTATION_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Get featured events with automatic rotation every 10 minutes
 * @param {number} limit - Number of events to return (default: 6)
 * @returns {Array} Array of featured events
 */
export const getFeaturedEvents = async (limit = 6) => {
    try {
        const currentTime = Date.now();
        
        // Check if we need to rotate events (every 10 minutes)
        if (currentTime - lastRotationTime >= ROTATION_INTERVAL || featuredEventsCache.length === 0) {
            console.log('🔄 Rotating featured events...');
            await rotateFeaturedEvents(limit);
            lastRotationTime = currentTime;
        }
        
        return featuredEventsCache.slice(0, limit);
    } catch (error) {
        console.error('❌ Error getting featured events:', error);
        return [];
    }
};

/**
 * Rotate featured events by selecting random upcoming events
 * @param {number} limit - Number of events to select
 */
const rotateFeaturedEvents = async (limit) => {
    try {
        // Get current date
        const currentDate = new Date();
        
        // Find upcoming events (events that are in the future)
        const upcomingEvents = await Event.find({
            date: { $gte: currentDate }
        })
        .populate('createdBy', 'username name')
        .sort({ date: 1 })
        .limit(50) // Get more events to choose from
        .maxTimeMS(5000); // 5 second timeout
        
        if (upcomingEvents.length === 0) {
            console.log('⚠️ No upcoming events found for rotation');
            featuredEventsCache = [];
            return;
        }
        
        // Shuffle the events array to get random selection
        const shuffledEvents = shuffleArray([...upcomingEvents]);
        
        // Select the specified number of events
        featuredEventsCache = shuffledEvents.slice(0, Math.min(limit, shuffledEvents.length));
        
        console.log(`✅ Featured events rotated: ${featuredEventsCache.length} events selected`);
        console.log('📅 Featured events:', featuredEventsCache.map(e => e.title));
        
    } catch (error) {
        console.error('❌ Error rotating featured events:', error);
        // If there's an error, try to get any events as fallback
        try {
            const fallbackEvents = await Event.find({})
                .populate('createdBy', 'username name')
                .sort({ date: 1 })
                .limit(limit)
                .maxTimeMS(3000);
            
            if (fallbackEvents.length > 0) {
                featuredEventsCache = fallbackEvents;
                console.log(`⚠️ Using fallback events: ${fallbackEvents.length} events`);
            } else {
                featuredEventsCache = [];
            }
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            featuredEventsCache = [];
        }
    }
};

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Force rotation of featured events (useful for testing or manual refresh)
 */
export const forceRotation = async () => {
    console.log('🔄 Force rotating featured events...');
    lastRotationTime = 0; // Reset rotation time
    await getFeaturedEvents();
};

/**
 * Get time until next rotation
 * @returns {number} Milliseconds until next rotation
 */
export const getTimeUntilNextRotation = () => {
    const currentTime = Date.now();
    const timeSinceLastRotation = currentTime - lastRotationTime;
    const timeUntilNext = ROTATION_INTERVAL - timeSinceLastRotation;
    return Math.max(0, timeUntilNext);
};

/**
 * Get rotation status information
 * @returns {Object} Rotation status
 */
export const getRotationStatus = () => {
    return {
        lastRotationTime: new Date(lastRotationTime),
        timeUntilNextRotation: getTimeUntilNextRotation(),
        rotationInterval: ROTATION_INTERVAL,
        currentFeaturedCount: featuredEventsCache.length,
        nextRotationIn: Math.ceil(getTimeUntilNextRotation() / (60 * 1000)) // minutes
    };
};

// Initialize featured events on module load
console.log('🎯 Featured Events Rotation System initialized');
console.log(`⏰ Events will rotate every ${ROTATION_INTERVAL / (60 * 1000)} minutes`);
