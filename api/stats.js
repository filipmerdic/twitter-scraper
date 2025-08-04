const dbService = require('../src/services/dbService');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await dbService.init();
    const stats = dbService.getStats();
    
    res.status(200).json({
      profilesChecked: 0,
      newTweetsFound: 0,
      messagesSent: 0,
      duplicateTweetsSkipped: stats.duplicateTweetsSkipped || 0,
      errors: 0,
      database: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
}; 