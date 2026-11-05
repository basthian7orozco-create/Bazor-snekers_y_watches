/* ==========================================
   BAZOR - LÓGICA DEL CATÁLOGO Y SITIO WEB
   ========================================== */

// Configuración Comercial
const PHONE_NUMBER = "573016545328";

// Plantilla Base de Datos de Productos (Ejemplos con tus imágenes e información)
const sampleProducts = [
    {
        id: 1,
        nombre: "Reloj Curren Chronograph Tactico",
        categoria: "Relojes",
        marca: "Curren",
        modelo: "CR-8325",
        precio: "$140.000",
        descripcion: "Reloj táctico deportivo con pulsera de silicona negra, bisel en tono oro rosa y cronógrafo funcional.",
        colores: ["Negro / Oro Rosa"],
        tallas: ["Única"],
        imagen: "assets/products/reloj-curren.png",
        destacado: true
    },
    {
        id: 2,
        nombre: "Reloj Poedagar Elegance Steel",
        categoria: "Relojes",
        marca: "Poedagar",
        modelo: "PD-901",
        precio: "$160.000",
        descripcion: "Reloj elegante en acero inoxidable con dial azul texturizado e indicador de fecha.",
        colores: ["Plateado / Azul"],
        tallas: ["Única"],
        imagen: "assets/products/reloj-poedagar.png",
        destacado: true
    },
    {
        id: 3,
        nombre: "Sneakers Nike Dunk Low Retro",
        categoria: "Sneakers",
        marca: "Nike",
        modelo: "Dunk Low Black White",
        precio: "$280.000",
        descripcion: "Diseño clásico urbano en cuero sintético blanco y negro con la mejor comodidad.",
        colores: ["Blanco / Negro"],
        tallas: ["38", "39", "40", "41", "42"],
        imagen: "assets/products/sneaker-nike.jpg",
        destacado: true
    },
    {
        id: 4,
        nombre: "Sneakers Adidas Superstar Classic",
        categoria: "Sneakers",
        marca: "Adidas",
        modelo: "Superstar Iconic",
        precio: "$250.000",
        descripcion: "Icónico diseño de tres rayas negras sobre cuerpo blanco, ideal para uso diario.",
        colores: ["Blanco / Negro"],
        tallas: ["37", "38", "39", "40", "41"],
        imagen: "assets/products/sneaker-adidas.jpg",
        destacado: false
    }
];

let activeCategory = 'Todos';
let activeBrand = 'Todas';

document.addEventListener('DOMContentLoaded', () => {
    renderProducts(sampleProducts);
    setupNavigation();
    setupSearch();
});

// Renderizar la lista de productos
function renderProducts(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-gray);">No se encontraron productos disponibles.</p>`;
        return;
    }

    products.forEach(product => {
        const message = encodeURIComponent(`Hola, estoy interesado en el producto "${product.nombre}" de BAZOR. ¿Me pueden brindar más información?`);
        const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${message}`;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.imagen}" alt="${product.nombre}" class="product-img" onerror="this.src='https://via.placeholder.com/300x240/1f1f1f/ffffff?text=BAZOR'">
            <div class="product-details">
                <span class="product-brand">${product.marca}</span>
                <h3 class="product-title">${product.nombre}</h3>
                <p class="product-price">${product.precio}</p>
                <a href="${whatsappUrl}" target="_blank" class="btn-whatsapp">
                    <i class="fa-brands fa-whatsapp"></i> Consultar por WhatsApp
                </a>
            </div>
        `;
        container.appendChild(card);
    });
}

// Filtro por Categoría
function filterCategory(category) {
    activeCategory = category;
    activeBrand = 'Todas';
    applyFilters();

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === category);
    });
}

// Filtro por Marca
function filterBrand(brand) {
    activeBrand = brand;
    applyFilters();
    scrollToSection('catalogo');
}

// Aplicar combinación de filtros
function applyFilters() {
    const searchVal = document.getElementById('search-input').value.toLowerCase();

    const filtered = sampleProducts.filter(p => {
        const matchesCategory = (activeCategory === 'Todos') || (p.categoria === activeCategory);
        const matchesBrand = (activeBrand === 'Todas') || (p.marca.toLowerCase() === activeBrand.toLowerCase());
        const matchesSearch = p.nombre.toLowerCase().includes(searchVal) || 
                              p.marca.toLowerCase().includes(searchVal) || 
                              p.modelo.toLowerCase().includes(searchVal);

        return matchesCategory && matchesBrand && matchesSearch;
    });

    renderProducts(filtered);
}

// Búsqueda en tiempo real
function setupSearch() {
    const input = document.getElementById('search-input');
    input.addEventListener('input', applyFilters);
}

// Navegación fluida y Menú móvil
function setupNavigation() {
    const toggle = document.getElementById('mobile-menu');
    const nav = document.getElementById('navbar');

    toggle.addEventListener('click', () => {
        nav.classList.toggle('show');
    });
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}