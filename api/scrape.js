const TwitterScraper = require('../src/scraper');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const scraper = new TwitterScraper();
    await scraper.init();
    await scraper.run();
    
    const stats = scraper.getStats();
    await scraper.cleanup();
    
    res.status(200).json({
      success: true,
      message: 'Scraping completed',
      stats: stats
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Scraping failed',
      error: error.message
    });
  }
}; 