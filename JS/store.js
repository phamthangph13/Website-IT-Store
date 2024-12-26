document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');

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
        products.forEach(product => {
            // Thêm transition cho tất cả sản phẩm
            product.style.transition = 'all 0.4s ease-out';

            if (category === 'all' || product.getAttribute('data-category') === category) {
                product.style.display = 'block';
                // Sử dụng setTimeout để tạo hiệu ứng tuần tự
                setTimeout(() => {
                    fadeIn(product);
                }, 50);
            } else {
                fadeOut(product);
                // Ẩn sản phẩm sau khi animation kết thúc
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

    // Xử lý nút "Thêm vào giỏ hàng"
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('clicked');
            
            // Thêm hiệu ứng ripple
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            button.appendChild(ripple);

            // Xóa hiệu ứng sau khi hoàn thành
            setTimeout(() => {
                button.classList.remove('clicked');
                ripple.remove();
            }, 600);

            // Hiển thị thông báo
            showNotification('Đã thêm vào giỏ hàng!');
        });
    });

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
}); 