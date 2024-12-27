// Thêm vào đầu file
function removeAllEventListeners(element) {
    const clone = element.cloneNode(true);
    element.parentNode.replaceChild(clone, element);
    return clone;
}

// Hàm để lấy thông tin người dùng từ URL parameter
function getUserFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('account');
}

// Thêm hàm kiểm tra DOM đã sẵn sàng
function isDOMReady() {
    return new Promise(resolve => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            resolve();
        } else {
            document.addEventListener('DOMContentLoaded', resolve);
        }
    });
}

// Hàm để điền thông tin người dùng vào trang
function populateUserInfo(userData) {
    if (!userData) {
        return;
    }

    // Cập nhật selectors để sử dụng ID
    const elements = {
        avatars: document.querySelectorAll('.profile-avatar'),
        userName: document.querySelector('.sidebar-header .user-name'),
        userRole: document.querySelector('.sidebar-header .user-role'),
        profileName: document.querySelector('.profile-header h3'),
        profileUsername: document.querySelector('.profile-header p'),
        emailInput: document.getElementById('emailInput'),
        fullnameInput: document.getElementById('fullnameInput'),
        phoneInput: document.getElementById('phoneInput'),
        addressInput: document.getElementById('addressInput'),
        statsOrders: document.querySelector('.stat-value'),
        statsRating: document.querySelectorAll('.stat-value')[1]
    };

    // Cập nhật các trường input
    if (elements.emailInput) {
        elements.emailInput.value = userData.email || '';
    }

    if (elements.fullnameInput) {
        elements.fullnameInput.value = userData.fullname || '';
    }

    if (elements.phoneInput) {
        elements.phoneInput.value = userData.phone || '';
    }

    if (elements.addressInput) {
        elements.addressInput.value = userData.address || '';
    }

    // Cập nhật các thông tin khác như cũ
    if (elements.avatars?.length > 0) {
        elements.avatars.forEach(avatar => {
            avatar.src = userData.avatar;
        });
    }

    if (elements.userName) {
        elements.userName.textContent = userData.fullname || 'Chưa cập nhật';
    }

    if (elements.userRole) {
        elements.userRole.textContent = userData.role || 'Member';
        elements.userRole.className = 'user-role';
        elements.userRole.classList.add(userData.role?.toLowerCase() === 'premium' ? 'premium' : 'member');
    }

    if (elements.profileName) {
        elements.profileName.textContent = userData.fullname || 'Chưa cập nhật';
    }

    if (elements.profileUsername) {
        elements.profileUsername.textContent = `@${userData.account_link}`;
    }

    // Cập nhật thống kê
    if (elements.statsOrders) {
        elements.statsOrders.textContent = userData.stats?.orders || '0';
    }

    if (elements.statsRating) {
        elements.statsRating.textContent = userData.stats?.rating || '0.0';
    }
}

// Hàm để lấy thông tin người dùng từ server
async function fetchUserData(accountLink) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/${accountLink}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        return userData;
    } catch (error) {
        return null;
    }
}

// Xử lý cập nhật thông tin
async function handleProfileUpdate(accountLink, formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/update/${accountLink}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (result.success) {
            // Fetch lại dữ liệu mới nhất từ server
            const updatedUserData = await fetchUserData(accountLink);
            if (updatedUserData) {
                // Cập nhật UI với dữ liệu mới
                populateUserInfo(updatedUserData);
                
                // Cập nhật thông tin trong localStorage và sessionStorage nếu là user hiện tại
                const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
                if (currentUser.account_link === accountLink) {
                    const updatedUser = { ...currentUser, ...updatedUserData };
                    sessionStorage.setItem('user', JSON.stringify(updatedUser));
                    if (localStorage.getItem('user')) {
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    }
                }
            }
            alert('Cập nhật thông tin thành công!');
        } else {
            alert(result.message || 'Có lỗi xảy ra khi cập nhật thông tin');
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi cập nhật thông tin');
    }
}

// Thêm biến để theo dõi trạng thái upload
let isUploading = false;

// Hàm chuyển đổi file thành base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Hàm xử lý upload avatar
async function handleAvatarUpload(file, accountLink) {
    if (isUploading) {
        return;
    }

    try {
        isUploading = true;

        // Kiểm tra kích thước file (giới hạn 1MB)
        if (file.size > 1 * 1024 * 1024) {
            alert('File quá lớn. Vui lòng chọn file nhỏ hơn 1MB');
            return;
        }

        // Thêm loading state
        const avatarOverlay = document.querySelector('.avatar-overlay');
        const originalContent = avatarOverlay.innerHTML;
        avatarOverlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        // Chuyển file thành base64
        const base64String = await fileToBase64(file);

        const response = await fetch(`${API_BASE_URL}/user/update-avatar/${accountLink}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                avatar: base64String
            })
        });

        const result = await response.json();

        if (result.success) {
            // Cập nhật tất cả các avatar trong trang
            const allAvatars = document.querySelectorAll('.avatar, .profile-avatar');
            
            allAvatars.forEach(avatar => {
                avatar.src = result.avatar + '?t=' + new Date().getTime(); // Thêm timestamp để tránh cache
            });

            // Cập nhật thông tin trong storage
            const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
            if (currentUser.account_link === accountLink) {
                currentUser.avatar = result.avatar;
                sessionStorage.setItem('user', JSON.stringify(currentUser));
                if (localStorage.getItem('user')) {
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
            }

            alert('Cập nhật avatar thành công!');
        } else {
            alert(result.message || 'Có lỗi xảy ra khi cập nhật avatar');
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi cập nhật avatar');
    } finally {
        // Restore original overlay content
        const avatarOverlay = document.querySelector('.avatar-overlay');
        avatarOverlay.innerHTML = '<i class="fas fa-camera"></i>';
        isUploading = false;
    }
}

// Hàm khởi tạo trang
async function initializeDashboard() {
    try {
        await isDOMReady();

        const accountLink = getUserFromURL();
        
        if (!accountLink) {
            window.location.href = 'Home.html';
            return;
        }

        let retryCount = 0;
        let userData = null;
        const maxRetries = 5; // Tăng số lần thử lại
        const retryDelay = 1000; // 1 giây

        while (retryCount < maxRetries && !userData) {
            userData = await fetchUserData(accountLink);
            
            if (!userData) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        if (!userData) {
            alert('Không thể tải thông tin người dùng');
            return;
        }

        populateUserInfo(userData);
        setupEventListeners(accountLink);

    } catch (error) {
        alert('Có lỗi xảy ra khi khởi tạo trang');
    }
}

// Tách phần setup event listeners thành hàm riêng
function setupEventListeners(accountLink) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file hình ảnh');
            return;
        }

        await handleAvatarUpload(file, accountLink);
        fileInput.value = '';
    });

    let avatarContainer = document.querySelector('.profile-avatar-container');
    avatarContainer = removeAllEventListeners(avatarContainer);
    
    avatarContainer.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isUploading) {
            fileInput.click();
        }
    };

    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                fullname: profileForm.querySelector('input[placeholder="Họ và tên"]')?.value.trim(),
                phone: profileForm.querySelector('input[placeholder="Số điện thoại"]')?.value.trim(),
                address: profileForm.querySelector('input[placeholder="Địa chỉ"]')?.value.trim()
            };

            if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
                alert('Số điện thoại không hợp lệ (phải có 10 chữ số)');
                return;
            }

            await handleProfileUpdate(accountLink, formData);
        });
    }

    // Thêm xử lý chuyển đổi tab
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.dashboard-section');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Xóa active class từ tất cả links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Thêm active class cho link được click
            link.classList.add('active');
            
            // Ẩn tất cả sections
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Hiển thị section tương ứng
            const targetSection = document.getElementById(`${link.dataset.page}-section`);
            if (targetSection) {
                targetSection.style.display = 'block';
                
                // Kích hoạt lại animation AOS
                AOS.refresh();
            }
        });
    });
}

// Khởi tạo khi trang load
window.addEventListener('load', initializeDashboard);
