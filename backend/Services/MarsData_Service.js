const fs = require('fs');
const path = require('path');

const localDataPath = path.join(__dirname, '../Data/marsData.json');
const mockMarsData = JSON.parse(fs.readFileSync(localDataPath, 'utf8'));

module.exports = {
  getMissionData: async function(siteKey) {
    const key = siteKey.toLowerCase();
    const siteData = mockMarsData[key];

    if (!siteData) {
      throw new Error(`Mission site '${siteKey}' not supported.`);
    }

    return {
      source: "LOCAL_SCIENTIFIC_CACHE",
      data: siteData
    };
  }
};