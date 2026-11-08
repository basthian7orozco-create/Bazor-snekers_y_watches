/* ==========================================
   BAZOR - LÓGICA DINÁMICA DEL CATÁLOGO (GOOGLE SHEETS)
   ========================================== */

// Número de WhatsApp configurado para BAZOR
const PHONE_NUMBER = "573016545328";

// ⚠️ AQUÍ PEGARÁS LA URL QUE TE ENTREGUE GOOGLE APPS SCRIPT CUANDO CONECTEMOS LA HOJA
const SHEETS_API_URL = ""; 

// Arreglo temporal de respaldo (por si aún no está conectada la hoja, muestra productos de prueba)
let allProducts = [
    {
        id: "1",
        nombre: "Reloj Curren Chronograph Táctico",
        categoria: "Relojes",
        genero: "Hombre",
        marca: "Curren",
        modelo: "CR-8325",
        precio: "$140.000",
        descripcion: "Reloj táctico deportivo con pulsera de silicona negra.",
        imagen: "assets/products/reloj-curren.png",
        estado: "Disponible"
    },
    {
        id: "2",
        nombre: "Sneakers Nike Dunk Low Retro",
        categoria: "Sneakers",
        genero: "Hombre",
        marca: "Nike",
        modelo: "Dunk Low",
        precio: "$280.000",
        descripcion: "Diseño clásico urbano en cuero sintético blanco y negro.",
        imagen: "assets/products/sneaker-nike.jpg",
        estado: "Disponible"
    }
];

let activeCategory = 'Todos';
let activeGender = 'Todos';
let activeBrand = 'Todas';

document.addEventListener('DOMContentLoaded', () => {
    initCatalogControls();
    loadProducts();
    setupNavigation();
    setupSearch();
});

// Función principal para cargar productos (desde Google Sheets o respaldo)
async function loadProducts() {
    if (SHEETS_API_URL && SHEETS_API_URL !== "") {
        try {
            const response = await fetch(SHEETS_API_URL);
            const data = await response.json();
            if (data && data.length > 0) {
                allProducts = data;
            }
        } catch (error) {
            console.error("Error al cargar datos de Google Sheets, usando modo local:", error);
        }
    }
    applyFilters();
}

// Renderizar los productos en la interfaz
function renderProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = '';

    // Filtrar únicamente los productos que estén Disponibles
    const availableProducts = products.filter(p => !p.estado || p.estado.toLowerCase() === 'disponible');

    if (availableProducts.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--silver-metallic, #cbd5e1); padding: 40px; font-weight: 600;">No se encontraron productos disponibles con estos filtros.</p>`;
        return;
    }

    availableProducts.forEach(product => {
        const message = encodeURIComponent(`Hola, estoy interesado en el producto "${product.nombre}" (${product.modelo || ''}) de BAZOR. ¿Me pueden brindar más información?`);
        const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${message}`;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-container">
                <img src="${product.imagen}" alt="${product.nombre}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'">
            </div>
            <div class="product-details">
                <span class="product-brand">${product.marca || ''} ${product.genero ? '• ' + product.genero : ''}</span>
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

// Filtrar por Categoría (Todos, Sneakers, Relojes)
function filterCategory(category) {
    activeCategory = category;
    applyFilters();

    // Actualizar botones visuales principales si existen
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if(btn.textContent.trim().toLowerCase() === category.toLowerCase()) {
            btn.classList.add('active');
        } else if(category === 'Todos' && btn.textContent.trim() === 'Todos') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Filtrar por Género (Hombre / Mujer)
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

// Aplicar todos los filtros combinados (Categoría, Género, Marca y Buscador)
function applyFilters() {
    const searchVal = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : '';

    const filtered = allProducts.filter(p => {
        const pCat = p.categoria ? p.categoria.trim() : '';
        const pGen = p.genero ? p.genero.trim() : '';
        const pBrand = p.marca ? p.marca.trim() : '';

        const matchesCategory = (activeCategory === 'Todos') || (pCat.toLowerCase() === activeCategory.toLowerCase());
        const matchesGender = (activeGender === 'Todos') || (pGen.toLowerCase() === activeGender.toLowerCase());
        const matchesBrand = (activeBrand === 'Todas') || (pBrand.toLowerCase() === activeBrand.toLowerCase());
        
        const matchesSearch = !searchVal || 
                              (p.nombre && p.nombre.toLowerCase().includes(searchVal)) || 
                              (pBrand.toLowerCase().includes(searchVal)) || 
                              (p.modelo && p.modelo.toLowerCase().includes(searchVal));

        return matchesCategory && matchesGender && matchesBrand && matchesSearch;
    });

    renderProducts(filtered);
}

// Configurar buscador en tiempo real
function setupSearch() {
    const input = document.getElementById('search-input');
    if (input) {
        input.addEventListener('input', applyFilters);
    }
}

// Menú móvil responsive
function setupNavigation() {
    const toggle = document.getElementById('mobile-menu');
    const nav = document.getElementById('navbar');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('show');
        });
    }
}

// Desplazamiento suave entre secciones
function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Inicialización de controles adicionales de filtro por género si se requieren en el DOM
function initCatalogControls() {
    // Espacio reservado para inyectar selectores de género de manera dinámica si el usuario lo desea luego
}