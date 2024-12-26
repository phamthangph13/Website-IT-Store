// Xử lý hiển thị modal login
function initializeLoginModal() {
    const loginBtn = document.querySelector('.login-btn');
    const loginModal = document.getElementById('loginModal');

    // Load form login từ file Login.html
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '../Form/Login.html', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            loginModal.innerHTML = xhr.responseText;
            
            // Thêm event listeners cho form đăng nhập
            const registerLink = loginModal.querySelector('.register-link a');
            const forgotPasswordLink = loginModal.querySelector('.forgot-password');
            
            // Chuyển sang form đăng ký
            registerLink.addEventListener('click', function(e) {
                e.preventDefault();
                loginModal.style.display = 'none';
                // Đảm bảo registerModal đã được khởi tạo
                const registerModal = document.getElementById('registerModal');
                if (!registerModal.innerHTML) {
                    initializeRegisterModal(true); // Truyền true để chỉ load nội dung
                } else {
                    registerModal.style.display = 'block';
                }
            });

            // Chuyển sang form quên mật khẩu
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                loginModal.style.display = 'none';
                initializeForgotPasswordModal();
            });

            // Sau khi load xong form, thêm các event listeners
            const closeBtn = document.querySelector('.close-btn');
            const togglePassword = document.querySelector('.toggle-password');

            // Hiện modal khi click nút đăng nhập
            loginBtn.addEventListener('click', function() {
                loginModal.style.display = 'block';
            });

            // Đóng modal khi click nút close
            closeBtn.addEventListener('click', function() {
                loginModal.style.display = 'none';
            });

            // Đóng modal khi click bên ngoài
            window.addEventListener('click', function(event) {
                if (event.target == loginModal) {
                    loginModal.style.display = 'none';
                }
            });

            // Toggle hiển thị mật khẩu
            togglePassword.addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    this.classList.remove('fa-eye');
                    this.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    this.classList.remove('fa-eye-slash');
                    this.classList.add('fa-eye');
                }
            });
        }
    };
    xhr.send();
}

// Xử lý hiển thị modal register
function initializeRegisterModal(onlyLoadContent = false) {
    const registerBtn = document.querySelector('.signup-btn');
    let registerModal = document.getElementById('registerModal');

    // Nếu modal chưa tồn tại, tạo mới
    if (!registerModal) {
        registerModal = document.createElement('div');
        registerModal.className = 'register-modal';
        registerModal.id = 'registerModal';
        document.body.appendChild(registerModal);
    }

    // Load form register từ file Register.html
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '../Form/Register.html', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            registerModal.innerHTML = xhr.responseText;
            
            if (!onlyLoadContent) {
                // Chỉ thêm event listener cho nút đăng ký nếu không phải load từ form login
                registerBtn.addEventListener('click', function() {
                    registerModal.style.display = 'block';
                });
            } else {
                // Nếu được gọi từ form login, hiển thị ngay
                registerModal.style.display = 'block';
            }

            // Thêm các event listeners khác
            const closeBtn = registerModal.querySelector('.close-btn');
            const loginLink = registerModal.querySelector('.login-link a');
            const togglePasswords = registerModal.querySelectorAll('.toggle-password');

            // Đóng modal
            closeBtn.addEventListener('click', function() {
                registerModal.style.display = 'none';
            });

            // Quay lại form đăng nhập
            loginLink.addEventListener('click', function(e) {
                e.preventDefault();
                registerModal.style.display = 'none';
                document.getElementById('loginModal').style.display = 'block';
            });

            // Đóng modal khi click bên ngoài
            window.addEventListener('click', function(event) {
                if (event.target == registerModal) {
                    registerModal.style.display = 'none';
                }
            });

            // Toggle hiển thị mật khẩu cho cả hai trường password
            togglePasswords.forEach(toggle => {
                toggle.addEventListener('click', function() {
                    const passwordInput = this.previousElementSibling;
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        this.classList.remove('fa-eye');
                        this.classList.add('fa-eye-slash');
                    } else {
                        passwordInput.type = 'password';
                        this.classList.remove('fa-eye-slash');
                        this.classList.add('fa-eye');
                    }
                });
            });

            // Thêm xử lý submit form đăng ký
            const registerForm = registerModal.querySelector('#registerForm');
            console.log('Register form:', registerForm);

            registerForm.addEventListener('submit', function(e) {
                console.log('Form submitted');
                e.preventDefault();
                const email = document.getElementById('register-email').value;
                console.log('Email:', email);
                registerModal.style.display = 'none';
                initializeVerifyModal(email);
            });
        }
    };
    xhr.send();
}

// Thêm hàm mới để xử lý form quên mật khẩu
function initializeForgotPasswordModal() {
    const forgotPasswordModal = document.createElement('div');
    forgotPasswordModal.className = 'forgot-password-modal';
    forgotPasswordModal.id = 'forgotPasswordModal';
    document.body.appendChild(forgotPasswordModal);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', '../Form/ForgetPassword.html', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            forgotPasswordModal.innerHTML = xhr.responseText;
            forgotPasswordModal.style.display = 'block';

            // Xử lý đóng modal
            const closeBtn = forgotPasswordModal.querySelector('.close-btn');
            closeBtn.addEventListener('click', function() {
                forgotPasswordModal.style.display = 'none';
            });

            // Xử lý click bên ngoài
            window.addEventListener('click', function(event) {
                if (event.target == forgotPasswordModal) {
                    forgotPasswordModal.style.display = 'none';
                }
            });

            // Xử lý quay lại form đăng nhập
            const backToLoginLink = forgotPasswordModal.querySelector('.back-to-login a');
            backToLoginLink.addEventListener('click', function(e) {
                e.preventDefault();
                forgotPasswordModal.style.display = 'none';
                document.getElementById('loginModal').style.display = 'block';
            });

            // Xử lý submit form quên mật khẩu
            const forgotPasswordForm = forgotPasswordModal.querySelector('#forgotPasswordForm');
            forgotPasswordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                // Thêm logic xử lý quên mật khẩu ở đây
                console.log('Forgot password form submitted');
            });
        }
    };
    xhr.send();
}

function initializeVerifyModal(email) {
    const verifyModal = document.getElementById('verifyModal');
    
    // Load verify form content
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '../Form/Verify.html', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            verifyModal.innerHTML = xhr.responseText;
            verifyModal.style.display = 'block';
            
            // Close button handler
            const closeBtn = verifyModal.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => {
                verifyModal.style.display = 'none';
            });

            // OTP input handlers
            const otpInputs = verifyModal.querySelectorAll('.otp-input');
            otpInputs.forEach((input, index) => {
                input.addEventListener('keyup', (e) => {
                    if (e.key >= 0 && e.key <= 9) {
                        if (index < otpInputs.length - 1) {
                            otpInputs[index + 1].focus();
                        }
                    } else if (e.key === 'Backspace') {
                        if (index > 0) {
                            otpInputs[index - 1].focus();
                        }
                    }
                });
            });

            // Timer and resend code
            let timeLeft = 60;
            const timerElement = document.getElementById('timer');
            const resendButton = document.getElementById('resendCode');
            
            const countdown = setInterval(() => {
                timeLeft--;
                timerElement.textContent = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(countdown);
                    resendButton.disabled = false;
                }
            }, 1000);

            // Back to register handler
            const backToRegister = verifyModal.querySelector('.back-to-register a');
            backToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                verifyModal.style.display = 'none';
                document.getElementById('registerModal').style.display = 'block';
            });
        }
    };
    xhr.send();
}

// Khởi tạo khi DOM đã load xong
document.addEventListener('DOMContentLoaded', function() {
    // Đảm bảo các elements tồn tại trước khi thêm event listener
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.signup-btn');
    
    if (loginBtn) {
        initializeLoginModal();
    }
    
    if (registerBtn) {
        initializeRegisterModal();
    }
    
    // Menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
});
