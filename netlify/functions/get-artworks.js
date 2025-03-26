const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
    try {
        // Netlify Functions'ın çalışma dizinini logla
        console.log('Current working directory (__dirname):', __dirname);

        // Projenin kök dizini olarak /var/task kullan
        const projectRoot = '/var/task';
        console.log('Project root directory:', projectRoot);

        // Projenin kök dizinindeki tüm dosyaları ve klasörleri logla
        const rootFiles = await fs.readdir(projectRoot);
        console.log('Files and directories in project root:', rootFiles);

        const artworksDir = path.join(projectRoot, 'data', 'artworks');
        console.log('Artworks directory path:', artworksDir);

        // data/ klasörünün varlığını kontrol et
        const dataDir = path.join(projectRoot, 'data');
        try {
            await fs.access(dataDir);
            console.log('data/ directory exists!');
            const dataDirFiles = await fs.readdir(dataDir);
            console.log('Files and directories in data/ directory:', dataDirFiles);
        } catch (error) {
            console.error('data/ directory access error:', error);
            throw new Error(`data/ klasörü bulunamadı: ${dataDir}`);
        }

        // data/artworks/ klasörünün varlığını kontrol et
        try {
            await fs.access(artworksDir);
            console.log('Artworks directory exists!');
        } catch (error) {
            console.error('Artworks directory access error:', error);
            throw new Error(`Klasör bulunamadı: ${artworksDir}`);
        }

        const files = await fs.readdir(artworksDir);
        console.log('Files in artworks directory:', files);

        const artworks = await Promise.all(files.map(async (file) => {
            if (!file.endsWith('.md')) return null;
            const filePath = path.join(artworksDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const frontMatter = content.split('---')[1]?.trim();
            if (!frontMatter) return null;

            const artworkData = {};
            frontMatter.split('\n').forEach(line => {
                const [key, value] = line.split(':').map(part => part.trim());
                if (key && value) {
                    artworkData[key] = value;
                }
            });

            return artworkData;
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(artworks.filter(artwork => artwork !== null))
        };
    } catch (error) {
        console.error('Hata:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Eserler yüklenirken hata oluştu: ' + error.message })
        };
    }
};
