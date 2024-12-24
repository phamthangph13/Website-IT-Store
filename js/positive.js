document.addEventListener('DOMContentLoaded', function() {
    // Slider functionality
    function initializeSlider(sliderContainer, options = {}) {
        const grid = sliderContainer.querySelector('.image-grid, .team-grid');
        const prevBtn = sliderContainer.querySelector('.prev-btn');
        const nextBtn = sliderContainer.querySelector('.next-btn');
        let scrollPosition = 0;

        if (prevBtn && nextBtn && grid) {
            nextBtn.addEventListener('click', () => {
                const maxScroll = grid.scrollWidth - grid.clientWidth;
                scrollPosition = Math.min(scrollPosition + grid.clientWidth / 3, maxScroll);
                grid.style.transform = `translateX(-${scrollPosition}px)`;
                updateSliderButtons();
            });
            
            prevBtn.addEventListener('click', () => {
                scrollPosition = Math.max(scrollPosition - grid.clientWidth / 3, 0);
                grid.style.transform = `translateX(-${scrollPosition}px)`;
                updateSliderButtons();
            });

            function updateSliderButtons() {
                if (options.updateOpacity) {
                    prevBtn.style.opacity = scrollPosition === 0 ? '0.5' : '1';
                    nextBtn.style.opacity = 
                        scrollPosition >= grid.scrollWidth - grid.clientWidth 
                            ? '0.5' 
                            : '1';
                }
            }

            // Initialize button states if needed
            if (options.updateOpacity) {
                updateSliderButtons();
            }
        }
    }

    // Initialize all sliders on the page
    const sliders = document.querySelectorAll('.image-slider, .team-slider');
    sliders.forEach(slider => {
        initializeSlider(slider, { updateOpacity: true });
    });

    // Hamburger menu functionality
    function initializeHamburgerMenu() {
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

            // Close menu when clicking outside
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
    }

    // Initialize hamburger menu
    initializeHamburgerMenu();

    // Hover effects for team members
    function initializeTeamHoverEffects() {
        const teamMembers = document.querySelectorAll('.team-member');
        teamMembers.forEach(member => {
            member.addEventListener('mouseenter', () => {
                member.classList.add('hover');
            });

            member.addEventListener('mouseleave', () => {
                member.classList.remove('hover');
            });
        });
    }

    // Initialize team hover effects
    initializeTeamHoverEffects();

    // Smooth scroll functionality
    function initializeSmoothScroll() {
        const cyberButton = document.querySelector('.cyber-button');
        if (cyberButton) {
            cyberButton.addEventListener('click', () => {
                const valuesSection = document.querySelector('.values-section');
                if (valuesSection) {
                    valuesSection.scrollIntoView({ behavior: 'smooth' });
                }
            });

            // Add hover effects
            cyberButton.addEventListener('mouseenter', () => {
                const glitch = cyberButton.querySelector('.cyber-button__glitch');
                if (glitch) glitch.style.display = 'block';
            });

            cyberButton.addEventListener('mouseleave', () => {
                const glitch = cyberButton.querySelector('.cyber-button__glitch');
                if (glitch) glitch.style.display = 'none';
            });
        }
    }

    // Initialize smooth scroll
    initializeSmoothScroll();
});
