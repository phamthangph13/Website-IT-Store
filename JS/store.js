document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productsGrid = document.querySelector('.products-grid');
    
    // Fetch products from API
    async function loadProducts() {
        try {
            const response = await fetch('http://localhost:5000/products');
            const data = await response.json();
            
            if (data.success) {
                renderProducts(data.products);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    // Render products to DOM
    function renderProducts(products) {
        productsGrid.innerHTML = products.map(product => `
            <div class="product-card" data-category="${product.category}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    ${product.isPremium ? '<div class="premium-badge">Premium</div>' : ''}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <button class="add-to-cart ${product.type === 'Intangibles' ? 'use-now' : ''}">
                        ${product.type === 'Intangibles' ? 'Sử dụng ngay' : 'Thêm vào giỏ hàng'}
                    </button>
                </div>
            </div>
        `).join('');

        // Reattach event listeners after rendering
        attachActionListeners();
    }

    // Thêm hiệu ứng fade out/in cho sản phẩm
    function fadeOut(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
    }

    function fadeIn(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }

    // Xử lý việc lọc và hiển thị sản phẩm
    function filterProducts(category) {
        const products = document.querySelectorAll('.product-card');
        products.forEach(product => {
            product.style.transition = 'all 0.4s ease-out';

            if (category === 'all' || product.getAttribute('data-category') === category) {
                product.style.display = 'block';
                setTimeout(() => {
                    fadeIn(product);
                }, 50);
            } else {
                fadeOut(product);
                setTimeout(() => {
                    product.style.display = 'none';
                }, 400);
            }
        });
    }

    // Xử lý sự kiện click cho các nút filter
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Chỉ xử lý nếu nút chưa active
            if (!button.classList.contains('active')) {
                // Cập nhật trạng thái active
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Lọc sản phẩm
                const selectedCategory = button.getAttribute('data-category');
                filterProducts(selectedCategory);
            }
        });
    });

    // Update the event listener function to handle both types
    function attachActionListeners() {
        const actionButtons = document.querySelectorAll('.add-to-cart');
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                button.classList.add('clicked');
                
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                button.appendChild(ripple);

                setTimeout(() => {
                    button.classList.remove('clicked');
                    ripple.remove();
                }, 600);

                // Different messages based on button type
                const message = button.classList.contains('use-now') 
                    ? 'Đang chuyển hướng đến trang dịch vụ!' 
                    : 'Đã thêm vào giỏ hàng!';
                showNotification(message);
            });
        });
    }

    // Hàm hiển thị thông báo
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.textContent = message;
        document.body.appendChild(notification);

        // Hiển thị notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Xóa notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    // Load products when page loads
    loadProducts();
}); 