const { Octokit } = require('@octokit/rest');

exports.handler = async function (event, context) {
    try {
        if (event.httpMethod !== 'POST') {
            return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
        }

        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) throw new Error('GITHUB_TOKEN ortam değişkeni bulunamadı');

        const octokit = new Octokit({ auth: githubToken });

        // Form verilerini işle
        const contentType = event.headers['content-type'];
        if (!contentType || !contentType.includes('multipart/form-data')) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid content type' }) };
        }

        const boundary = contentType.split('boundary=')[1];
        const parts = event.body.split(`--${boundary}`);
        const fields = {};
        const files = {};

        for (let part of parts) {
            part = part.trim();
            if (!part || part === '--') continue;

            const [header, ...body] = part.split('\r\n\r\n');
            const contentDisposition = header.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/);
            if (!contentDisposition) continue;

            const name = contentDisposition[1];
            const filename = contentDisposition[2];
            const value = body.join('\r\n\r\n').trim().replace(/\r\n$/, '');

            if (filename) {
                const fileContent = Buffer.from(value, 'base64');
                files[name] = { filename, content: fileContent };
            } else {
                fields[name] = value;
            }
        }

        console.log('Fields:', fields);
        console.log('Files:', files);

        // main_image alanını kontrol et
        if (!files.main_image || !files.main_image.filename) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Ana görsel (main_image) zorunludur' }) };
        }

        // Görselleri GitHub'a yükle
        const repoOwner = 'sukruaslan';
        const repoName = 'sukruaslanart';
        const branch = 'main';

        const mainImagePath = `images/uploads/${Date.now()}-${files.main_image.filename}`;
        await octokit.repos.createOrUpdateFileContents({
            owner: repoOwner,
            repo: repoName,
            path: mainImagePath,
            message: `Upload main image for artwork: ${fields.title}`,
            content: files.main_image.content.toString('base64'),
            branch: branch
        });

        let detailImage1Path = '';
        if (files.detail_image_1 && files.detail_image_1.filename) {
            detailImage1Path = `images/uploads/${Date.now()}-${files.detail_image_1.filename}`;
            await octokit.repos.createOrUpdateFileContents({
                owner: repoOwner,
                repo: repoName,
                path: detailImage1Path,
                message: `Upload detail image 1 for artwork: ${fields.title}`,
                content: files.detail_image_1.content.toString('base64'),
                branch: branch
            });
        }

        let detailImage2Path = '';
        if (files.detail_image_2 && files.detail_image_2.filename) {
            detailImage2Path = `images/uploads/${Date.now()}-${files.detail_image_2.filename}`;
            await octokit.repos.createOrUpdateFileContents({
                owner: repoOwner,
                repo: repoName,
                path: detailImage2Path,
                message: `Upload detail image 2 for artwork: ${fields.title}`,
                content: files.detail_image_2.content.toString('base64'),
                branch: branch
            });
        }

        // Mevcut artworks.json dosyasını oku
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

        // Yeni eseri ekle
        const newArtwork = {
            title: fields.title,
            category: fields.category,
            main_image: `/${mainImagePath}`,
            detail_image_1: detailImage1Path ? `/${detailImage1Path}` : '',
            detail_image_2: detailImage2Path ? `/${detailImage2Path}` : '',
            description_tr: fields.description_tr,
            description_en: fields.description_en,
            material_tr: fields.material_tr,
            size_tr: fields.size_tr,
            material_en: fields.material_en,
            size_en: fields.size_en
        };
        artworks.push(newArtwork);

        // artworks.json dosyasını güncelle
        const newArtworksJson = JSON.stringify(artworks, null, 2);
        await octokit.repos.createOrUpdateFileContents({
            owner: repoOwner,
            repo: repoName,
            path: 'data/artworks.json',
            message: 'Add new artwork via admin panel',
            content: Buffer.from(newArtworksJson).toString('base64'),
            sha: sha,
            branch: branch
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Eser başarıyla eklendi' })
        };
    } catch (error) {
        console.error('Hata:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
