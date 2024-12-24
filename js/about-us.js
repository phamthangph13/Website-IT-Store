document.addEventListener('DOMContentLoaded', function() {
    // Xử lý slider cho phần team members
    const teamSlider = document.querySelector('.team-slider');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const teamGrid = document.querySelector('.team-grid');
    let scrollPosition = 0;

    if (prevBtn && nextBtn && teamGrid) {
        nextBtn.addEventListener('click', () => {
            const maxScroll = teamGrid.scrollWidth - teamGrid.clientWidth;
            scrollPosition = Math.min(scrollPosition + teamGrid.clientWidth / 3, maxScroll);
            teamGrid.style.transform = `translateX(-${scrollPosition}px)`;
            updateSliderButtons();
        });
        
        prevBtn.addEventListener('click', () => {
            scrollPosition = Math.max(scrollPosition - teamGrid.clientWidth / 3, 0);
            teamGrid.style.transform = `translateX(-${scrollPosition}px)`;
            updateSliderButtons();
        });

        function updateSliderButtons() {
            prevBtn.style.opacity = scrollPosition === 0 ? '0.5' : '1';
            nextBtn.style.opacity = 
                scrollPosition >= teamGrid.scrollWidth - teamGrid.clientWidth 
                    ? '0.5' 
                    : '1';
        }

        // Initialize button states
        updateSliderButtons();
    }

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
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // Xử lý animation cho timeline
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Hàm kiểm tra phần tử có trong viewport không
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Hàm xử lý animation cho timeline items
    function handleTimelineAnimation() {
        timelineItems.forEach(item => {
            if (isElementInViewport(item)) {
                item.classList.add('animate');
            }
        });
    }

    // Thêm event listeners cho scroll và load
    window.addEventListener('scroll', handleTimelineAnimation);
    window.addEventListener('load', handleTimelineAnimation);

    // Xử lý hover effect cho team members
    const teamMembers = document.querySelectorAll('.team-member');
    
    teamMembers.forEach(member => {
        member.addEventListener('mouseenter', () => {
            member.classList.add('hover');
        });

        member.addEventListener('mouseleave', () => {
            member.classList.remove('hover');
        });
    });

    // Xử lý animation cho value cards
    const valueCards = document.querySelectorAll('.value-card');
    
    function handleValueCardsAnimation() {
        valueCards.forEach(card => {
            if (isElementInViewport(card)) {
                card.classList.add('animate');
            }
        });
    }

    window.addEventListener('scroll', handleValueCardsAnimation);
    window.addEventListener('load', handleValueCardsAnimation);

    // Xử lý nút "Trải Nghiệm Dịch Vụ"
    const cyberButton = document.querySelector('.cyber-button');
    if (cyberButton) {
        cyberButton.addEventListener('click', () => {
            // Scroll đến phần values section
            const valuesSection = document.querySelector('.values-section');
            if (valuesSection) {
                valuesSection.scrollIntoView({ behavior: 'smooth' });
            }
        });

        // Thêm hiệu ứng hover
        cyberButton.addEventListener('mouseenter', () => {
            cyberButton.querySelector('.cyber-button__glitch').style.display = 'block';
        });

        cyberButton.addEventListener('mouseleave', () => {
            cyberButton.querySelector('.cyber-button__glitch').style.display = 'none';
        });
    }
}); 