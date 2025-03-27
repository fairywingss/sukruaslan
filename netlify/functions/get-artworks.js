const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    try {
        // data/artworks/ klasöründeki .md dosyalarının listesi (sabitleyelim)
        const artworkFiles = [
            'meczup-1.md',
            'meczup-2.md',
            'meczup-3.md',
            'vardim-varim-var-olacagim.md',
            'harese.md',
            'bir-hayalim-var.md',
            // Yeni eklediğin eserin dosya adını buraya ekle
            'yeni-eser.md' // Örneğin, yeni eserin dosya adı buysa
        ];

        console.log('Artwork files to fetch:', artworkFiles);

        const artworks = await Promise.all(artworkFiles.map(async (file) => {
            const fileUrl = `/data/artworks/${file}`;
            console.log('Fetching file:', fileUrl);

            try {
                const response = await fetch(`${process.env.URL}${fileUrl}`);
                if (!response.ok) {
                    console.error(`Failed to fetch ${fileUrl}: ${response.statusText}`);
                    return null;
                }

                const content = await response.text();
                const frontMatter = content.split('---')[1]?.trim();
                if (!frontMatter) {
                    console.error(`Invalid front matter in ${file}`);
                    return null;
                }

                const artworkData = {};
                frontMatter.split('\n').forEach(line => {
                    const [key, value] = line.split(':').map(part => part.trim());
                    if (key && value) {
                        artworkData[key] = value;
                    }
                });

                return artworkData;
            } catch (error) {
                console.error(`Error fetching ${fileUrl}:`, error);
                return null;
            }
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
