document.addEventListener('DOMContentLoaded', function() {
    // Load header
    fetch('../Comp/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-container').innerHTML = data;
            // Khởi tạo các event listeners sau khi header đã được load
            initializeLoginModal();
            initializeRegisterModal();
        })
        .catch(error => console.error('Error loading header:', error));

    // Load footer
    fetch('../Comp/Footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-container').innerHTML = data;
        })
        .catch(error => console.error('Error loading footer:', error));
});
