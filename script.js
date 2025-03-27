let currentSlide = 0;
const galleryWall = document.querySelector('.gallery-wall');
const backgroundWall = document.querySelector('.background-wall');
const spotlight = document.querySelector('.spotlight');
const artistProfile = document.querySelector('.artist-profile');
const artistCard = document.querySelector('.artist-card');
const blurOverlay = document.querySelector('.blur-overlay');
let artworks = [];
let totalSlides = 0;
const backgroundWidth = 1920;
let autoScrollInterval;
let autoScrollDirection = 1;
let currentLang = 'tr';
let hasAppeared = [];
let isProfileVisible = true;
let isAutoScrollPaused = false;

// Eserleri data/artworks.json dosyasından yükleme
async function loadArtworks() {
    try {
        const response = await fetch('/data/artworks.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const loadedArtworks = await response.json();

        loadedArtworks.forEach((artwork, index) => {
            const artworkElement = document.createElement('div');
            artworkElement.classList.add('artwork');
            artworkElement.setAttribute('data-category', artwork.category);
            artworkElement.setAttribute('data-artwork-id', `${artwork.category}${index + 1}`);

            const categoryTextTr = artwork.category === 'resim' ? 'Resim: ' : 'Heykel: ';
            const categoryTextEn = artwork.category === 'resim' ? 'Painting: ' : 'Sculpture: ';
            const detailsTr = `${categoryTextTr}${artwork.material_tr}, ${artwork.size_tr}`;
            const detailsEn = `${categoryTextEn}${artwork.material_en}, ${artwork.size_en}`;

            artworkElement.innerHTML = `
                <img src="${artwork.main_image}" alt="${artwork.title}" class="artwork-image" data-artwork-id="${artwork.category}${index + 1}">
                <div class="label">
                    <h2>${artwork.title}</h2>
                    <p data-lang-tr="${artwork.description_tr}" data-lang-en="${artwork.description_en}"></p>
                    <p class="artwork-details" data-lang-tr="${detailsTr}" data-lang-en="${detailsEn}"></p>
                </div>
            `;
            galleryWall.appendChild(artworkElement);
        });

        artworks = document.querySelectorAll('.artwork');
        totalSlides = artworks.length;
        hasAppeared = Array(totalSlides).fill(false);
        filterArtworks('all');

        return loadedArtworks;
    } catch (error) {
        console.error('Eserler yüklenirken hata oluştu:', error);
        return [];
    }
}

// Slayt değiştirme fonksiyonu
function goToSlide(index, fromArtworksButton = false) {
    const visibleArtworks = Array.from(artworks).filter(artwork => artwork.style.display !== 'none');
    if (index < 0 || index >= visibleArtworks.length) return;

    currentSlide = index;

    const slidePercentage = window.innerWidth <= 768 ? 100 : 50;
    galleryWall.style.transform = `translateX(-${currentSlide * slidePercentage}%)`;

    const backgroundOffset = -(currentSlide * window.innerWidth * 0.75);
    backgroundWall.style.transform = `translateX(${backgroundOffset}px)`;

    const profileOffset = -(currentSlide * artistProfile.offsetWidth);
    artistProfile.style.transform = `translateX(${profileOffset}px)`;

    if (fromArtworksButton || currentSlide > 0) {
        isProfileVisible = false;
        artistCard.classList.add('visible');
        if (window.innerWidth <= 768) {
            artistProfile.classList.add('hidden');
        }
    } else {
        isProfileVisible = true;
        artistCard.classList.remove('visible');
        artistProfile.classList.remove('hidden');
    }

    spotlight.classList.add('visible');
    setTimeout(() => {
        spotlight.classList.remove('visible');
    }, 1000);

    if (fromArtworksButton) {
        artistProfile.style.transform = `translateX(-${artistProfile.offsetWidth}px)`;
    }

    visibleArtworks.forEach((artwork, i) => {
        const description = artwork.querySelector('.label p:not(.artwork-details)');
        const details = artwork.querySelector('.label .artwork-details');

        if (i === currentSlide) {
            const artworkIndex = Array.from(artworks).indexOf(artwork);
            if (!hasAppeared[artworkIndex]) {
                description.classList.add('visible');
                details.classList.add('visible');
                hasAppeared[artworkIndex] = true;
            }
        }
    });
}

// Eserleri kategoriye göre filtreleme (solma efekti ile)
function filterArtworks(category) {
    const currentlyVisibleArtworks = Array.from(artworks).filter(artwork => artwork.style.display !== 'none');
    currentlyVisibleArtworks.forEach(artwork => {
        artwork.classList.remove('fade-in');
        artwork.classList.add('fade-out');
    });

    setTimeout(() => {
        artworks.forEach(artwork => {
            artwork.style.display = 'none';
            artwork.classList.remove('fade-out');
        });

        const visibleArtworks = Array.from(artworks).filter(artwork => {
            const artworkCategory = artwork.getAttribute('data-category');
            if (category === 'all') {
                artwork.style.display = 'flex';
                artwork.classList.add('fade-in');
                return true;
            } else if (artworkCategory === category) {
                artwork.style.display = 'flex';
                artwork.classList.add('fade-in');
                return true;
            }
            return false;
        });

        currentSlide = 0;
        goToSlide(0, true);
    }, 500);
}

// Dil değiştirme fonksiyonu
function changeLanguage(lang) {
    currentLang = lang;

    document.querySelectorAll('.menu-item').forEach(item => {
        const target = item.getAttribute('data-target');
        if (target === 'about') {
            item.textContent = lang === 'tr' ? 'Hakkında' : 'About';
        } else if (target === 'artworks') {
            item.textContent = lang === 'tr' ? 'Eserleri' : 'Artworks';
        } else if (target === 'awards') {
            item.textContent = lang === 'tr' ? 'Ödülleri' : 'Awards';
        } else if (target === 'contact') {
            item.textContent = lang === 'tr' ? 'İletişim' : 'Contact';
        }
    });

    document.querySelectorAll('.submenu-item').forEach(item => {
        const category = item.getAttribute('data-category');
        if (category === 'resim') {
            item.textContent = lang === 'tr' ? 'Resim' : 'Painting';
        } else if (category === 'heykel') {
            item.textContent = lang === 'tr' ? 'Heykel' : 'Sculpture';
        }
    });

    document.querySelectorAll('[data-lang-tr][data-lang-en]').forEach(element => {
        if (element.classList.contains('social-link')) {
            const linkText = element.getAttribute(`data-lang-${lang}`);
            if (linkText) {
                element.textContent = linkText;
            }
        } else if (element.classList.contains('artist-title')) {
            element.textContent = element.getAttribute(`data-lang-${lang}`);
        } else if (element.classList.contains('artwork-details')) {
            element.textContent = element.getAttribute(`data-lang-${lang}`);
        } else {
            const baseText = element.getAttribute(`data-lang-${lang}`);
            const socialLink = element.querySelector('.social-link');
            if (socialLink) {
                element.childNodes[0].textContent = baseText;
                const linkText = socialLink.getAttribute(`data-lang-${lang}`);
                if (linkText) {
                    socialLink.textContent = linkText;
                }
            } else {
                element.textContent = baseText;
            }
        }
    });

    document.querySelectorAll('.popup-content .about-text').forEach(element => {
        element.classList.remove('active');
        if (element.hasAttribute(`data-lang-${lang}`)) {
            element.classList.add('active');
        }
    });

    const artworkGalleryPopup = document.getElementById('artwork-gallery');
    if (artworkGalleryPopup.style.display === 'flex') {
        const description = artworkGalleryPopup.querySelector('.artwork-gallery-header p');
        if (description) {
            description.textContent = description.getAttribute(`data-lang-${lang}`);
        }
    }
}

// Dil bayraklarına tıklama olayları
document.querySelectorAll('.lang-flag').forEach(flag => {
    flag.addEventListener('click', () => {
        const lang = flag.getAttribute('data-lang');
        changeLanguage(lang);
    });
});

// Menü tıklama olayları
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.getAttribute('data-target');

        if (target === 'artworks') {
            if (window.innerWidth <= 768) {
                const parentLi = item.parentElement;
                parentLi.classList.toggle('active');
            }
        } else {
            const popup = document.getElementById(target);
            popup.style.display = 'flex';
            changeLanguage(currentLang);
        }
    });
});

// Alt menü tıklama olayları
document.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const category = item.getAttribute('data-category');
        filterArtworks(category);
        resetAutoScroll();

        if (window.innerWidth <= 768) {
            const parentLi = item.closest('.has-submenu');
            parentLi.classList.remove('active');
        }
    });
});

// Pop-up kapatma (çarpı butonu ile)
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.popup').style.display = 'none';
        if (!isProfileVisible) {
            artistCard.classList.add('visible');
        }
        if (isAutoScrollPaused) {
            startAutoScroll();
            isAutoScrollPaused = false;
        }
    });
});

// Pop-up dışına tıklayınca kapatma
document.querySelectorAll('.popup').forEach(popup => {
    popup.addEventListener('click', (e) => {
        if (e.target.closest('.popup-content')) return;
        popup.style.display = 'none';
        if (!isProfileVisible) {
            artistCard.classList.add('visible');
        }
        if (isAutoScrollPaused) {
            startAutoScroll();
            isAutoScrollPaused = false;
        }
    });
});

// Artist Card'a tıklama olayı (profil alanını geri getir)
artistCard.addEventListener('click', () => {
    goToSlide(0);
    filterArtworks('all');
    resetAutoScroll();
});

// Gallery Wall'a tıklama olayı (mobil versiyonda profil alanını kapat)
galleryWall.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && isProfileVisible) {
        if (e.target.closest('.artwork-image') || e.target.closest('.label')) return;
        goToSlide(0, true);
        resetAutoScroll();
    }
});

// Fare tekerleği ile kaydırma
document.querySelector('.gallery-container').addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const newSlide = currentSlide + delta;
    const visibleArtworks = Array.from(artworks).filter(artwork => artwork.style.display !== 'none');
    if (newSlide >= 0 && newSlide < visibleArtworks.length) {
        goToSlide(newSlide);
        resetAutoScroll();
    }
});

// Dokunmatik ekran için kaydırma
let touchStartX = 0;
document.querySelector('.gallery-container').addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

document.querySelector('.gallery-container').addEventListener('touchmove', (e) => {
    const touchMoveX = e.touches[0].clientX;
    const diff = touchStartX - touchMoveX;
    if (Math.abs(diff) > 30) {
        const delta = Math.sign(diff);
        const newSlide = currentSlide + delta;
        const visibleArtworks = Array.from(artworks).filter(artwork => artwork.style.display !== 'none');
        if (newSlide >= 0 && newSlide < visibleArtworks.length) {
            goToSlide(newSlide);
            touchStartX = touchMoveX;
            resetAutoScroll();
        }
    }
});

// Eser resmine tıklama olayı (hem mobil hem masaüstü için pop-up galeri)
function setupArtworkImages(loadedArtworks) {
    document.querySelectorAll('.artwork-image').forEach((image) => {
        image.setAttribute('draggable', 'false');
        image.setAttribute('onselectstart', 'return false');

        image.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        image.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        image.addEventListener('click', () => {
            const artworkId = image.getAttribute('data-artwork-id');
            const artworkGalleryPopup = document.getElementById('artwork-gallery');
            const galleryImagesContainer = artworkGalleryPopup.querySelector('.artwork-gallery-images');
            const galleryHeader = artworkGalleryPopup.querySelector('.artwork-gallery-header');

            const label = image.closest('.artwork').querySelector('.label');
            const artworkTitle = label.querySelector('h2').textContent;
            const artworkDescription = label.querySelector('p:not(.artwork-details)');

            galleryHeader.querySelector('h2').textContent = artworkTitle;
            const descriptionP = galleryHeader.querySelector('p');
            descriptionP.textContent = artworkDescription.getAttribute(`data-lang-${currentLang}`);
            descriptionP.setAttribute('data-lang-tr', artworkDescription.getAttribute('data-lang-tr'));
            descriptionP.setAttribute('data-lang-en', artworkDescription.getAttribute('data-lang-en'));

            galleryImagesContainer.innerHTML = '';

            const mainImage = document.createElement('img');
            mainImage.src = image.src;
            galleryImagesContainer.appendChild(mainImage);

            const artworkData = loadedArtworks.find(art => art.main_image === image.src);
            if (artworkData.detail_image_1) {
                const detailImage1 = document.createElement('img');
                detailImage1.src = artworkData.detail_image_1;
                galleryImagesContainer.appendChild(detailImage1);
            }
            if (artworkData.detail_image_2) {
                const detailImage2 = document.createElement('img');
                detailImage2.src = artworkData.detail_image_2;
                galleryImagesContainer.appendChild(detailImage2);
            }

            artworkGalleryPopup.style.display = 'flex';

            if (!isAutoScrollPaused) {
                clearInterval(autoScrollInterval);
                isAutoScrollPaused = true;
            }
        });
    });
}

// Klavye navigasyonu
document.addEventListener('keydown', (e) => {
    const artworkGalleryPopup = document.getElementById('artwork-gallery');
    const galleryImagesContainer = artworkGalleryPopup.querySelector('.artwork-gallery-images');

    if (artworkGalleryPopup.style.display === 'flex' && window.innerWidth > 768) {
        if (e.key === 'ArrowRight') {
            galleryImagesContainer.scrollLeft += 300;
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            galleryImagesContainer.scrollLeft -= 300;
            e.preventDefault();
        }
    } else {
        const visibleArtworks = Array.from(artworks).filter(artwork => artwork.style.display !== 'none');
        if (e.key === 'ArrowRight') {
            const newSlide = currentSlide + 1;
            if (newSlide < visibleArtworks.length) {
                goToSlide(newSlide);
                resetAutoScroll();
            }
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            const newSlide = currentSlide - 1;
            if (newSlide >= 0) {
                goToSlide(newSlide);
                resetAutoScroll();
            }
            e.preventDefault();
        }
    }
});

// Otomatik kaydırma fonksiyonu
function startAutoScroll() {
    autoScrollInterval = setInterval(() => {
        const visibleArtworks = Array.from(artworks).filter(artwork => artwork.style.display !== 'none');
        let newSlide = currentSlide + autoScrollDirection;

        if (newSlide >= visibleArtworks.length) {
            autoScrollDirection = -1;
            newSlide = currentSlide - 1;
        } else if (newSlide < 0) {
            autoScrollDirection = 1;
            newSlide = currentSlide + 1;
        }

        goToSlide(newSlide);
    }, 3000);
}

// Otomatik kaydırmayı sıfırlama ve yeniden başlatma
function resetAutoScroll() {
    clearInterval(autoScrollInterval);
    if (!isAutoScrollPaused) {
        startAutoScroll();
    }
}

// Eserleri yükle ve başlat
loadArtworks().then((loadedArtworks) => {
    setupArtworkImages(loadedArtworks);
    goToSlide(0);
    startAutoScroll();
    changeLanguage('tr');
});
