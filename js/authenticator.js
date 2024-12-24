document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();  // Gọi hàm kiểm tra đăng nhập ngay lập tức
    
    // Authentication related elements
    const loginBtn = document.querySelector('.header-right .btn:first-child');
    const modals = document.querySelectorAll('.auth-modal');
    const closeButtons = document.querySelectorAll('.auth-close');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const showForgotPasswordLink = document.getElementById('showForgotPassword');
    const backToLoginLink = document.getElementById('backToLogin');

    // Show login modal when clicking login button
    loginBtn.addEventListener('click', () => {
        document.getElementById('loginModal').style.display = 'flex';
    });

    // Close modals when clicking close button
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    // Close modals when clicking outside
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Switch between forms
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('registerModal').style.display = 'flex';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerModal').style.display = 'none';
        document.getElementById('loginModal').style.display = 'flex';
    });

    showForgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('forgotPasswordModal').style.display = 'flex';
        resetForgotPasswordForms();
    });

    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('forgotPasswordModal').style.display = 'none';
        document.getElementById('loginModal').style.display = 'flex';
    });

    // Handle register form options
    document.querySelectorAll('.register-option').forEach(option => {
        option.addEventListener('click', function() {
            // Xóa class active từ tất cả các options
            document.querySelectorAll('.register-option').forEach(opt => {
                opt.classList.remove('active');
            });
            
            // Thêm class active cho option được chọn
            this.classList.add('active');
            
            // Lưu trạng thái hiện tại của các form
            const phoneForm = document.getElementById('phoneForm');
            const emailForm = document.getElementById('emailForm');
            const otpForm = document.getElementById('otpVerificationForm');
            const emailVerificationForm = document.getElementById('emailVerificationForm');
            
            // Ẩn form xác thực khi chuyển đổi phương thức
            otpForm.classList.remove('active');
            emailVerificationForm.classList.remove('active');
            
            // Hiển thị form tương ứng và giữ nguyên dữ liệu
            const formType = this.getAttribute('data-form');
            if (formType === 'email') {
                phoneForm.classList.remove('active');
                emailForm.classList.add('active');
            } else if (formType === 'phone') {
                emailForm.classList.remove('active');
                phoneForm.classList.add('active');
            }
        });
    });

    // Handle forgot password form options
    const forgotPasswordOptions = document.querySelectorAll('#forgotPasswordModal .register-option');
    const forgotPasswordForms = document.querySelectorAll('#forgotPasswordModal .register-form');

    forgotPasswordOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Hide all forms first
            forgotPasswordForms.forEach(form => {
                form.style.display = 'none';
                form.classList.remove('active');
            });
            
            // Reset all forms
            forgotPhoneForm.reset();
            forgotPasswordOTPForm.reset();
            
            // Clear OTP inputs
            const otpInputs = forgotPasswordOTPForm.querySelectorAll('.verification-input');
            otpInputs.forEach(input => input.value = '');
            
            // Reset countdown and resend button
            const countdownElement = forgotPasswordOTPForm.querySelector('.countdown');
            countdownElement.textContent = '';
            if (cooldownTimer) {
                clearInterval(cooldownTimer);
            }
            resendForgotOTP.classList.remove('disabled');
            resendForgotOTP.style.color = '#4a90e2';
            resendForgotOTP.style.cursor = 'pointer';

            // Update active states
            forgotPasswordOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // Show only the selected form
            const formId = option.getAttribute('data-form');
            const selectedForm = document.getElementById(formId + 'Form');
            selectedForm.style.display = 'block';
            selectedForm.classList.add('active');
        });
    });

    // Handle verification forms
    const emailForm = document.getElementById('emailForm');
    const phoneForm = document.getElementById('phoneForm');
    const emailVerificationForm = document.getElementById('emailVerificationForm');
    const otpVerificationForm = document.getElementById('otpVerificationForm');

    // Xử lý form email để gửi OTP
    emailForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = this.querySelector('input[placeholder="Họ và tên"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;
        const confirmPassword = this.querySelector('input[placeholder="Xác nhận mật khẩu"]').value;

        // Validate password match
        if (password !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp');
            return;
        }

        try {
            // Gửi yêu cầu OTP
            const response = await fetch('https://localhost:5000/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            // Ẩn form email và hiển thị form xác thực
            emailForm.classList.remove('active');
            emailVerificationForm.classList.add('active');
            startCountdown('email');

        } catch (error) {
            alert(error.message);
        }
    });

    // Xử lý xác thực OTP và đăng ký tài khoản
    emailVerificationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailForm.querySelector('input[type="email"]').value;
        
        // Lấy mã OTP từ các ô input
        const otpInputs = this.querySelectorAll('.verification-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        try {
            const response = await fetch('https://localhost:5000/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    otp
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            alert('Đăng ký thành công!');
            // Chuyển về form đăng nhập
            document.getElementById('registerModal').style.display = 'none';
            document.getElementById('loginModal').style.display = 'flex';

        } catch (error) {
            alert(error.message);
        }
    });

    phoneForm.addEventListener('submit', function(e) {
        e.preventDefault();
        phoneForm.classList.remove('active');
        otpVerificationForm.classList.add('active');
        startCountdown('phone');
    });

    // Handle verification code inputs
    const verificationInputs = document.querySelectorAll('.verification-input');
    verificationInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            if (this.value.length === 1) {
                if (index < verificationInputs.length - 1) {
                    verificationInputs[index + 1].focus();
                }
            }
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value) {
                if (index > 0) {
                    verificationInputs[index - 1].focus();
                }
            }
        });
    });

    // Countdown timer functionality
    function startCountdown(type) {
        const countdownElement = type === 'email' 
            ? emailVerificationForm.querySelector('.countdown')
            : otpVerificationForm.querySelector('.countdown');
        let timeLeft = 60;

        const countdownInterval = setInterval(() => {
            timeLeft--;
            countdownElement.textContent = `(${timeLeft}s)`;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                countdownElement.textContent = '';
            }
        }, 1000);
    }

    // Handle forgot password via phone
    const forgotPhoneForm = document.getElementById('forgotPhoneForm');
    const forgotPasswordOTPForm = document.getElementById('forgotPasswordOTPForm');
    const resendForgotOTP = document.getElementById('resendForgotOTP');
    let cooldownTimer;

    forgotPhoneForm.addEventListener('submit', function(e) {
        e.preventDefault();
        forgotPhoneForm.style.display = 'none';
        forgotPasswordOTPForm.style.display = 'block';
        forgotPasswordOTPForm.classList.add('active');
        startCooldown();
    });

    resendForgotOTP.addEventListener('click', function(e) {
        e.preventDefault();
        if (!resendForgotOTP.classList.contains('disabled')) {
            startCooldown();
        }
    });

    function startCooldown() {
        const countdownElement = forgotPasswordOTPForm.querySelector('.countdown');
        let timeLeft = 60;
        
        resendForgotOTP.classList.add('disabled');
        resendForgotOTP.style.color = '#666';
        resendForgotOTP.style.cursor = 'not-allowed';

        if (cooldownTimer) {
            clearInterval(cooldownTimer);
        }

        cooldownTimer = setInterval(() => {
            timeLeft--;
            countdownElement.textContent = `(${timeLeft}s)`;

            if (timeLeft <= 0) {
                clearInterval(cooldownTimer);
                countdownElement.textContent = '';
                
                resendForgotOTP.classList.remove('disabled');
                resendForgotOTP.style.color = '#4a90e2';
                resendForgotOTP.style.cursor = 'pointer';
            }
        }, 1000);
    }

    function resetForgotPasswordForms() {
        // Hide all forms first
        forgotPasswordForms.forEach(form => {
            form.style.display = 'none';
            form.classList.remove('active');
        });

        // Show the form based on active option
        const activeOption = document.querySelector('#forgotPasswordModal .register-option.active');
        if (activeOption) {
            const formId = activeOption.getAttribute('data-form');
            const selectedForm = document.getElementById(formId + 'Form');
            selectedForm.style.display = 'block';
            selectedForm.classList.add('active');
        } else {
            // If no active option, show phone form by default
            forgotPhoneForm.style.display = 'block';
        }
        
        // Reset form inputs
        forgotPhoneForm.reset();
        forgotPasswordOTPForm.reset();
        
        // Clear verification inputs
        const otpInputs = forgotPasswordOTPForm.querySelectorAll('.verification-input');
        otpInputs.forEach(input => input.value = '');
        
        // Reset countdown
        const countdownElement = forgotPasswordOTPForm.querySelector('.countdown');
        countdownElement.textContent = '';
        
        if (cooldownTimer) {
            clearInterval(cooldownTimer);
        }
        
        // Reset resend button
        resendForgotOTP.classList.remove('disabled');
        resendForgotOTP.style.color = '#4a90e2';
        resendForgotOTP.style.cursor = 'pointer';
    }

    // Reset forms when closing modal
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            resetForgotPasswordForms();
        });
    });

    forgotPasswordModal.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) {
            resetForgotPasswordForms();
        }
    });

    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetForgotPasswordForms();
    });

    // Thêm xử lý đăng ký
    // Xóa event listener cũ cho việc đăng ký trực tiếp
    // Xóa hoặc comment out đoạn code sau:
    /*
    emailForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // ... code đăng ký trực tiếp ...
    });
    */

    // Thêm xử lý đăng nhập
    const loginForm = document.querySelector('#loginModal .auth-form');
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = this.querySelector('input[type="text"]').value;
        const password = this.querySelector('input[type="password"]').value;

        try {
            const response = await fetch('https://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            // Lưu thông tin user vào localStorage
            localStorage.setItem('userData', JSON.stringify({
                token: data.token,
                name: data.user.name,
                email: data.user.email
            }));

            // Cập nhật UI
            updateUIForLoggedInUser(data.user);

            // Đóng modal đăng nhập
            document.getElementById('loginModal').style.display = 'none';

            // Chuyển hướng đến trang profile.html
            window.location.href = 'profile.html';

        } catch (error) {
            alert(error.message);
        }
    });

    // Hàm kiểm tra trạng thái đăng nhập
    async function checkLoginStatus() {
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user && user.token) {
                    // Kiểm tra token với server
                    const response = await fetch('https://localhost:5000/api/auth/verify-token', {
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        }
                    });
                    
                    if (!response.ok) {
                        // Token không hợp lệ hoặc hết hạn
                        localStorage.removeItem('userData');
                        return false;
                    }
                    
                    updateUIForLoggedInUser(user);
                    return true;
                }
            } catch (error) {
                console.error('Error checking login status:', error);
                localStorage.removeItem('userData');
            }
        }
        return false;
    }

    // Hàm cập nhật UI khi đã đăng nhập
    function updateUIForLoggedInUser(userData) {
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            headerRight.innerHTML = `
                <span class="user-name">Xin chào, ${userData.name}</span>
                <a href="profile.html" class="btn">Trang Cá Nhân</a>
                <button class="btn" onclick="handleLogout()">Đăng Xuất</button>
            `;
        }
    }
});

// Thêm hàm đăng xuất ở ngoài event listener để có thể gọi từ onclick
function handleLogout() {
    localStorage.removeItem('userData');
    location.reload();
} 