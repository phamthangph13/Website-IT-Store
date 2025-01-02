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
import string
import base64

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://127.0.0.1:5500", "http://localhost:5500"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

client = MongoClient('mongodb://localhost:27017/')
db = client['DouneStore']

otp_storage = {}

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "dounecompany@gmail.com"
SMTP_PASSWORD = "zasa vbpy arko snov"

SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.json'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "DouneStore API"
    }
)

app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')

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

def generate_unique_link(length=200):
    while True:
        characters = string.ascii_letters + string.digits
        random_link = ''.join(random.choice(characters) for _ in range(length))
        
        if not db.User.find_one({'account_link': random_link}):
            return random_link

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data['email']
        password = data['password']
        fullname = data['fullname']

        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        otp_storage[email] = {
            'otp': otp,
            'fullname': fullname,
            'password': bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()),
            'timestamp': datetime.now()
        }

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

        if datetime.now() - otp_storage[email]['timestamp'] > timedelta(minutes=15):
            del otp_storage[email]
            return jsonify({'success': False, 'message': 'OTP đã hết hạn'}), 400

        account_link = generate_unique_link()

        db.User.insert_one({
            'fullname': otp_storage[email]['fullname'],
            'email': email,
            'password': otp_storage[email]['password'],
            'role': 'Member',
            'account_link': account_link,
            'avatar': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHbEB1-Dr0WWq3h2HYDaK0e-AklnBEjMcoSg&s',
            'createdAt': datetime.now()
        })

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

        user = db.User.find_one({'email': email})
        
        if not user:
            return jsonify({'success': False, 'message': 'Email không tồn tại'}), 400
        
        if bcrypt.checkpw(password.encode('utf-8'), user['password']):
            return jsonify({
                'success': True, 
                'message': 'Đăng nhập thành công',
                'user': {
                    'fullname': user['fullname'],
                    'email': user['email'],
                    'role': user['role'],
                    'account_link': user.get('account_link', ''),
                    'avatar': user.get('avatar', '')
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
        
        user = db.User.find_one({'email': email})
        if not user:
            return jsonify({'success': False, 'message': 'Email không tồn tại'}), 404

        token = jwt.encode({
            'email': email,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, JWT_SECRET)

        reset_link = f"http://127.0.0.1:5500/Form/reset-password.html?token={token}"

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
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            email = payload['email']
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Link đã hết hạn'}), 400
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Link không hợp lệ'}), 400

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        db.User.update_one(
            {'email': email},
            {'$set': {'password': hashed_password}}
        )

        return jsonify({'success': True, 'message': 'Mật khẩu đã được cập nhật'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/user/<account_link>', methods=['GET'])
def get_user(account_link):
    try:
        user = db.User.find_one({'account_link': account_link})
        
        if user:
            user_data = {
                '_id': str(user['_id']),
                'fullname': user['fullname'],
                'email': user['email'],
                'role': user['role'],
                'account_link': user['account_link'],
                'avatar': user['avatar'],
                'phone': user.get('phone', ''),
                'address': user.get('address', ''),
                'createdAt': user['createdAt'].isoformat()
            }
            
            try:
                orders_count = db.Orders.count_documents({'user_id': str(user['_id'])})
                user_data['stats'] = {
                    'orders': orders_count,
                    'rating': 4.8
                }
            except Exception as stats_error:
                user_data['stats'] = {
                    'orders': 0,
                    'rating': 0
                }
            
            return jsonify(user_data)
        
        return jsonify({'error': 'User not found'}), 404
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/user/update/<account_link>', methods=['POST'])
def update_user(account_link):
    try:
        data = request.get_json()
        
        user = db.User.find_one({'account_link': account_link})
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy người dùng'
            }), 404

        update_data = {}
        
        if 'fullname' in data:
            new_fullname = data['fullname'].strip()
            current_fullname = user.get('fullname', '')
            if new_fullname != current_fullname:
                update_data['fullname'] = new_fullname
        
        if 'phone' in data:
            new_phone = data['phone'].strip()
            current_phone = user.get('phone', '')
            if new_phone != current_phone:
                if new_phone and (not new_phone.isdigit() or len(new_phone) != 10):
                    return jsonify({
                        'success': False,
                        'message': 'Số điện thoại không hợp lệ'
                    }), 400
                update_data['phone'] = new_phone
        
        if 'address' in data:
            new_address = data['address'].strip()
            current_address = user.get('address', '')
            if new_address != current_address:
                update_data['address'] = new_address

        if not update_data:
            return jsonify({
                'success': True,
                'message': 'Không có thay đổi nào được thực hiện'
            })

        update_data['updatedAt'] = datetime.now()

        result = db.User.update_one(
            {'account_link': account_link},
            {'$set': update_data}
        )

        if result.modified_count > 0:
            updated_user = db.User.find_one({'account_link': account_link})
            
            return jsonify({
                'success': True,
                'message': 'Cập nhật thông tin thành công'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Không thể cập nhật thông tin'
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Có lỗi xảy ra khi cập nhật thông tin',
            'error': str(e)
        }), 500

@app.route('/user/update-avatar/<account_link>', methods=['POST'])
def update_avatar(account_link):
    try:
        data = request.get_json()
        if not data or 'avatar' not in data:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy dữ liệu avatar'
            }), 400

        avatar_base64 = data['avatar']
        
        result = db.User.update_one(
            {'account_link': account_link},
            {'$set': {
                'avatar': avatar_base64,
                'updatedAt': datetime.now()
            }}
        )

        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': 'Cập nhật avatar thành công',
                'avatar': avatar_base64
            })
        
        return jsonify({
            'success': False,
            'message': 'Không thể cập nhật avatar'
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Có lỗi xảy ra khi cập nhật avatar',
            'error': str(e)
        }), 500

@app.route('/products', methods=['GET'])
def get_products():
    try:
        # Lấy tất cả sản phẩm từ collection
        products = list(db.Product.find())
        
        # Chuyển đổi ObjectId thành string để có thể serialize
        for product in products:
            product['_id'] = str(product['_id'])
        
        return jsonify({
            'success': True,
            'products': products
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/services', methods=['GET'])
def get_services():
    try:
        services = list(db.Product.find({"category": "services"}))
        for service in services:
            service['_id'] = str(service['_id'])
        
        return jsonify({
            'success': True,
            'services': services
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/services/use/<service_id>', methods=['POST'])
def use_service(service_id):
    try:
        data = request.get_json()
        user_id = data.get('userId')        
        return jsonify({
            'success': True,
            'message': 'Bắt đầu sử dụng dịch vụ thành công'
        })
    except Exception as e:
    
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/user/check-role/<account_link>', methods=['GET'])
def check_user_role(account_link):
    try:
        user = db.User.find_one({'account_link': account_link})
        if user:
            return jsonify({
                'success': True,
                'role': user['role']
            })
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
