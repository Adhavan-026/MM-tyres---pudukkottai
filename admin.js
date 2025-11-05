// Admin Dashboard Logic

// Load all products (admin view)
async function loadProductsAdmin() {
    const productsList = document.getElementById('productsListAdmin');
    productsList.innerHTML = '<p>Loading products...</p>';

    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('name');

        if (error) throw error;

        if (products.length === 0) {
            productsList.innerHTML = '<p>No products found.</p>';
            return;
        }

        productsList.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Size</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td>
                                ${product.image_url ? 
                                    `<img src="${product.image_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : 
                                    '<span style="color: #999;">No image</span>'}
                            </td>
                            <td>${product.name}</td>
                            <td>${product.size}</td>
                            <td>${product.category}</td>
                            <td>₹${product.price}</td>
                            <td>${product.stock}</td>
                            <td>
                                <button onclick="editProduct('${product.id}')" class="btn-small">Edit</button>
                                <button onclick="deleteProduct('${product.id}')" class="btn-small btn-cancel">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading products:', error);
        productsList.innerHTML = '<p>Error loading products.</p>';
    }
}

// Add new product
async function addProduct(e) {
    e.preventDefault();

    const addBtn = document.getElementById('addProductBtn');
    addBtn.disabled = true;
    addBtn.textContent = 'Adding...';

    let imageUrl = document.getElementById('prodImageUrl').value;
    const imageFile = document.getElementById('prodImageFile').files[0];

    try {
        // If file is uploaded, upload to Supabase Storage
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            // Upload file to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            imageUrl = urlData.publicUrl;
        }

        const productData = {
            name: document.getElementById('prodName').value,
            size: document.getElementById('prodSize').value,
            category: document.getElementById('prodCategory').value,
            price: parseFloat(document.getElementById('prodPrice').value),
            stock: parseInt(document.getElementById('prodStock').value),
            image_url: imageUrl || null
        };

        const { error } = await supabase
            .from('products')
            .insert([productData]);

        if (error) throw error;

        alert('Product added successfully!');
        hideAddProductForm();
        loadProductsAdmin();
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product: ' + error.message);
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'Add Product';
    }
}

// Edit product
async function editProduct(productId) {
    const newStock = prompt('Enter new stock quantity:');
    if (newStock === null) return;

    try {
        const { error } = await supabase
            .from('products')
            .update({ stock: parseInt(newStock) })
            .eq('id', productId);

        if (error) throw error;

        alert('Product updated successfully!');
        loadProductsAdmin();
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Error updating product: ' + error.message);
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;

        alert('Product deleted successfully!');
        loadProductsAdmin();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
    }
}

// Load all orders (admin view)
async function loadOrdersAdmin() {
    const ordersList = document.getElementById('ordersListAdmin');
    ordersList.innerHTML = '<p>Loading orders...</p>';

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (orders.length === 0) {
            ordersList.innerHTML = '<p>No orders found.</p>';
            return;
        }

        ordersList.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>${order.id.substring(0, 8)}</td>
                            <td>${order.customer_name}</td>
                            <td>${order.customer_phone}</td>
                            <td>₹${order.total}</td>
                            <td><span class="status-badge ${order.status}">${order.status}</span></td>
                            <td>${new Date(order.created_at).toLocaleDateString()}</td>
                            <td>
                                <select onchange="updateOrderStatus('${order.id}', this.value)">
                                    <option value="">Update Status</option>
                                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<p>Error loading orders.</p>';
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;

    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) throw error;

        alert('Order status updated!');
        loadOrdersAdmin();
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Error updating order: ' + error.message);
    }
}

// Load all bookings (admin view)
async function loadBookingsAdmin() {
    const bookingsList = document.getElementById('bookingsListAdmin');
    bookingsList.innerHTML = '<p>Loading bookings...</p>';

    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .order('booking_date', { ascending: false });

        if (error) throw error;

        if (bookings.length === 0) {
            bookingsList.innerHTML = '<p>No bookings found.</p>';
            return;
        }

        bookingsList.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Vehicle</th>
                        <th>Service</th>
                        <th>Date</th>
                        <th>Slot</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(booking => `
                        <tr>
                            <td>${booking.id.substring(0, 8)}</td>
                            <td>${booking.customer_name}</td>
                            <td>${booking.customer_phone}</td>
                            <td>${booking.vehicle_number}</td>
                            <td>${booking.service_type}</td>
                            <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                            <td>${booking.booking_slot}</td>
                            <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
                            <td>
                                <select onchange="updateBookingStatus('${booking.id}', this.value)">
                                    <option value="">Update Status</option>
                                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsList.innerHTML = '<p>Error loading bookings.</p>';
    }
}

// Update booking status
async function updateBookingStatus(bookingId, newStatus) {
    if (!newStatus) return;

    try {
        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', bookingId);

        if (error) throw error;

        alert('Booking status updated!');
        loadBookingsAdmin();
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('Error updating booking: ' + error.message);
    }
}