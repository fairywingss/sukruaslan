const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');

exports.handler = async function(event, context) {
    try {
        // Netlify Functions'ın çalışma dizini
        const projectRoot = '/var/task';

        // GitHub token (Netlify ortam değişkenlerinden alınacak)
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            throw new Error('GITHUB_TOKEN ortam değişkeni bulunamadı');
        }

        // GitHub Octokit istemcisini oluştur
        const octokit = new Octokit({ auth: githubToken });

        // data/artworks/ klasöründeki .md dosyalarını oku
        const artworksDir = path.join(projectRoot, 'data', 'artworks');
        let files;
        try {
            files = await fs.readdir(artworksDir);
        } catch (error) {
            console.error('data/artworks/ klasörüne erişim hatası:', error);
            throw new Error(`data/artworks/ klasörüne erişim hatası: ${error.message}`);
        }

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

        const filteredArtworks = artworks.filter(artwork => artwork !== null);
        console.log('Parsed artworks:', filteredArtworks);

        // data/artworks.json dosyasını güncelle
        const jsonContent = JSON.stringify(filteredArtworks, null, 2);

        // GitHub’a commit yap
        const repoOwner = 'sukruaslan'; // GitHub kullanıcı adın
        const repoName = 'sukruaslan'; // GitHub depo adın
        const filePath = 'data/artworks.json';

        // Mevcut dosyayı al (varsa)
        let sha;
        try {
            const { data } = await octokit.repos.getContent({
                owner: repoOwner,
                repo: repoName,
                path: filePath
            });
            sha = data.sha;
        } catch (error) {
            if (error.status !== 404) {
                throw error;
            }
        }

        // Dosyayı güncelle veya oluştur
        await octokit.repos.createOrUpdateFileContents({
            owner: repoOwner,
            repo: repoName,
            path: filePath,
            message: 'data/artworks.json güncellendi',
            content: Buffer.from(jsonContent).toString('base64'),
            sha: sha // Eğer dosya zaten varsa, sha değerini kullan
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'data/artworks.json başarıyla güncellendi', artworks: filteredArtworks })
        };
    } catch (error) {
        console.error('Hata:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'data/artworks.json güncellenirken hata oluştu: ' + error.message })
        };
    }
};
