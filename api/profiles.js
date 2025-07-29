const fs = require('fs').promises;
const path = require('path');
const logger = require('../src/utils/logger');

const PROFILES_FILE = path.join(__dirname, '../src/config/profiles.json');

/**
 * Get all profiles
 */
async function getProfiles(req, res) {
    try {
        const profilesData = await fs.readFile(PROFILES_FILE, 'utf8');
        const profiles = JSON.parse(profilesData);
        
        res.json(profiles);
    } catch (error) {
        logger.error('Error reading profiles:', error);
        res.status(500).json({
            error: 'Failed to read profiles',
            message: error.message
        });
    }
}

/**
 * Update profiles
 */
async function updateProfiles(req, res) {
    try {
        const { profiles, settings } = req.body;

        // Validate input
        if (!profiles || !Array.isArray(profiles)) {
            return res.status(400).json({
                error: 'Invalid input',
                message: 'Profiles must be an array'
            });
        }

        // Validate each profile
        for (const profile of profiles) {
            if (!profile.username || !profile.displayName) {
                return res.status(400).json({
                    error: 'Invalid profile data',
                    message: 'Each profile must have username and displayName'
                });
            }
        }

        // Prepare the data structure
        const profilesData = {
            profiles: profiles,
            settings: settings || {
                defaultIncludeRetweets: false,
                defaultIncludeReplies: false,
                maxTweetsPerProfile: 10,
                minIntervalMinutes: 5
            }
        };

        // Write to file
        await fs.writeFile(PROFILES_FILE, JSON.stringify(profilesData, null, 2), 'utf8');
        
        logger.info(`Profiles updated successfully. Total profiles: ${profiles.length}`);
        
        res.json({
            success: true,
            message: 'Profiles updated successfully',
            profilesCount: profiles.length
        });
    } catch (error) {
        logger.error('Error updating profiles:', error);
        res.status(500).json({
            error: 'Failed to update profiles',
            message: error.message
        });
    }
}

module.exports = {
    getProfiles,
    updateProfiles
}; 