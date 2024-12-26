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

// Hàm để điền thông tin người dùng vào trang
function populateUserInfo(userData) {
    // Cập nhật avatar
    const avatarElements = document.querySelectorAll('.profile-avatar');
    avatarElements.forEach(avatar => {
        avatar.src = userData.avatar;
    });

    // Cập nhật tên và role trong sidebar
    const userNameElement = document.querySelector('.sidebar-header .user-name');
    const userRoleElement = document.querySelector('.sidebar-header .user-role');
    
    if (userNameElement) {
        userNameElement.textContent = userData.fullname || 'Chưa cập nhật';
    }
    
    if (userRoleElement) {
        userRoleElement.textContent = userData.role || 'Member';
        userRoleElement.className = 'user-role'; // Reset classes
        userRoleElement.classList.add(userData.role?.toLowerCase() === 'premium' ? 'premium' : 'member');
    }

    // Cập nhật tên và username trong profile card
    document.querySelector('.profile-header h3').textContent = userData.fullname || 'Chưa cập nhật';
    document.querySelector('.profile-header p').textContent = `@${userData.account_link}`;

    // Cập nhật form thông tin chi tiết
    const emailInput = document.querySelector('input[placeholder="Email"]');
    emailInput.value = userData.email;
    emailInput.setAttribute('readonly', true);

    // Cập nhật các trường thông tin khác
    document.querySelector('input[placeholder="Họ và tên"]').value = userData.fullname || '';
    document.querySelector('input[placeholder="Số điện thoại"]').value = userData.phone || '';
    document.querySelector('input[placeholder="Địa chỉ"]').value = userData.address || '';

    // Cập nhật thống kê
    if (userData.stats) {
        document.querySelector('.stat-value').textContent = userData.stats.orders || '0';
        document.querySelectorAll('.stat-value')[1].textContent = userData.stats.rating || '0.0';
    }
}

// Hàm để lấy thông tin người dùng từ server
async function fetchUserData(accountLink) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/${accountLink}`);
        if (!response.ok) throw new Error('Failed to fetch user data');
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
    const accountLink = getUserFromURL();
    if (!accountLink) {
        alert('Không tìm thấy thông tin người dùng');
        window.location.href = 'Home.html';
        return;
    }

    const userData = await fetchUserData(accountLink);
    if (userData) {
        populateUserInfo(userData);

        // Tạo và thêm input file một lần duy nhất
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // Xử lý khi chọn file
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chọn file hình ảnh');
                return;
            }

            await handleAvatarUpload(file, accountLink);
            // Clear input để có thể chọn lại cùng file nếu cần
            fileInput.value = '';
        });

        // Xử lý click vào avatar container
        let avatarContainer = document.querySelector('.profile-avatar-container');
        // Xóa tất cả event listeners hiện có
        avatarContainer = removeAllEventListeners(avatarContainer);
        
        // Thêm event listener mới
        avatarContainer.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isUploading) {
                fileInput.click();
            }
        };

        // Xử lý form submit
        const profileForm = document.querySelector('.profile-form');
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Chỉ lấy các trường có thể chỉnh sửa
            const formData = {
                fullname: profileForm.querySelector('input[placeholder="Họ và tên"]').value.trim(),
                phone: profileForm.querySelector('input[placeholder="Số điện thoại"]').value.trim(),
                address: profileForm.querySelector('input[placeholder="Địa chỉ"]').value.trim()
            };

            // Validate số điện thoại nếu có nhp
            if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
                alert('Số điện thoại không hợp lệ (phải có 10 chữ số)');
                return;
            }

            await handleProfileUpdate(accountLink, formData);
        });
    } else {
        alert('Không thể tải thông tin người dùng');
    }
}

// Khởi tạo khi trang load xong
document.addEventListener('DOMContentLoaded', initializeDashboard);
