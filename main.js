// Main JS - Products and Cart Logic

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Load products from Supabase
async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name');

        if (error) throw error;

        allProducts = data;
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productGrid').innerHTML = '<p>Error loading products. Please refresh.</p>';
    }
}

// Display products in grid
function displayProducts(products) {
    const grid = document.getElementById('productGrid');
    
    if (products.length === 0) {
        grid.innerHTML = '<p>No products found.</p>';
        return;
    }

    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image_url || 'https://via.placeholder.com/300x200?text=CEAT+Tyre'}" 
                 alt="${product.name}"
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <h3>${product.name}</h3>
            <p class="category">${product.category} | ${product.size}</p>
            <p class="price">₹${product.price}</p>
            <p class="stock">${product.stock > 0 ? 'In Stock: ' + product.stock : 'Out of Stock'}</p>
            <div class="card-buttons">
                <a href="product.html?id=${product.id}"><button class="btn-secondary">View Details</button></a>
                <button onclick="addToCart('${product.id}')" ${product.stock === 0 ? 'disabled' : ''} class="btn-primary">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// Filter products
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const priceRange = document.getElementById('priceFilter').value;

    let filtered = allProducts.filter(product => {
        // Search filter
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.size.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !category || product.category === category;
        
        // Price filter
        let matchesPrice = true;
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(Number);
            matchesPrice = product.price >= min && product.price <= max;
        }
        
        return matchesSearch && matchesCategory && matchesPrice;
    });

    displayProducts(filtered);
}

// View product details in modal
function viewProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <img src="${product.image_url || 'https://via.placeholder.com/400x300?text=CEAT+Tyre'}" 
             alt="${product.name}"
             onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        <h2>${product.name}</h2>
        <p class="category">${product.category} | ${product.size}</p>
        <p class="price">₹${product.price}</p>
        <p class="stock">${product.stock > 0 ? 'In Stock: ' + product.stock : 'Out of Stock'}</p>
        <div class="quantity-selector">
            <label>Quantity:</label>
            <input type="number" id="modalQuantity" value="1" min="1" max="${product.stock}">
        </div>
        <button onclick="addToCartFromModal('${product.id}')" ${product.stock === 0 ? 'disabled' : ''} class="btn-primary">Add to Cart</button>
    `;

    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

// Add to cart
function addToCart(productId, quantity = 1) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stock === 0) {
        alert('Product not available');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity + quantity > product.stock) {
            alert('Not enough stock available');
            return;
        }
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            size: product.size,
            category: product.category,
            quantity: quantity,
            image_url: product.image_url
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('Added to cart!');
}

// Add to cart from modal with quantity
function addToCartFromModal(productId) {
    const quantity = parseInt(document.getElementById('modalQuantity').value);
    addToCart(productId, quantity);
    closeModal();
}

// Update cart count in header
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart item quantity
function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = parseInt(quantity);
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }
}

// Get cart total
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Clear cart
function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeModal();
    }
}