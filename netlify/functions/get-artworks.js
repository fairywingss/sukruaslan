const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
    try {
        const artworksDir = path.join(__dirname, '..', '..', 'data', 'artworks');
        const files = await fs.readdir(artworksDir);

        const artworks = await Promise.all(files.map(async (file) => {
            if (!file.endsWith('.md')) return null;
            const filePath = path.join(artworksDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const frontMatter = content.split('---')[1].trim();
            const artworkData = {};

            frontMatter.split('\n').forEach(line => {
                const [key, value] = line.split(':').map(part => part.trim());
                artworkData[key] = value;
            });

            return artworkData;
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(artworks.filter(artwork => artwork !== null))
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Eserler yüklenirken hata oluştu: ' + error.message })
        };
    }
};
