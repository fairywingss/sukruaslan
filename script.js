let currentSlide = 0;
const galleryWall = document.querySelector('.gallery-wall');
const backgroundWall = document.querySelector('.background-wall');
const spotlight = document.querySelector('.spotlight');
const artistProfile = document.querySelector('.artist-profile');
const artistCard = document.querySelector('.artist-card');
const blurOverlay = document.querySelector('.blur-overlay');
const artworks = document.querySelectorAll('.artwork');
const totalSlides = artworks.length;
const backgroundWidth = 1920;
let autoScrollInterval;
let autoScrollDirection = 1;
let currentLang = 'tr';
const hasAppeared = Array(totalSlides).fill(false); // Hangi eserin göründüğünü takip etmek için
let isProfileVisible = true; // Profil alanının görünürlüğünü takip etmek için
let isAutoScrollPaused = false; // Otomatik kaydırmanın duraklatıldığını takip etmek için

// Slayt değiştirme fonksiyonu
function goToSlide(index, fromArtworksButton = false) {
    // Görünür eserleri yeniden hesapla
    const visibleArtworks = Array.from(artworks).filter(artwork => artwork.style.display !== 'none');
    if (index < 0 || index >= visibleArtworks.length) return;

    currentSlide = index;

    // Mobil cihazlarda her eser tam ekran genişliğinde olduğu için %100 kaydırma yapıyoruz
    const slidePercentage = window.innerWidth <= 768 ? 100 : 50;
    galleryWall.style.transform = `translateX(-${currentSlide * slidePercentage}%)`;

    const backgroundOffset = -(currentSlide * window.innerWidth * 0.75);
    backgroundWall.style.transform = `translateX(${backgroundOffset}px)`;

    // Sanatçı profilini kaydır
    const profileOffset = -(currentSlide * artistProfile.offsetWidth);
    artistProfile.style.transform = `translateX(${profileOffset}px)`;

    // Profil alanı kaybolduğunda kartı göster
    if (fromArtworksButton || currentSlide > 0) {
        isProfileVisible = false;
        artistCard.classList.add('visible');
        // Mobil cihazlarda profil alanını yavaşça sola kaydır
        if (window.innerWidth <= 768) {
            artistProfile.classList.add('hidden');
        }
    } else {
        isProfileVisible = true;
        artistCard.classList.remove('visible');
        // Profil alanını tekrar görünür yap (yavaşça geri kaydır)
        artistProfile.classList.remove('hidden');
    }

    // Spot ışığını belirginleştir ve kaybolmasını sağla
    spotlight.classList.add('visible');
    setTimeout(() => {
        spotlight.classList.remove('visible');
    }, 1000);

    // Eğer "Eserleri" butonundan geliyorsa, sol alanı kaydır
    if (fromArtworksButton) {
        artistProfile.style.transform = `translateX(-${artistProfile.offsetWidth}px)`;
    }

    // Eser animasyonlarını tetikle (açıklama ve detaylar için)
    visibleArtworks.forEach((artwork, i) => {
        const description = artwork.querySelector('.label p:not(.artwork-details)');
        const details = artwork.querySelector('.label .artwork-details');

        if (i === currentSlide) {
            // Eğer eser daha önce görünmediyse, açıklama ve detaylar belirecek
            const artworkIndex = Array.from(artworks).indexOf(artwork);
            if (!hasAppeared[artworkIndex]) {
                description.classList.add('visible');
                details.classList.add('visible');
                hasAppeared[artworkIndex] = true; // Eserin göründüğünü işaretle
            }
        }
    });
}

// Eserleri kategoriye göre filtreleme (solma efekti ile)
function filterArtworks(category) {
    // Önce mevcut görünür eserleri fade-out ile kaybolmaya başla
    const currentlyVisibleArtworks = Array.from(artworks).filter(artwork => artwork.style.display !== 'none');
    currentlyVisibleArtworks.forEach(artwork => {
        artwork.classList.remove('fade-in');
        artwork.classList.add('fade-out');
    });

    // Fade-out animasyonu tamamlandıktan sonra (0.5 saniye) yeni eserleri göster
    setTimeout(() => {
        // Tüm eserleri gizle
        artworks.forEach(artwork => {
            artwork.style.display = 'none';
            artwork.classList.remove('fade-out'); // Animasyon sınıfını sıfırla
        });

        // Yeni eserleri belirle ve fade-in ile göster
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

        // Slayt sayısını güncelle ve slaytı sıfırla
        currentSlide = 0;
        goToSlide(0, true);
    }, 500); // Fade-out animasyon süresi (0.5 saniye)
}

// Dil değiştirme fonksiyonu
function changeLanguage(lang) {
    currentLang = lang;

    // Menü başlıklarını güncelle
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

    // Alt menü başlıklarını güncelle
    document.querySelectorAll('.submenu-item').forEach(item => {
        const category = item.getAttribute('data-category');
        if (category === 'resim') {
            item.textContent = lang === 'tr' ? 'Resim' : 'Painting';
        } else if (category === 'heykel') {
            item.textContent = lang === 'tr' ? 'Heykel' : 'Sculpture';
        }
    });

    // Pop-up ve diğer metinleri güncelle
    document.querySelectorAll('[data-lang-tr][data-lang-en]').forEach(element => {
        if (element.classList.contains('social-link')) {
            const linkText = element.getAttribute(`data-lang-${lang}`);
            if (linkText) {
                element.textContent = linkText;
            }
        } else if (element.classList.contains('artist-title')) {
            // Sanatçı unvanını güncelle
            element.textContent = element.getAttribute(`data-lang-${lang}`);
        } else if (element.classList.contains('artwork-details')) {
            // Eser detaylarını güncelle (kategori bilgisi ile birlikte)
            const artwork = element.closest('.artwork');
            const category = artwork.getAttribute('data-category');
            const baseText = element.getAttribute(`data-lang-${lang}`).replace(/^(Resim|Heykel|Sculpture|Painting): /, '');
            const categoryText = category === 'resim' 
                ? (lang === 'tr' ? 'Resim: ' : 'Painting: ') 
                : (lang === 'tr' ? 'Heykel: ' : 'Sculpture: ');
            element.textContent = categoryText + baseText;
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

    // Pop-up içindeki dil bazlı metinleri güncelle
    document.querySelectorAll('.popup-content .about-text').forEach(element => {
        element.classList.remove('active');
        // Doğru dilin div'ini seçmek için özniteliği kontrol et
        if (element.hasAttribute(`data-lang-${lang}`)) {
            element.classList.add('active');
        }
    });

    // Artwork gallery pop-up'ındaki açıklama metnini güncelle
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
            // Mobil cihazlarda alt menüyü aç/kapat
            if (window.innerWidth <= 768) {
                const parentLi = item.parentElement;
                parentLi.classList.toggle('active');
            }
        } else {
            const popup = document.getElementById(target);
            popup.style.display = 'flex';
            // Pop-up açıldığında dil bazlı içeriği güncelle
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

        // Mobil cihazlarda alt menüyü kapat
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
        // Pop-up kapandığında, eğer profil alanı kaybolmuşsa kartı tekrar göster
        if (!isProfileVisible) {
            artistCard.classList.add('visible');
        }
        // Otomatik kaydırmayı yeniden başlat
        if (isAutoScrollPaused) {
            startAutoScroll();
            isAutoScrollPaused = false;
        }
    });
});

// Pop-up dışına tıklayınca kapatma
document.querySelectorAll('.popup').forEach(popup => {
    popup.addEventListener('click', (e) => {
        // Eğer tıklama .popup-content içindeyse, kapatma işlemini engelle
        if (e.target.closest('.popup-content')) return;
        popup.style.display = 'none';
        // Pop-up kapandığında, eğer profil alanı kaybolmuşsa kartı tekrar göster
        if (!isProfileVisible) {
            artistCard.classList.add('visible');
        }
        // Otomatik kaydırmayı yeniden başlat
        if (isAutoScrollPaused) {
            startAutoScroll();
            isAutoScrollPaused = false;
        }
    });
});

// Artist Card'a tıklama olayı (profil alanını geri getir)
artistCard.addEventListener('click', () => {
    goToSlide(0); // İlk slayta dön
    filterArtworks('all'); // Tüm eserleri göster
    resetAutoScroll();
});

// Gallery Wall'a tıklama olayı (mobil versiyonda profil alanını kapat)
galleryWall.addEventListener('click', (e) => {
    // Yalnızca mobil versiyonda ve profil alanı görünürken çalışsın
    if (window.innerWidth <= 768 && isProfileVisible) {
        // Tıklama, bir alt öğeden (örneğin .artwork-image) geliyorsa engelle
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
document.querySelectorAll('.artwork-image').forEach((image) => {
    // Resmi indirilemez yapmak için özellikler
    image.setAttribute('draggable', 'false');
    image.setAttribute('onselectstart', 'return false');

    // Sağ tıklama (context menu) engelleme
    image.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Basılı tutma ve sürükleme engelleme
    image.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    // Pop-up galeri açma
    image.addEventListener('click', () => {
        const artworkId = image.getAttribute('data-artwork-id');
        const artworkGalleryPopup = document.getElementById('artwork-gallery');
        const galleryImagesContainer = artworkGalleryPopup.querySelector('.artwork-gallery-images');
        const galleryHeader = artworkGalleryPopup.querySelector('.artwork-gallery-header');

        // Eser adı ve açıklamasını al
        const label = image.closest('.artwork').querySelector('.label');
        const artworkTitle = label.querySelector('h2').textContent;
        const artworkDescription = label.querySelector('p:not(.artwork-details)');

        // Header'ı güncelle
        galleryHeader.querySelector('h2').textContent = artworkTitle;
        const descriptionP = galleryHeader.querySelector('p');
        descriptionP.textContent = artworkDescription.getAttribute(`data-lang-${currentLang}`);
        descriptionP.setAttribute('data-lang-tr', artworkDescription.getAttribute('data-lang-tr'));
        descriptionP.setAttribute('data-lang-en', artworkDescription.getAttribute('data-lang-en'));

        // Mevcut içeriği temizle
        galleryImagesContainer.innerHTML = '';

        // Ana resmi ekle
        const mainImage = document.createElement('img');
        mainImage.src = image.src;
        galleryImagesContainer.appendChild(mainImage);

        // Detay resimlerini ekle
        for (let i = 1; i <= 2; i++) {
            const detailImage = document.createElement('img');
            // Heykel görselleri için dosya adını kontrol et
            if (artworkId.startsWith('heykel')) {
                detailImage.src = `images/${artworkId}-detail${i}.webp`;
            } else {
                detailImage.src = `images/art${artworkId}-detail${i}.jpg`;
            }
            galleryImagesContainer.appendChild(detailImage);
        }

        // Pop-up'ı aç
        artworkGalleryPopup.style.display = 'flex';

        // Otomatik kaydırmayı duraklat
        if (!isAutoScrollPaused) {
            clearInterval(autoScrollInterval);
            isAutoScrollPaused = true;
        }
    });
});

// Klavye navigasyonu
document.addEventListener('keydown', (e) => {
    const artworkGalleryPopup = document.getElementById('artwork-gallery');
    const galleryImagesContainer = artworkGalleryPopup.querySelector('.artwork-gallery-images');

    // Eğer pop-up galeri açıksa, ok tuşlarıyla resimler arasında kaydır
    if (artworkGalleryPopup.style.display === 'flex' && window.innerWidth > 768) { // Masaüstü versiyonunda çalışsın
        if (e.key === 'ArrowRight') {
            galleryImagesContainer.scrollLeft += 300; // Sağ ok tuşu: 300px sağa kaydır
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            galleryImagesContainer.scrollLeft -= 300; // Sol ok tuşu: 300px sola kaydır
            e.preventDefault();
        }
    } else {
        // Pop-up galeri kapalıysa, slaytlar arasında geçiş yap
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

// İlk slaytı ayarla ve otomatik kaydırmayı başlat
goToSlide(0);
filterArtworks('all'); // Varsayılan olarak tüm eserleri göster
startAutoScroll();

// Varsayılan dil: Türkçe
changeLanguage('tr');