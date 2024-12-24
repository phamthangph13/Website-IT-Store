document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra và load thông tin người dùng
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }

    // Parse thông tin người dùng
    const user = JSON.parse(userData);
    
    // Cập nhật header
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        headerRight.innerHTML = `
            <span class="user-name">Xin chào, ${user.name}</span>
            <a href="profile.html" class="btn">Trang Cá Nhân</a>
            <button class="btn btn-logout">Đăng Xuất</button>
        `;
    }

    // Thêm event listener cho nút đăng xuất
    document.querySelector('.btn-logout')?.addEventListener('click', () => {
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });

    // Cập nhật thông tin người dùng trong UI
    updateUserProfile(user);

    // Xử lý navigation
    const navLinks = document.querySelectorAll('.dashboard-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            document.querySelectorAll('.dashboard-section').forEach(section => {
                section.classList.remove('active');
            });
            
            const sectionId = link.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // Load thông tin chi tiết người dùng từ server
    loadUserDetails(user.token);

    initializeProfileEditing();
    addRippleEffect();

    // Xử lý chuyển đổi tab trong phần Info
    const infoTabs = document.querySelectorAll('.info-tabs .tab-btn');
    const infoForms = document.querySelectorAll('.info-form');

    console.log('Info Tabs:', infoTabs.length);
    console.log('Info Forms:', infoForms.length);

    // Hàm chuyển đổi tên tab thành ID form
    function convertToFormId(tabName) {
        const conversion = {
            'Thông tin cơ bản': 'basicInfo',
            'Thanh toán': 'payment',
            'Địa chỉ': 'address'
        };
        
        return (conversion[tabName] || 'basicInfo') + 'Form';
    }

    infoTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('Tab clicked:', tab.textContent);

            // Xóa active class khỏi tất cả các tab
            infoTabs.forEach(t => t.classList.remove('active'));
            // Thêm active class vào tab được click
            tab.classList.add('active');

            // Ẩn tất cả các form
            infoForms.forEach(form => form.style.display = 'none');

            // Hiển thị form tương ứng với tab được chọn
            const formId = convertToFormId(tab.textContent.trim());
            console.log('Looking for form:', formId);

            const targetForm = document.getElementById(formId);
            if (targetForm) {
                console.log('Found form:', formId);
                targetForm.style.display = 'block';
            } else {
                console.log('Form not found:', formId, 'Showing basic info form');
                document.getElementById('basicInfoForm').style.display = 'block';
            }
        });
    });

    // Đảm bảo form thông tin cơ bản được hiển thị mặc định
    document.getElementById('basicInfoForm').style.display = 'block';
});

// Hàm cập nhật UI với thông tin người dùng
function updateUserProfile(user) {
    // Cập nhật tất cả các vị trí hiển thị tên người dùng
    const sidebarName = document.getElementById('sidebarProfileName');
    const previewName = document.getElementById('previewProfileName');
    const nameInput = document.getElementById('profileNameInput');

    if (sidebarName) sidebarName.textContent = user.name;
    if (previewName) previewName.textContent = user.name;
    if (nameInput) nameInput.value = user.name;
    
    // Cập nhật title trang
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = `${user.name} - Yêu Công Nghệ`;
    }

    // Cập nhật header
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        headerRight.innerHTML = `
            <span class="user-name">Xin chào, ${user.name}</span>
            <a href="profile.html" class="btn">Trang Cá Nhân</a>
            <button class="btn btn-logout">Đăng Xuất</button>
        `;
    }

    // Cập nhật tên trong lời chào dashboard
    const welcomeProfileName = document.getElementById('welcomeProfileName');
    if (welcomeProfileName) {
        welcomeProfileName.textContent = user.name;
    }

    // Cập nhật tên trong các preview
    const nameElements = document.querySelectorAll('.profile-preview h3');
    nameElements.forEach(el => el.textContent = user.name);

    // Cập nhật email trong form
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => input.value = user.email);

    // Cập nhật tên trong form
    const nameInputs = document.querySelectorAll('input[placeholder="Họ và tên"]');
    nameInputs.forEach(input => input.value = user.name);
}

// Thêm biến để lưu thông tin về phương thức đăng ký
let userAuthMethod = '';

// Hàm load thông tin chi tiết từ server
async function loadUserDetails(token) {
    try {
        const response = await fetch('https://localhost:5000/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load user details');
        }

        const userDetails = await response.json();
        userAuthMethod = userDetails.authMethod; // Lưu phương thức đăng ký
        
        // Cập nhật các thông tin chi tiết
        updateDetailedProfile(userDetails);

    } catch (error) {
        console.error('Error loading user details:', error);
    }
}

// Hàm cập nhật thông tin chi tiết vào UI
function updateDetailedProfile(details) {
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');
    
    if (!emailInput || !phoneInput) {
        console.log('Required elements not found');
        return;
    }

    const emailContainer = emailInput.parentElement;
    const phoneContainer = phoneInput.parentElement;
    
    if (!emailContainer || !phoneContainer) {
        console.log('Parent elements not found');
        return;
    }

    const emailNote = emailContainer.querySelector('.input-note');
    const phoneNote = phoneContainer.querySelector('.input-note');
    const changeEmailBtn = document.getElementById('changeEmailBtn');
    const changePhoneBtn = document.getElementById('changePhoneBtn');
    const removeEmailBtn = document.getElementById('removeEmailBtn');
    const removePhoneBtn = document.getElementById('removePhoneBtn');

    // Xóa icon khóa cũ nếu có
    emailContainer.querySelectorAll('.lock-icon').forEach(icon => icon.remove());
    phoneContainer.querySelectorAll('.lock-icon').forEach(icon => icon.remove());

    // Xử lý trường hợp đăng ký bằng email
    if (details.authMethod === 'email') {
        emailInput.value = details.email;
        emailInput.readOnly = true;
        emailInput.disabled = true;
        emailNote.textContent = 'Email đăng ký không thể thay đổi';
        emailInput.classList.add('readonly-input');
        emailContainer.classList.add('has-lock-icon', 'disabled');
        removeEmailBtn.style.display = 'none'; // Ẩn nút xóa email chính
        
        // Thêm icon khóa
        const lockIcon = document.createElement('i');
        lockIcon.className = 'fas fa-lock lock-icon';
        emailContainer.appendChild(lockIcon);

        // Xử lý số điện thoại
        phoneInput.value = details.phone || '';
        phoneInput.readOnly = false;
        phoneInput.disabled = false;
        phoneNote.textContent = details.phone ? 'Bạn có thể thay đổi hoặc xóa số điện thoại' : 'Bạn có thể thêm số điện thoại';
        phoneInput.classList.remove('readonly-input');
        phoneContainer.classList.remove('has-lock-icon', 'disabled');
        changePhoneBtn.style.display = 'inline';
        removePhoneBtn.style.display = details.phone ? 'inline' : 'none';
    }
    // Xử lý trường hợp đăng ký bằng số điện thoại
    else if (details.authMethod === 'phone') {
        phoneInput.value = details.phone;
        phoneInput.readOnly = true;
        phoneInput.disabled = true;
        phoneNote.textContent = 'Số điện thoại đăng ký không thể thay đổi';
        phoneInput.classList.add('readonly-input');
        phoneContainer.classList.add('has-lock-icon', 'disabled');
        removePhoneBtn.style.display = 'none'; // Ẩn nút xóa số điện thoại chính
        
        // Thêm icon khóa
        const lockIcon = document.createElement('i');
        lockIcon.className = 'fas fa-lock lock-icon';
        phoneContainer.appendChild(lockIcon);

        // Xử lý email
        emailInput.value = details.email || '';
        emailInput.readOnly = false;
        emailInput.disabled = false;
        emailNote.textContent = details.email ? 'Bạn có thể thay đổi hoặc xóa email' : 'Bạn có thể thêm email';
        emailInput.classList.remove('readonly-input');
        emailContainer.classList.remove('has-lock-icon', 'disabled');
        changeEmailBtn.style.display = 'inline';
        removeEmailBtn.style.display = details.email ? 'inline' : 'none';
    }

    // Cập nhật số điện thoại
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    if (details.phone) {
        phoneInputs.forEach(input => input.value = details.phone);
    }

    // C��p nhật địa chỉ
    const addressTextareas = document.querySelectorAll('textarea.form-input');
    if (details.address) {
        addressTextareas.forEach(textarea => textarea.value = details.address);
    }

    // Cập nhật avatar nếu có
    const avatarImg = document.querySelector('.profile-avatar img');
    if (details.avatar) {
        avatarImg.src = details.avatar;
    }

    // Cập nhật ngày sinh
    const birthDateInputs = document.querySelectorAll('input[type="date"]');
    if (details.birthDate) {
        birthDateInputs.forEach(input => input.value = details.birthDate);
    }

    // Cập nhật các thống kê
    if (details.stats) {
        const orderCount = document.querySelector('.stat-value:nth-child(1)');
        const wishlistCount = document.querySelector('.stat-value:nth-child(2)');
        const pointsCount = document.querySelector('.stat-value:nth-child(3)');

        if (orderCount) orderCount.textContent = details.stats.orders || '0';
        if (wishlistCount) wishlistCount.textContent = details.stats.wishlist || '0';
        if (pointsCount) pointsCount.textContent = details.stats.points || '0';
    }
}

// Helper functions
function isValidEmail(email) {
    return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email);
}

function isValidPhone(phone) {
    return /^[0-9]{10}$/.test(phone);
}

// Thêm các hàm xử lý chỉnh sửa thông tin
function initializeProfileEditing() {
    const form = document.querySelector('.info-form');
    const editButtons = document.querySelectorAll('.edit-btn');
    let originalValues = {};

    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const fieldName = this.dataset.field;
            const inputGroup = this.closest('.input-group');
            const input = inputGroup.querySelector('.form-input');
            const confirmBtn = inputGroup.querySelector('.confirm-btn');
            const cancelBtn = inputGroup.querySelector('.cancel-btn');

            if (input.readOnly) {
                // Bắt đầu chỉnh sửa
                originalValues[fieldName] = input.value;
                input.readOnly = false;
                input.focus();
                inputGroup.classList.add('editing');
                this.style.display = 'none';
                confirmBtn.style.display = 'flex';
                cancelBtn.style.display = 'flex';
            }
        });
    });

    // Xử lý nút xác nhận
    document.querySelectorAll('.confirm-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const inputGroup = this.closest('.input-group');
            const input = inputGroup.querySelector('.form-input');
            const editBtn = inputGroup.querySelector('.edit-btn');
            const fieldName = editBtn.dataset.field;

            try {
                // Gọi API để cập nhật giá trị
                await updateFieldValue(fieldName, input.value);

                // Cập nhật UI
                input.readOnly = true;
                inputGroup.classList.remove('editing');
                editBtn.style.display = 'flex';
                this.style.display = 'none';
                inputGroup.querySelector('.cancel-btn').style.display = 'none';

                // Hiển thị thông báo thành công
                showSuccessToast('Cập nhật thành công!');
            } catch (error) {
                showErrorToast('Có lỗi xảy ra, vui lòng thử lại!');
            }
        });
    });

    // Xử lý nút hủy
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const inputGroup = this.closest('.input-group');
            const input = inputGroup.querySelector('.form-input');
            const editBtn = inputGroup.querySelector('.edit-btn');
            const fieldName = editBtn.dataset.field;

            input.value = originalValues[fieldName];
            input.readOnly = true;
            inputGroup.classList.remove('editing');
            editBtn.style.display = 'flex';
            this.style.display = 'none';
            inputGroup.querySelector('.confirm-btn').style.display = 'none';
        });
    });
}

// Thêm hàm hiển thị toast message
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Thêm hiệu ứng ripple cho các nút
function addRippleEffect() {
    const buttons = document.querySelectorAll('.material-button, .material-icon-button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            
            ripple.className = 'ripple';
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Notifications
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Helper function để lấy token
function getUserToken() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        return JSON.parse(userData).token;
    }
    return null;
}
