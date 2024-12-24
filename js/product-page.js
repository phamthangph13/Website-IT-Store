document.addEventListener('DOMContentLoaded', function() {
    // Xử lý tìm kiếm và lọc sản phẩm
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const sortFilter = document.getElementById('sortFilter');

    // Thêm event listeners cho các bộ lọc
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
    priceFilter.addEventListener('change', filterProducts);
    sortFilter.addEventListener('change', sortProducts);

    function filterProducts() {
        // Logic lọc sản phẩm
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const price = priceFilter.value;
        
        // Thêm logic lọc sản phẩm ở đây
        console.log('Filtering products:', { searchTerm, category, price });
    }

    function sortProducts() {
        const sortType = sortFilter.value;
        // Thêm logic sắp xếp sản phẩm ở đây
        console.log('Sorting products by:', sortType);
    }
}); 