document.addEventListener('DOMContentLoaded', function() {
    // Xử lý chuyển đổi tab hướng dẫn
    const navItems = document.querySelectorAll('.tutorial-nav-item');
    const sections = document.querySelectorAll('.tutorial-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items and sections
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked item and corresponding section
            item.classList.add('active');
            const sectionId = item.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // Xử lý hamburger menu
    const hamburgerBtn = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('.nav');

    if (hamburgerBtn && nav) {
        hamburgerBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            const icon = hamburgerBtn.querySelector('i');
            if (icon) {
                if (nav.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Đóng menu khi click bên ngoài
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && !hamburgerBtn.contains(e.target) && nav.classList.contains('active')) {
                nav.classList.remove('active');
                const icon = hamburgerBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Payment modal handling
    const paymentCards = document.querySelectorAll('.payment-card');
    const paymentModals = document.querySelectorAll('.payment-modal');
    const modalCloseButtons = document.querySelectorAll('.modal-close');

    // Open modal when clicking payment card
    paymentCards.forEach(card => {
        card.addEventListener('click', () => {
            // Debug logs
            console.log('Card clicked:', card);
            const h3Text = card.querySelector('h3').textContent;
            console.log('Original text:', h3Text);
            
            // Xử lý text để tạo ID
            const paymentType = h3Text
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
                .replace(/đ/g, 'd')              // Thay thế đ thành d
                .replace(/\s+/g, '')             // Loại bỏ khoảng trắng
                .replace(/[^a-z0-9]/g, '');      // Chỉ giữ lại chữ và số
            
            console.log('Processed payment type:', paymentType);
            
            const modalId = `${paymentType}Modal`;
            console.log('Looking for modal with ID:', modalId);
            
            const modal = document.getElementById(modalId);
            console.log('Found modal:', modal);
            
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                console.error('Modal not found for ID:', modalId);
            }
        });
    });

    // Close modal when clicking close button or outside
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    paymentModals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(e);
            }
        });
    });

    function closeModal(e) {
        const modal = e.target.closest('.payment-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const textToCopy = button.getAttribute('data-copy');
            try {
                await navigator.clipboard.writeText(textToCopy);
                button.classList.add('copied');
                button.innerHTML = '<i class="fas fa-check"></i> Đã sao chép';
                
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = '<i class="fas fa-copy"></i> Sao chép';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    });

    console.log('DOM loaded');
    console.log('Payment cards found:', document.querySelectorAll('.payment-card').length);
    console.log('Payment modals found:', document.querySelectorAll('.payment-modal').length);

    // Log all modal IDs for debugging
    console.log('Available modals:', Array.from(paymentModals).map(modal => modal.id));
}); 