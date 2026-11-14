/* ==========================================
   BAZOR - LÓGICA DINÁMICA DEL CATÁLOGO & INTERACTIVIDAD 3D
   ========================================== */

const PHONE_NUMBER = "573016545328";

// ⚠️ PEGA AQUÍ TU URL DE GOOGLE APPS SCRIPT ENTRE LAS COMILLAS
const SHEETS_API_URL = ""; 

let allProducts = [];

let activeCategory = 'Todos';
let activeGender = 'Todos';
let activeBrand = 'Todas';

document.addEventListener('DOMContentLoaded', () => {
    initInteractiveLogos();
    loadProducts();
    setupNavigation();
    setupSearch();
});

// Interactividad 3D al mover el mouse en los logos de BAZOR
function initInteractiveLogos() {
    const logos = document.querySelectorAll('.bazor-logo-anim');
    
    logos.forEach(wrapper => {
        const img = wrapper.querySelector('img');
        if (!img) return;

        wrapper.addEventListener('mousemove', (e) => {
            const rect = wrapper.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -18;
            const rotateY = ((x - centerX) / centerX) * 18;

            img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.06)`;
        });

        wrapper.addEventListener('mouseleave', () => {
            img.style.transform = '';
        });
    });
}

// Función para convertir enlaces de Google Drive en imágenes directas
function formatDriveImage(url) {
    if (!url) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
    
    const urlStr = url.toString().trim();
    const match = urlStr.match(/\/d\/([a-zA-Z0-9_-]+)/) || urlStr.match(/id=([a-zA-Z0-9_-]+)/);
    
    if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
    
    return urlStr;
}

// Función para formatear el precio en Pesos Colombianos ($160.000)
function formatCOP(price) {
    if (!price && price !== 0) return '$0';
    
    const numericValue = Number(price.toString().replace(/[^0-9.-]+/g, ""));
    
    if (isNaN(numericValue)) return price;
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericValue);
}

// Cargar productos desde Google Sheets
async function loadProducts() {
    const container = document.getElementById('products-container');
    if (container) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--silver-metallic); padding: 40px;">Cargando catálogo...</p>`;
    }

    if (SHEETS_API_URL && SHEETS_API_URL !== "") {
        try {
            const response = await fetch(SHEETS_API_URL);
            const data = await response.json();
            if (data && data.length > 0) {
                allProducts = data;
            }
        } catch (error) {
            console.error("Error al cargar datos de Google Sheets:", error);
        }
    }
    applyFilters();
}

// Renderizar tarjetas de producto con soporte para columna de talla independiente
function renderProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = '';

    const availableProducts = products.filter(p => !p.estado || p.estado.toString().toLowerCase().trim() === 'disponible');

    if (availableProducts.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--silver-metallic); padding: 40px; font-weight: 600;">No se encontraron productos disponibles con estos filtros.</p>`;
        return;
    }

    availableProducts.forEach(product => {
        const formattedPrice = formatCOP(product.precio);
        const directImageUrl = formatDriveImage(product.imagen);
        
        const tallaText = product.talla ? ` • Talla: ${product.talla}` : '';
        const subtitleText = `${product.categoria ? product.categoria : ''} ${product.genero ? '• ' + product.genero : ''}${tallaText}`;

        const message = encodeURIComponent(`Hola, estoy interesado en el producto "${product.nombre}"${tallaText} (${formattedPrice}) de BAZOR. ¿Me pueden brindar más información?`);
        const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${message}`;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-container">
                <img src="${directImageUrl}" alt="${product.nombre}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'">
            </div>
            <div class="product-details">
                <span class="product-brand">${subtitleText}</span>
                <h3 class="product-title">${product.nombre}</h3>
                <p class="product-price">${formattedPrice}</p>
                <a href="${whatsappUrl}" target="_blank" class="btn-whatsapp">
                    <i class="fa-brands fa-whatsapp"></i> Consultar por WhatsApp
                </a>
            </div>
        `;
        container.appendChild(card);
    });
}

// Filtrar por Categoría
function filterCategory(category) {
    activeCategory = category;
    activeBrand = 'Todas';
    applyFilters();

    document.querySelectorAll('.filter-btn').forEach(btn => {
        const btnText = btn.textContent.trim().toLowerCase();
        btn.classList.toggle('active', btnText === category.toLowerCase());
    });
}

// Filtrar por Género
function filterGender(gender) {
    activeGender = gender;
    applyFilters();
}

// Filtrar por Marca
function filterBrand(brand) {
    activeBrand = brand;
    applyFilters();
    scrollToSection('catalogo');
}

// Aplicar filtros combinados
function applyFilters() {
    const searchVal = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase().trim() : '';

    const filtered = allProducts.filter(p => {
        const pName = p.nombre ? p.nombre.toString().toLowerCase() : '';
        const pCat = p.categoria ? p.categoria.toString().trim().toLowerCase() : '';
        const pGen = p.genero ? p.genero.toString().trim().toLowerCase() : '';
        const pTalla = p.talla ? p.talla.toString().toLowerCase() : '';

        const matchesCategory = (activeCategory === 'Todos') || (pCat === activeCategory.toLowerCase());
        const matchesGender = (activeGender === 'Todos') || (pGen === activeGender.toLowerCase());
        const matchesBrand = (activeBrand === 'Todas') || pName.includes(activeBrand.toLowerCase());
        
        const matchesSearch = !searchVal || pName.includes(searchVal) || pTalla.includes(searchVal);

        return matchesCategory && matchesGender && matchesBrand && matchesSearch;
    });

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