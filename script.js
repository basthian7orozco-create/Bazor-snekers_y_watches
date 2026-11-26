/* ==========================================
   BAZOR - LÓGICA DINÁMICA DEL CATÁLOGO (GOOGLE SHEETS)
   ========================================== */

const PHONE_NUMBER = "573016545328";
const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbw42TWMGX1LlVUd2_61PRGPfGCmKy-X0mllQY-kfVA6tGGCsAWSfF-Ldi_sQKvamz4R/exec";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80";

const SAMPLE_PRODUCTS = [
    {
        id: "1",
        nombre: "Nike Air Jordan 1 Retro High OG 'Patent Bred'",
        marca: "Jordan",
        categoria: "Sneakers",
        genero: "Unisex",
        calidad: "Original",
        precio: 210000,
        precio_anterior: 250000,
        talla: "38 - 43",
        imagen: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80, https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
        descripcion_imagenes: "Vista lateral del modelo Patent Bred; Detalle del contraste negro y rojo",
        descripcion: "Silueta clásica de corte alto con acabado brillante tipo charol y contraste negro, rojo y blanco.",
        detalles: "Calidad: Original; Material exterior: Cuero sintético premium; Suela: Goma de alta tracción; Uso: Urbano / Casual",
        envio: "Envíos seguros a todo Colombia. Pago contra entrega disponible en Medellín y Valle de Aburrá.",
        garantia: "Garantía BAZOR por defectos de fabricación y asesoría personalizada antes del envío.",
        estado: "Disponible"
    },
    {
        id: "2",
        nombre: "Nike V5 RNR",
        marca: "Nike",
        categoria: "Sneakers",
        genero: "Mujer",
        calidad: "AAA",
        precio: 200000,
        precio_anterior: 230000,
        talla: "35 - 40",
        imagen: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80",
        descripcion_imagenes: "Vista general Nike V5 RNR",
        descripcion: "Tenis ligeros y cómodos con malla transpirable y suela amortiguada para uso diario.",
        detalles: "Calidad: AAA; Capellada: Malla transpirable y refuerzos sintéticos; Entresuela: Espuma ligera",
        envio: "Envíos a todo Colombia y pago contra entrega en el Área Metropolitana de Medellín.",
        garantia: "Garantía por defectos de fabricación.",
        estado: "Disponible"
    },
    {
        id: "3",
        nombre: "Curren Cronógrafo Ejecutivo",
        marca: "Curren",
        categoria: "Relojes",
        genero: "Hombre",
        calidad: "1.1",
        precio: 145000,
        precio_anterior: 180000,
        talla: "Pulso ajustable",
        imagen: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80",
        descripcion_imagenes: "Vista frontal del reloj Curren",
        descripcion: "Reloj de estilo elegante y deportivo con caja metálica resistente y diseño versátil.",
        detalles: "Calidad: 1.1; Caja: Aleación metálica; Estilo: Casual / Formal; Incluye: Estuche",
        envio: "Envío nacional con seguimiento y pago contra entrega en Medellín y Valle de Aburrá.",
        garantia: "Garantía por maquinaria y defectos de fábrica.",
        estado: "Disponible"
    }
];

let allProducts = [];
let activeCategory = 'Todos';
let activeGender = 'Todos';
let activeQuality = 'Todos';
let activeBrand = 'Todas';
let currentModalProduct = null;
const cardImageIndexes = new Map();

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupNavigation();
    setupSearch();
});

/* Lee campos del JSON de Google Sheets sin importar mayúsculas o espacios */
function getField(product, keys) {
    if (!product) return '';
    for (const key of keys) {
        if (product[key] !== undefined && product[key] !== null && String(product[key]).trim() !== '') {
            return product[key];
        }
    }
    const lowerMap = {};
    Object.keys(product).forEach(k => {
        lowerMap[k.toLowerCase().replace(/\s+/g, '_').trim()] = product[k];
    });
    for (const key of keys) {
        const normKey = key.toLowerCase().replace(/\s+/g, '_').trim();
        if (lowerMap[normKey] !== undefined && lowerMap[normKey] !== null && String(lowerMap[normKey]).trim() !== '') {
            return lowerMap[normKey];
        }
    }
    return '';
}

function handleBrandLogoError(imgElement, brandLabel) {
    const rawCandidates = imgElement.dataset.candidates || '';
    const candidates = rawCandidates.split(',').map(s => s.trim()).filter(Boolean);
    const currentIdx = Number(imgElement.dataset.candidateIdx || 0);
    const nextIdx = currentIdx + 1;

    if (nextIdx < candidates.length) {
        imgElement.dataset.candidateIdx = String(nextIdx);
        imgElement.src = candidates[nextIdx];
        return;
    }

    const parent = imgElement.parentElement;
    if (parent) {
        imgElement.remove();
        parent.style.background = 'var(--bg-card)';
        parent.textContent = brandLabel;
    }
}

function formatDriveImage(url) {
    if (!url) return FALLBACK_IMAGE;
    const urlStr = url.toString().trim();
    if (!urlStr) return FALLBACK_IMAGE;

    const match = urlStr.match(/\/d\/([a-zA-Z0-9_-]+)/) || urlStr.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
    return urlStr;
}

function getProductImages(product) {
    const raw = getField(product, ['imagen', 'imagenes', 'fotos', 'foto']);
    const parts = raw
        .toString()
        .split(/[\n,|]+/)
        .map(item => item.trim())
        .filter(Boolean)
        .map(formatDriveImage);

    return parts.length > 0 ? parts : [FALLBACK_IMAGE];
}

function getImageCaptions(product, totalImages) {
    const rawCaptions = getField(product, ['descripcion_imagenes', 'descripciones_imagen']);
    const nombre = getField(product, ['nombre']) || 'producto';
    const list = rawCaptions
        .toString()
        .split(/[;\n|]+/)
        .map(s => s.trim());

    const result = [];
    for (let i = 0; i < totalImages; i++) {
        result.push(list[i] || `Vista ${i + 1} de ${nombre}`);
    }
    return result;
}

function parseNumber(val) {
    if (val === undefined || val === null || val === '') return 0;
    const cleanStr = val.toString().replace(/COP/gi, '').replace(/\$/g, '').replace(/\s+/g, '').trim();
    const num = Number(cleanStr.replace(/\./g, '').replace(/,/g, '.'));
    return isNaN(num) ? 0 : num;
}

function formatCOP(price) {
    const numericValue = parseNumber(price);
    const formatted = new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericValue);
    return `COP ${formatted}`;
}

function getDiscountInfo(product) {
    const precioActual = parseNumber(getField(product, ['precio', 'precio_final', 'valor']));
    const precioAnterior = parseNumber(getField(product, ['precio_anterior', 'Precio anterior', 'precio_original', 'antes']));
    const descuentoManual = parseNumber(getField(product, ['descuento', 'porcentaje_descuento']));

    let porcentaje = 0;
    let ahorro = 0;

    if (precioAnterior > precioActual && precioActual > 0) {
        ahorro = precioAnterior - precioActual;
        porcentaje = descuentoManual > 0
            ? Math.round(descuentoManual)
            : Math.round((ahorro / precioAnterior) * 100);
    } else if (descuentoManual > 0) {
        porcentaje = Math.round(descuentoManual);
    }

    return {
        hasDiscount: porcentaje > 0,
        percentage: porcentaje,
        oldPrice: precioAnterior,
        currentPrice: precioActual,
        savings: ahorro
    };
}

function normalizeQuality(rawQuality) {
    const clean = (rawQuality || '').toString().trim();
    const lower = normalizeText(clean);
    if (!lower) return '';
    if (lower.includes('original')) return 'Original';
    if (lower.includes('1.1') || lower.includes('1,1') || lower.startsWith('2026-01-01')) return '1.1';
    if (lower.includes('aaa')) return 'AAA';
    return clean;
}

function getQualityBadgeHTML(rawQuality) {
    const quality = normalizeQuality(rawQuality);
    if (!quality) return '';

    let cssClass = 'quality-aaa';
    if (quality === 'Original') cssClass = 'quality-original';
    else if (quality === '1.1') cssClass = 'quality-11';

    return `<span class="quality-badge ${cssClass}">${escapeHTML(quality)}</span>`;
}

function escapeHTML(str) {
    return (str || '').toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function loadProducts() {
    const container = document.getElementById('products-container');
    if (container) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--silver-metallic); padding: 40px;">Cargando catálogo...</p>`;
    }

    if (SHEETS_API_URL && SHEETS_API_URL.trim() !== "") {
        try {
            const response = await fetch(SHEETS_API_URL);
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                allProducts = data;
            } else {
                allProducts = SAMPLE_PRODUCTS;
            }
        } catch (error) {
            console.warn("Usando catálogo de respaldo por error de conexión:", error);
            allProducts = SAMPLE_PRODUCTS;
        }
    } else {
        allProducts = SAMPLE_PRODUCTS;
    }

    applyFilters();
}

function renderProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = '';

    const availableProducts = products.filter(p => {
        const state = getField(p, ['estado', 'disponibilidad']).toString().toLowerCase().trim();
        return state === 'disponible' || state === 'activo' || state === '';
    });

    if (availableProducts.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--silver-metallic); padding: 40px;">
                <p style="font-weight: 700; margin-bottom: 14px;">No se encontraron productos con estos filtros.</p>
                <button type="button" class="filter-btn active" onclick="resetFiltersAndScroll()">Ver todo el catálogo</button>
            </div>
        `;
        return;
    }

    availableProducts.forEach((product, idx) => {
        const nombre = getField(product, ['nombre', 'producto', 'titulo']);
        const marca = getField(product, ['marca']);
        const categoria = getField(product, ['categoria']);
        const genero = getField(product, ['genero']);
        const talla = getField(product, ['talla', 'tallas']);
        const calidad = getField(product, ['calidad']);

        const key = getField(product, ['id']) ? String(getField(product, ['id'])) : `idx-${idx}`;
        const images = getProductImages(product);
        const activeImgIndex = cardImageIndexes.get(key) || 0;
        const safeImgIndex = activeImgIndex < images.length ? activeImgIndex : 0;

        const discount = getDiscountInfo(product);
        const qualityBadge = getQualityBadgeHTML(calidad);

        const subtitleParts = [marca, categoria, genero].filter(Boolean);
        const subtitleText = subtitleParts.join(' • ');
        const tallaText = talla ? `Talla disponible: ${escapeHTML(talla)}` : '';

        const waMsg = encodeURIComponent(
            `Hola BAZOR, quiero preguntar por "${nombre}"${talla ? ' (Talla: ' + talla + ')' : ''} - ${formatCOP(discount.currentPrice)}. ¿Me brindan información?`
        );
        const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${waMsg}`;

        const multiPhotoControls = images.length > 1 ? `
            <button type="button" class="card-img-nav prev" onclick="cycleCardImage('${key}', ${images.length}, -1, event)" title="Foto anterior">&#10094;</button>
            <button type="button" class="card-img-nav next" onclick="cycleCardImage('${key}', ${images.length}, 1, event)" title="Siguiente foto">&#10095;</button>
            <div class="card-dots">
                ${images.map((_, dIdx) => `
                    <button type="button" class="card-dot ${dIdx === safeImgIndex ? 'active' : ''}" onclick="setCardImage('${key}', ${dIdx}, event)" aria-label="Foto ${dIdx + 1}"></button>
                `).join('')}
            </div>
        ` : '';

        const priceHTML = discount.hasDiscount
            ? `
                ${discount.oldPrice > discount.currentPrice ? `<span class="price-old">${formatCOP(discount.oldPrice)}</span>` : ''}
                <div class="price-current-row">
                    <span class="price-current">${formatCOP(discount.currentPrice)}</span>
                    ${discount.savings > 0 ? `<span class="savings-tag">Ahorra ${formatCOP(discount.savings)}</span>` : ''}
                </div>
            `
            : `
                <div class="price-current-row">
                    <span class="price-current">${formatCOP(discount.currentPrice)}</span>
                </div>
            `;

        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-container">
                ${discount.hasDiscount ? `<span class="discount-pill">-${discount.percentage}%</span>` : ''}
                <img src="${images[safeImgIndex]}" alt="${escapeHTML(nombre)}" class="product-img" onclick="openProductDetailByIndex(${idx})" onerror="this.src='${FALLBACK_IMAGE}'">
                ${multiPhotoControls}
            </div>
            <div class="product-details">
                <div class="product-meta-top">
                    <span class="product-brand">${escapeHTML(subtitleText)}</span>
                    ${qualityBadge}
                </div>
                <h3 class="product-title">${escapeHTML(nombre)}</h3>
                ${tallaText ? `<p class="product-size-line">${tallaText}</p>` : ''}
                <div class="price-block">${priceHTML}</div>
                <div class="card-buttons-group">
                    <button type="button" class="btn-details" onclick="openProductDetailByIndex(${idx})">
                        <i class="fa-regular fa-eye"></i> Ver Detalles
                    </button>
                    <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp">
                        <i class="fa-brands fa-whatsapp"></i> Pregunta por este producto por WhatsApp
                    </a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    window._lastRenderedProducts = availableProducts;
}

function cycleCardImage(key, total, step, event) {
    if (event) event.stopPropagation();
    const current = cardImageIndexes.get(key) || 0;
    const next = (current + step + total) % total;
    cardImageIndexes.set(key, next);
    applyFilters();
}

function setCardImage(key, index, event) {
    if (event) event.stopPropagation();
    cardImageIndexes.set(key, index);
    applyFilters();
}

function openProductDetailByIndex(index) {
    const list = window._lastRenderedProducts || [];
    if (list[index]) {
        openProductDetail(list[index]);
    }
}

function openProductDetail(product) {
    currentModalProduct = product;

    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    const nombre = getField(product, ['nombre', 'producto', 'titulo']);
    const marca = getField(product, ['marca']);
    const categoria = getField(product, ['categoria']);
    const genero = getField(product, ['genero']);
    const talla = getField(product, ['talla', 'tallas']);
    const calidad = getField(product, ['calidad']);

    const images = getProductImages(product);
    const captions = getImageCaptions(product, images.length);
    const discount = getDiscountInfo(product);

    const mainImg = document.getElementById('detail-main-img');
    const captionEl = document.getElementById('detail-img-caption');
    const thumbsContainer = document.getElementById('detail-thumbs');
    const discountBadge = document.getElementById('detail-discount-badge');

    mainImg.src = images[0];
    mainImg.alt = nombre || 'Producto';
    mainImg.onerror = () => { mainImg.src = FALLBACK_IMAGE; };
    captionEl.textContent = captions[0] || '';

    if (discount.hasDiscount) {
        discountBadge.style.display = 'inline-block';
        discountBadge.textContent = `-${discount.percentage}%`;
    } else {
        discountBadge.style.display = 'none';
    }

    thumbsContainer.innerHTML = '';
    if (images.length > 1) {
        images.forEach((imgUrl, idx) => {
            const thumb = document.createElement('img');
            thumb.src = imgUrl;
            thumb.alt = captions[idx] || `${nombre} vista ${idx + 1}`;
            thumb.title = captions[idx] || '';
            thumb.className = `detail-thumb-img ${idx === 0 ? 'active' : ''}`;
            thumb.onerror = () => { thumb.src = FALLBACK_IMAGE; };
            thumb.onclick = () => {
                mainImg.src = imgUrl;
                captionEl.textContent = captions[idx] || '';
                thumbsContainer.querySelectorAll('img').forEach(el => el.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbsContainer.appendChild(thumb);
        });
    }

    const crumb = ['Catálogo', categoria, marca].filter(Boolean).join(' › ');
    document.getElementById('detail-breadcrumb').textContent = crumb;
    document.getElementById('detail-title').textContent = nombre || '';

    const qualityEl = document.getElementById('detail-quality-badge');
    const normalizedQuality = normalizeQuality(calidad);
    if (normalizedQuality) {
        qualityEl.style.display = 'inline-block';
        qualityEl.className = `quality-badge ${
            normalizedQuality === 'Original'
                ? 'quality-original'
                : normalizedQuality === '1.1'
                    ? 'quality-11'
                    : 'quality-aaa'
        }`;
        qualityEl.textContent = normalizedQuality;
    } else {
        qualityEl.style.display = 'none';
    }

    const oldPriceEl = document.getElementById('detail-old-price');
    const currentPriceEl = document.getElementById('detail-current-price');
    const savingsEl = document.getElementById('detail-savings-tag');

    currentPriceEl.textContent = formatCOP(discount.currentPrice);
    if (discount.hasDiscount && discount.oldPrice > discount.currentPrice) {
        oldPriceEl.style.display = 'block';
        oldPriceEl.textContent = formatCOP(discount.oldPrice);
    } else {
        oldPriceEl.style.display = 'none';
    }

    if (discount.savings > 0) {
        savingsEl.style.display = 'inline-block';
        savingsEl.textContent = `Ahorra ${formatCOP(discount.savings)}`;
    } else {
        savingsEl.style.display = 'none';
    }

    const metaParts = [];
    if (genero) metaParts.push(`Género: ${genero}`);
    if (talla) metaParts.push(`Talla disponible: ${talla}`);
    document.getElementById('detail-meta-info').textContent = metaParts.join('  •  ');

    const waMsg = encodeURIComponent(
        `Hola BAZOR, quiero preguntar por "${nombre}"${normalizedQuality ? ' (' + normalizedQuality + ')' : ''}${talla ? ' - Talla: ' + talla : ''} a ${formatCOP(discount.currentPrice)}.`
    );
    document.getElementById('detail-wa-link').href = `https://wa.me/${PHONE_NUMBER}?text=${waMsg}`;

    document.querySelectorAll('.detail-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === 'descripcion');
    });
    renderDetailTabContent('descripcion', product);
    renderRelatedProducts(product);

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function switchDetailTab(tabName) {
    document.querySelectorAll('.detail-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    if (currentModalProduct) {
        renderDetailTabContent(tabName, currentModalProduct);
    }
}

function renderDetailTabContent(tabName, product) {
    const bodyEl = document.getElementById('detail-tab-content');
    if (!bodyEl) return;

    const nombre = getField(product, ['nombre']);
    const marca = getField(product, ['marca']);
    const categoria = getField(product, ['categoria']);
    const talla = getField(product, ['talla', 'tallas']);
    const calidad = normalizeQuality(getField(product, ['calidad']));

    if (tabName === 'descripcion') {
        const desc = getField(product, ['descripcion']) ||
            `Producto ${nombre || ''} de BAZOR${calidad ? ' en calidad ' + calidad : ''}. Estilo, presencia y atención directa por WhatsApp.`;
        bodyEl.innerHTML = `<p>${escapeHTML(desc)}</p>`;
        return;
    }

    if (tabName === 'detalles') {
        const rawItems = getField(product, ['detalles']).toString().split(/[;\n]+/).map(s => s.trim()).filter(Boolean);
        if (rawItems.length === 0) {
            if (marca) rawItems.push(`Marca: ${marca}`);
            if (categoria) rawItems.push(`Categoría: ${categoria}`);
            if (calidad) rawItems.push(`Calidad: ${calidad}`);
            if (talla) rawItems.push(`Talla disponible: ${talla}`);
        }
        bodyEl.innerHTML = `
            <ul class="detail-list">
                ${rawItems.map(item => `<li><i class="fa-solid fa-circle-check"></i> ${escapeHTML(item)}</li>`).join('')}
            </ul>
        `;
        return;
    }

    if (tabName === 'envios') {
        const shippingText = getField(product, ['envio']) ||
            "Envíos seguros a todo Colombia. Pago contra entrega disponible en Medellín y Valle de Aburrá.";
        bodyEl.innerHTML = `<p><i class="fa-solid fa-truck-fast" style="color: var(--gold-accent); margin-right: 8px;"></i> ${escapeHTML(shippingText)}</p>`;
        return;
    }

    if (tabName === 'garantia') {
        const warrantyText = getField(product, ['garantia']) ||
            "Garantía por defectos de fabricación y acompañamiento personalizado por WhatsApp antes de confirmar tu pedido.";
        bodyEl.innerHTML = `<p><i class="fa-solid fa-shield-halved" style="color: var(--gold-accent); margin-right: 8px;"></i> ${escapeHTML(warrantyText)}</p>`;
    }
}

function renderRelatedProducts(currentProduct) {
    const gridEl = document.getElementById('detail-related-grid');
    if (!gridEl) return;

    const currentName = getField(currentProduct, ['nombre']);
    const currentCat = normalizeText(getField(currentProduct, ['categoria']));
    const currentBrand = normalizeText(getField(currentProduct, ['marca']));

    const candidates = allProducts.filter(p => {
        const pName = getField(p, ['nombre']);
        if (pName === currentName) return false;
        const sameCat = currentCat && normalizeText(getField(p, ['categoria'])) === currentCat;
        const sameBrand = currentBrand && normalizeText(getField(p, ['marca'])) === currentBrand;
        return sameCat || sameBrand || !currentCat;
    }).slice(0, 4);

    if (candidates.length === 0) {
        gridEl.innerHTML = `<p style="color: var(--silver-metallic); font-size: 0.88rem;">Explora más referencias directamente en el catálogo.</p>`;
        return;
    }

    gridEl.innerHTML = '';
    candidates.forEach(rel => {
        const relName = getField(rel, ['nombre']);
        const imgs = getProductImages(rel);
        const disc = getDiscountInfo(rel);
        const card = document.createElement('div');
        card.className = 'related-card';
        card.onclick = () => openProductDetail(rel);
        card.innerHTML = `
            <img src="${imgs[0]}" alt="${escapeHTML(relName)}" onerror="this.src='${FALLBACK_IMAGE}'">
            <div class="related-card-body">
                <div class="related-card-title">${escapeHTML(relName)}</div>
                <div class="related-card-price">${formatCOP(disc.currentPrice)} ${disc.hasDiscount ? `(-${disc.percentage}%)` : ''}</div>
            </div>
        `;
        gridEl.appendChild(card);
    });
}

function closeProductDetail() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function closeProductDetailOutside(event) {
    if (event.target.id === 'product-detail-modal') {
        closeProductDetail();
    }
}

function updateBrandActiveVisual() {
    const target = normalizeText(activeBrand);
    document.querySelectorAll('.brand-logo-card').forEach(card => {
        const cardBrand = normalizeText(card.dataset.brand);
        card.classList.toggle('active', activeBrand !== 'Todas' && cardBrand === target);
    });
}

function filterCategory(category) {
    activeCategory = category;
    activeBrand = 'Todas';
    updateBrandActiveVisual();
    applyFilters();

    document.querySelectorAll('.cat-btn').forEach(btn => {
        const btnText = btn.textContent.trim().toLowerCase();
        btn.classList.toggle('active', btnText === category.toLowerCase());
    });
}

function filterGender(gender) {
    activeGender = gender;
    applyFilters();

    document.querySelectorAll('.gen-btn').forEach(btn => {
        const btnText = btn.textContent.trim().toLowerCase();
        btn.classList.toggle('active', btnText === gender.toLowerCase());
    });
}

function filterQuality(quality) {
    activeQuality = quality;
    applyFilters();

    document.querySelectorAll('.qual-btn').forEach(btn => {
        const btnText = btn.textContent.trim().toLowerCase();
        const targetText = quality === 'Todos' ? 'calidad: todas' : quality.toLowerCase();
        btn.classList.toggle('active', btnText === targetText);
    });
}

function filterBrand(brand) {
    activeBrand = (activeBrand === brand) ? 'Todas' : brand;
    updateBrandActiveVisual();
    applyFilters();
    scrollToSection('catalogo');
}

function resetFiltersAndScroll() {
    activeCategory = 'Todos';
    activeGender = 'Todos';
    activeQuality = 'Todos';
    activeBrand = 'Todas';

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'default';

    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === 'todos'));
    document.querySelectorAll('.gen-btn').forEach(btn => btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === 'todos'));
    document.querySelectorAll('.qual-btn').forEach(btn => btn.classList.toggle('active', btn.textContent.trim().toLowerCase().startsWith('calidad: todas')));
    updateBrandActiveVisual();

    applyFilters();
    scrollToSection('catalogo');
}

function normalizeText(str) {
    return str ? str.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';
}

function applyFilters() {
    const rawSearch = document.getElementById('search-input') ? document.getElementById('search-input').value : '';
    const searchTerms = normalizeText(rawSearch).split(/\s+/).filter(Boolean);
    const sortMode = document.getElementById('sort-select') ? document.getElementById('sort-select').value : 'default';

    const filtered = allProducts.filter(p => {
        const pName = normalizeText(getField(p, ['nombre']));
        const pCat = normalizeText(getField(p, ['categoria']));
        const pGen = normalizeText(getField(p, ['genero']));
        const pTalla = normalizeText(getField(p, ['talla', 'tallas']));
        const pMarca = normalizeText(getField(p, ['marca']));
        const pCalidad = normalizeText(normalizeQuality(getField(p, ['calidad'])) || getField(p, ['calidad']));

        const matchesCategory = (activeCategory === 'Todos') || (pCat === normalizeText(activeCategory));
        const targetGen = normalizeText(activeGender);
        const matchesGender = (activeGender === 'Todos') || (pGen === targetGen) || (pGen === 'unisex');
        const matchesQuality = (activeQuality === 'Todos') || (pCalidad === normalizeText(activeQuality));

        const targetBrand = normalizeText(activeBrand);
        const matchesBrand = (activeBrand === 'Todas') || pName.includes(targetBrand) || pMarca.includes(targetBrand);

        const combinedProductText = `${pName} ${pCat} ${pGen} ${pTalla} ${pMarca} ${pCalidad}`;
        const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => combinedProductText.includes(term));

        return matchesCategory && matchesGender && matchesQuality && matchesBrand && matchesSearch;
    });

    if (sortMode === 'discount-desc') {
        filtered.sort((a, b) => getDiscountInfo(b).percentage - getDiscountInfo(a).percentage);
    } else if (sortMode === 'price-asc') {
        filtered.sort((a, b) => parseNumber(getField(a, ['precio'])) - parseNumber(getField(b, ['precio'])));
    } else if (sortMode === 'price-desc') {
        filtered.sort((a, b) => parseNumber(getField(b, ['precio'])) - parseNumber(getField(a, ['precio'])));
    }

    renderProducts(filtered);
}

function setupSearch() {
    const input = document.getElementById('search-input');
    if (input) {
        input.addEventListener('input', applyFilters);
    }
}

function setupNavigation() {
    const toggle = document.getElementById('mobile-menu');
    const nav = document.getElementById('navbar');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('show');
        });
    }
}

function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

function openSizeGuide() {
    const modal = document.getElementById('size-guide-modal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeSizeGuide() {
    const modal = document.getElementById('size-guide-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function closeSizeGuideOutside(event) {
    if (event.target.id === 'size-guide-modal') {
        closeSizeGuide();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductDetail();
        closeSizeGuide();
    }
});