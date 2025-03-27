const { Octokit } = require('@octokit/rest');

exports.handler = async function (event, context) {
    try {
        if (event.httpMethod !== 'POST') {
            return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
        }

        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) throw new Error('GITHUB_TOKEN ortam değişkeni bulunamadı');

        const octokit = new Octokit({ auth: githubToken });

        const { index } = JSON.parse(event.body);

        // Mevcut artworks.json dosyasını oku
        const repoOwner = 'sukruaslan';
        const repoName = 'sukruaslanart';
        const branch = 'main';

        let artworks = [];
        let sha;
        try {
            const { data } = await octokit.repos.getContent({
                owner: repoOwner,
                repo: repoName,
                path: 'data/artworks.json',
                ref: branch
            });
            sha = data.sha;
            const content = Buffer.from(data.content, 'base64').toString('utf8');
            artworks = JSON.parse(content);
        } catch (error) {
            if (error.status !== 404) throw error;
        }

        // Esri sil
        if (index < 0 || index >= artworks.length) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Geçersiz indeks' }) };
        }
        artworks.splice(index, 1);

        // artworks.json dosyasını güncelle
        const newArtworksJson = JSON.stringify(artworks, null, 2);
        await octokit.repos.createOrUpdateFileContents({
            owner: repoOwner,
            repo: repoName,
            path: 'data/artworks.json',
            message: 'Delete artwork via admin panel',
            content: Buffer.from(newArtworksJson).toString('base64'),
            sha: sha,
            branch: branch
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Eser başarıyla silindi' })
        };
    } catch (error) {
        console.error('Hata:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
