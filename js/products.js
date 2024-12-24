document.addEventListener('DOMContentLoaded', function() {
    // Thay thế phần khai báo products và renderProducts
    async function fetchProducts() {
        try {
            const response = await fetch('https://localhost:5000/api/products', {
                method: 'GET',
                mode: 'cors'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            console.log('Raw products data:', products);
            
            return products.reduce((acc, product) => {
                const category = Object.entries(categoryMapping).find(([_, value]) => 
                    value === product.category
                )?.[1] || product.category;
                
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(product);
                return acc;
            }, {});
        } catch (error) {
            console.error('Error fetching products:', error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Unable to load products. Please try again later.';
            document.querySelector('.product-category').prepend(errorMessage);
            return {};
        }
    }

    const categoryMapping = {
        'AI Tools': 'ai tools',
        'Phần Mềm': 'software',
        'Phân Tích Dữ Liệu': 'data',
        'Robot Kit': 'robot kit'
    };

    async function renderProducts() {
        const products = await fetchProducts();
        console.log('Processed products by category:', products);
        
        const categories = document.querySelectorAll('.product-category');
        categories.forEach(category => {
            const productRow = category.querySelector('.product-row');
            const categoryTitle = category.querySelector('.category-title').textContent;
            const categoryName = Object.entries(categoryMapping)
                .find(([key, _]) => key === categoryTitle)?.[1];
            
            console.log('Rendering category:', categoryTitle, 'with key:', categoryName);
            
            if (products[categoryName] && products[categoryName].length > 0) {
                productRow.innerHTML = '';
                products[categoryName].forEach(product => {
                    const productCard = createProductCard(product);
                    if (productCard) {
                        productRow.appendChild(productCard);
                    }
                });
            } else {
                console.log('No products found for category:', categoryName);
            }
        });
    }

    // Create product card
    function createProductCard(product) {
        // Thêm kiểm tra null/undefined
        if (!product) return null;
        
        // Sanitize data
        const sanitizedProduct = {
            name: product.name || 'Không có tên',
            description: product.description || 'Không có mô tả',
            price: product.price || '0 đ',
            image: product.image || 'default-image.jpg',
            labels: product.labels || []
        };

        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Tạo HTML cho labels
        const labelsHTML = sanitizedProduct.labels.map(label => {
            const labelClass = `product-label ${label}`;
            const icon = {
                'new': '<i class="fas fa-star"></i>',
                'sale': '<i class="fas fa-tag"></i>',
                'hot': '<i class="fas fa-fire"></i>'
            }[label];
            
            return `<span class="${labelClass}">${icon} ${label.toUpperCase()}</span>`;
        }).join('');

        card.innerHTML = `
            <div class="product-labels">
                ${labelsHTML}
            </div>
            <img src="${sanitizedProduct.image}" alt="${sanitizedProduct.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${sanitizedProduct.name}</h3>
                <p class="product-description">${sanitizedProduct.description}</p>
                <div class="product-price">${sanitizedProduct.price}</div>
                <button class="product-button">Thêm vào giỏ hàng</button>
            </div>
        `;
        return card;
    }

    // Search functionality with debounce
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const allProducts = document.querySelectorAll('.product-card');
            
            allProducts.forEach(product => {
                const name = product.querySelector('.product-name').textContent.toLowerCase();
                const description = product.querySelector('.product-description').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || description.includes(searchTerm)) {
                    product.style.display = '';
                } else {
                    product.style.display = 'none';
                }
            });
        }, 300);
    });

    // Initialize
    renderProducts();
}); 