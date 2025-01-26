document.addEventListener('DOMContentLoaded', function() {
    // Thêm event listener cho nút thanh toán
    const checkoutButtons = document.querySelectorAll('.btn-checkout');
    const paymentModal = document.getElementById('paymentModal');
    const closePayment = document.querySelector('.close-payment');
    
    checkoutButtons.forEach(button => {
        button.addEventListener('click', function() {
            paymentModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    });

    // Đóng modal
    closePayment.addEventListener('click', function() {
        paymentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Đóng modal khi click bên ngoài
    window.addEventListener('click', function(event) {
        if (event.target == paymentModal) {
            paymentModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Xử lý chọn phương thức thanh toán
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            this.classList.add('selected');
        });
    });
});