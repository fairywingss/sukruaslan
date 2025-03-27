const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const util = require('util');
const streamPipeline = util.promisify(pipeline);

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

        // Görselleri yükle
        const uploadDir = path.join(__dirname, '..', '..', 'images', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        const mainImagePath = `/images/uploads/${Date.now()}-${files.main_image.filename}`;
        await streamPipeline(
            Buffer.from(files.main_image.content),
            createWriteStream(path.join(__dirname, '..', '..', mainImagePath))
        );

        let detailImage1Path = '';
        if (files.detail_image_1) {
            detailImage1Path = `/images/uploads/${Date.now()}-${files.detail_image_1.filename}`;
            await streamPipeline(
                Buffer.from(files.detail_image_1.content),
                createWriteStream(path.join(__dirname, '..', '..', detailImage1Path))
            );
        }

        let detailImage2Path = '';
        if (files.detail_image_2) {
            detailImage2Path = `/images/uploads/${Date.now()}-${files.detail_image_2.filename}`;
            await streamPipeline(
                Buffer.from(files.detail_image_2.content),
                createWriteStream(path.join(__dirname, '..', '..', detailImage2Path))
            );
        }

        // Mevcut artworks.json dosyasını oku
        const artworksPath = path.join(__dirname, '..', '..', 'data', 'artworks.json');
        let artworks = [];
        try {
            const data = await fs.readFile(artworksPath, 'utf8');
            artworks = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        // Yeni eseri ekle
        const newArtwork = {
            title: fields.title,
            category: fields.category,
            main_image: mainImagePath,
            detail_image_1: detailImage1Path,
            detail_image_2: detailImage2Path,
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

        // GitHub'a commit yap
        const repoOwner = 'sukruaslan';
        const repoName = 'sukruaslanart';
        const branch = 'main';

        let sha;
        try {
            const { data } = await octokit.repos.getContent({
                owner: repoOwner,
                repo: repoName,
                path: 'data/artworks.json',
                ref: branch
            });
            sha = data.sha;
        } catch (error) {
            if (error.status !== 404) throw error;
        }

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
