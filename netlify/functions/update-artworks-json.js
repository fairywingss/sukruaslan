const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');

exports.handler = async function (event, context) {
    try {
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) throw new Error('GITHUB_TOKEN ortam değişkeni bulunamadı');

        const octokit = new Octokit({ auth: githubToken });

        // data/artworks/ klasöründeki .md dosyalarını oku
        const artworksDir = path.join(__dirname, '..', 'data', 'artworks');
        const files = await fs.readdir(artworksDir);
        const mdFiles = files.filter(file => file.endsWith('.md'));

        const artworks = [];
        for (const file of mdFiles) {
            const filePath = path.join(artworksDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
            if (!frontmatterMatch) continue;

            const frontmatter = frontmatterMatch[1];
            const frontmatterLines = frontmatter.split('\n');
            const artwork = {};

            for (const line of frontmatterLines) {
                const [key, value] = line.split(':').map(part => part.trim());
                if (key && value) artwork[key] = value.startsWith('/') ? value : value.replace(/"/g, '');
            }

            if (artwork.title && artwork.category) {
                artworks.push({
                    title: artwork.title,
                    category: artwork.category,
                    main_image: artwork.main_image || '',
                    detail_image_1: artwork.detail_image_1 || '',
                    detail_image_2: artwork.detail_image_2 || '',
                    description_tr: artwork.description_tr || '',
                    description_en: artwork.description_en || '',
                    material_tr: artwork.material_tr || '',
                    size_tr: artwork.size_tr || '',
                    material_en: artwork.material_en || '',
                    size_en: artwork.size_en || ''
                });
            }
        }

        console.log('Parsed artworks:', artworks);
        const newArtworksJson = JSON.stringify(artworks, null, 2);

        // Mevcut artworks.json dosyasını al ve karşılaştır
        const repoOwner = 'sukruaslan';
        const repoName = 'sukruaslanart';
        const branch = 'main';

        let sha;
        let currentArtworksJson = '';
        try {
            const { data } = await octokit.repos.getContent({
                owner: repoOwner,
                repo: repoName,
                path: 'data/artworks.json',
                ref: branch
            });
            sha = data.sha;
            currentArtworksJson = Buffer.from(data.content, 'base64').toString('utf8');
        } catch (error) {
            if (error.status !== 404) throw error;
        }

        // Eğer içerik aynıysa commit yapma
        if (currentArtworksJson === newArtworksJson) {
            console.log('data/artworks.json zaten güncel, commit yapılmasına gerek yok');
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Artworks are already up to date' })
            };
        }

        // Dosyayı güncelle
        await octokit.repos.createOrUpdateFileContents({
            owner: repoOwner,
            repo: repoName,
            path: 'data/artworks.json',
            message: 'Update artworks.json via Netlify Function',
            content: Buffer.from(newArtworksJson).toString('base64'),
            sha: sha,
            branch: branch
        });

        console.log('data/artworks.json başarıyla güncellendi');
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Artworks updated successfully' })
        };
    } catch (error) {
        console.error('Hata:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
