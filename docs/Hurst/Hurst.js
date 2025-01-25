document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.dashboard-section');

    // Set default active section (Profile)
    document.querySelector('[data-page="profile"]').classList.add('active');
    document.getElementById('profile-section').style.display = 'block';

    // Hide other sections by default
    sections.forEach(section => {
        if (section.id !== 'profile-section') {
            section.style.display = 'none';
        }
    });

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            
            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
            });

            // Remove active class from all links
            navLinks.forEach(link => {
                link.classList.remove('active');
            });

            // Show selected section and add active class to clicked link
            document.getElementById(`${page}-section`).style.display = 'block';
            link.classList.add('active');
        });
    });

    // Theme switching functionality
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Add theme switching logic here
        });
    });

    // Profile image upload functionality
    const profileAvatarContainer = document.querySelector('.profile-avatar-container');
    if (profileAvatarContainer) {
        profileAvatarContainer.addEventListener('click', () => {
            // Create a file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.querySelector('.profile-avatar').src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            input.click();
        });
    }
});