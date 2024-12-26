from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import bcrypt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
from datetime import datetime, timedelta
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS
import jwt
import os
import string  # Thêm import này ở đầu file

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://127.0.0.1:5500", "http://localhost:5500"],  # Thêm origin của frontend
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['DouneStore']

# Temporary OTP storage
otp_storage = {}

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "dounecompany@gmail.com"
SMTP_PASSWORD = "zasa vbpy arko snov"

# Cấu hình Swagger UI
SWAGGER_URL = '/api/docs'  # URL để truy cập Swagger UI
API_URL = '/static/swagger.json'  # URL đến file swagger.json của bạn

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "DouneStore API"
    }
)

app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# Add after MongoDB configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')  # Trong production nên dùng biến môi trường

def send_otp_email(email, otp):
    msg = MIMEMultipart()
    msg['From'] = SMTP_SERVER
    msg['To'] = email
    msg['Subject'] = "Xác thực đăng ký tài khoản"
    
    body = f"Mã OTP của bạn là: {otp}"
    msg.attach(MIMEText(body, 'plain'))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)

def generate_unique_link(length=12):
    """Tạo link ngẫu nhiên và đảm bảo không trùng trong database"""
    while True:
        # Tạo link ngẫu nhiên từ chữ và số
        characters = string.ascii_letters + string.digits
        random_link = ''.join(random.choice(characters) for _ in range(length))
        
        # Kiểm tra xem link đã tồn tại chưa
        if not db.User.find_one({'account_link': random_link}):
            return random_link

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data['email']
        password = data['password']
        fullname = data['fullname']

        # Generate OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Store registration data temporarily
        otp_storage[email] = {
            'otp': otp,
            'fullname': fullname,
            'password': bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()),
            'timestamp': datetime.now()
        }

        # Send OTP email
        send_otp_email(email, otp)

        return jsonify({'success': True, 'message': 'OTP đã được gửi đến email của bạn'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/verify', methods=['POST'])
def verify():
    try:
        data = request.get_json()
        email = data['email']
        otp = data['otp']

        if email not in otp_storage or otp_storage[email]['otp'] != otp:
            return jsonify({'success': False, 'message': 'OTP không hợp lệ'}), 400

        # Check OTP expiration (15 minutes)
        if datetime.now() - otp_storage[email]['timestamp'] > timedelta(minutes=15):
            del otp_storage[email]
            return jsonify({'success': False, 'message': 'OTP đã hết hạn'}), 400

        # Tạo link tài khoản độc nhất
        account_link = generate_unique_link()

        # Save user to MongoDB with account_link
        db.User.insert_one({
            'fullname': otp_storage[email]['fullname'],
            'email': email,
            'password': otp_storage[email]['password'],
            'role': 'Member',
            'account_link': account_link,
            'createdAt': datetime.now()
        })

        # Clear OTP data
        del otp_storage[email]

        return jsonify({
            'success': True, 
            'message': 'Đăng ký thành công',
            'account_link': account_link
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data['email']
        password = data['password']

        # Tìm user trong database
        user = db.User.find_one({'email': email})
        
        if not user:
            return jsonify({'success': False, 'message': 'Email không tồn tại'}), 400
        
        # Kiểm tra mật khẩu
        if bcrypt.checkpw(password.encode('utf-8'), user['password']):
            # Tạo session hoặc token cho user
            return jsonify({
                'success': True, 
                'message': 'Đăng nhập thành công',
                'user': {
                    'fullname': user['fullname'],
                    'email': user['email'],
                    'role': user['role'],
                    'account_link': user.get('account_link', '')  # Thêm account_link vào response
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Mật khẩu không chính xác'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data['email']
        
        # Kiểm tra email có tồn tại
        user = db.User.find_one({'email': email})
        if not user:
            return jsonify({'success': False, 'message': 'Email không tồn tại'}), 404

        # Tạo token reset password (hết hạn sau 1 giờ)
        token = jwt.encode({
            'email': email,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, JWT_SECRET)

        # Tạo link reset password
        reset_link = f"http://127.0.0.1:5500/Form/reset-password.html?token={token}"

        # Gửi email
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = email
        msg['Subject'] = "Khôi phục mật khẩu"
        
        body = f"""
        <html>
            <body>
                <p>Bạn đã yêu cầu khôi phục mật khẩu.</p>
                <p>Click vào link sau để đặt lại mật khẩu:</p>
                <a href="{reset_link}">Đặt lại mật khẩu</a>
                <p>Link này sẽ hết hạn sau 1 giờ.</p>
            </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        return jsonify({'success': True, 'message': 'Email khôi phục đã được gửi'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        token = data['token']
        new_password = data['password']

        try:
            # Verify token
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            email = payload['email']
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Link đã hết hạn'}), 400
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Link không hợp lệ'}), 400

        # Hash mật khẩu mới và cập nhật
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        db.User.update_one(
            {'email': email},
            {'$set': {'password': hashed_password}}
        )

        return jsonify({'success': True, 'message': 'Mật khẩu đã được cập nhật'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
