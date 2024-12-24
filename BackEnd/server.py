from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util
import json
import ssl
from werkzeug.security import generate_password_hash, check_password_hash
import re
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import jwt
from bson import ObjectId
from flask_swagger_ui import get_swaggerui_blueprint

app = Flask(__name__)

# Remove all previous CORS settings and use this simplified version
CORS(app)

# Khai báo biến global
client = None
db = None
product_collection = None
users_collection = None

# Thêm dictionary để lưu OTP tạm thời
otp_storage = {}

# Thêm biến để lưu trữ mã xác thực tạm thời
verification_storage = {}

# Cấu hình email
EMAIL_ADDRESS = "dounecompany@gmail.com"  # Thay bằng email của bạn
EMAIL_PASSWORD = "zasa vbpy arko snov"     # Thay bằng app password của bạn
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Thêm SECRET_KEY vào các biến config ở đầu file
SECRET_KEY = "VEAEAMCMEMMME853mSAJFJEJKFEAEK9225j"  # Thay đổi thành một key phức tạp và bảo mật

# Add this after creating the Flask app
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

# Add a route to serve the swagger.json file
@app.route('/static/swagger.json')
def serve_swagger_spec():
    return send_from_directory('static', 'swagger.json')

try:
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
    client.server_info()
    db = client['DouneStore']
    product_collection = db['product']
    users_collection = db['User']
except Exception as e:
    print(f"Lỗi kết nối MongoDB: {e}")

# Hàm kiểm tra email hợp lệ
def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

@app.route('/api/products', methods=['GET'])
def get_all_products():
    try:
        if product_collection is None:
            print("Database connection not available")
            return jsonify({'error': 'Database connection not available'}), 500
            
        products = list(product_collection.find(
            {},
            {'name': 1, 'description': 1, 'price': 1, 'image': 1, 'category': 1, 'labels': 1}
        ))
        print(f"Found {len(products)} products")
        return json.loads(json_util.dumps(products))
    except Exception as e:
        print(f"Error in get_all_products: {str(e)}")
        return jsonify({'error': str(e)}), 500

# API lấy tất cả sản phẩm theo category
@app.route('/api/products/<category>', methods=['GET'])
def get_products_by_category(category):
    try:
        # Tìm kiếm sản phẩm theo category và bao gồm tất cả thông tin (bao gồm image)
        products = list(product_collection.find(
            {'category': category},
            {'name': 1, 'description': 1, 'price': 1, 'image': 1, 'category': 1, 'labels': 1}
        ))
        return json.loads(json_util.dumps(products))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API tìm kiếm sản phẩm
@app.route('/api/products/search/<query>', methods=['GET'])
def search_products(query):
    try:
        # Tìm kiếm theo tên hoặc mô tả và bao gồm tất cả thông tin (bao gồm image)
        products = list(product_collection.find( 
            {
                '$or': [
                    {'name': {'$regex': query, '$options': 'i'}},
                    {'description': {'$regex': query, '$options': 'i'}}
                ]
            },
            {'name': 1, 'description': 1, 'price': 1, 'image': 1, 'category': 1, 'labels': 1}
        ))
        return json.loads(json_util.dumps(products))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        auth_method = data.get('authMethod', 'email')  # Mặc định là email

        # Validate input
        if not all([email, password, name]):
            return jsonify({'error': 'Vui lòng điền đầy đủ thông tin'}), 400
        
        if not is_valid_email(email):
            return jsonify({'error': 'Email không hợp lệ'}), 400

        # Check if email already exists
        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'Email đã tồn tại'}), 409

        # Hash password
        hashed_password = generate_password_hash(password)

        # Create user with auth method
        user = {
            'email': email,
            'password': hashed_password,
            'name': name,
            'authMethod': auth_method,
            'createdAt': datetime.utcnow()
        }
        
        users_collection.insert_one(user)
        return jsonify({'message': 'Đăng ký thành công'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Thiếu thông tin đăng nhập'}), 400

        user = users_collection.find_one({'email': email})
        if user and check_password_hash(user['password'], password):
            # Tạo token với thông tin user
            token = generate_auth_token({
                'email': user['email'],
                'authMethod': user.get('authMethod', 'email')
            })
            
            return jsonify({
                'token': token,
                'user': {
                    'id': str(user['_id']),
                    'email': user['email'],
                    'name': user.get('name', ''),
                    'authMethod': user.get('authMethod', 'email'),
                    'phone': user.get('phone', ''),
                    'secondaryEmail': user.get('secondaryEmail', ''),
                    'secondaryPhone': user.get('secondaryPhone', '')
                }
            }), 200
        else:
            return jsonify({'error': 'Email hoặc mật khẩu không đúng'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def send_otp_email(email, otp):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = email
        msg['Subject'] = "Mã xác thực đăng ký tài khoản DouneStore"

        body = f"""
        Xin chào,
        
        Mã xác thực của bạn là: {otp}
        
        Mã này sẽ hết hạn sau 5 phút.
        
        Trân trọng,
        DouneStore Team
        """
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.json
        email = data.get('email')
        name = data.get('name')
        password = data.get('password')

        if not email or not is_valid_email(email):
            return jsonify({'error': 'Email không hợp lệ'}), 400

        # Kiểm tra email đã tồn tại
        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'Email đã tồn tại'}), 409

        # Tạo OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Lưu thông tin tạm thời
        otp_storage[email] = {
            'otp': otp,
            'name': name,
            'password': password,
            'timestamp': datetime.now()
        }

        # Gửi OTP qua email
        if send_otp_email(email, otp):
            return jsonify({'message': 'OTP đã được gửi đến email của bạn'}), 200
        else:
            return jsonify({'error': 'Không thể gửi OTP'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        email = data.get('email')
        submitted_otp = data.get('otp')

        if not email or not submitted_otp:
            return jsonify({'error': 'Thiếu thông tin'}), 400

        stored_data = otp_storage.get(email)
        if not stored_data:
            return jsonify({'error': 'OTP đã hết hạn hoặc không tồn tại'}), 400

        # Kiểm tra thời gian hết hạn (5 phút)
        if (datetime.now() - stored_data['timestamp']).total_seconds() > 300:
            del otp_storage[email]
            return jsonify({'error': 'OTP đã hết hạn'}), 400

        if submitted_otp != stored_data['otp']:
            return jsonify({'error': 'OTP không chính xác'}), 400

        # Tạo tài khoản mới
        hashed_password = generate_password_hash(stored_data['password'])
        user = {
            'email': email,
            'password': hashed_password,
            'name': stored_data['name']
        }
        
        users_collection.insert_one(user)
        
        # Xóa OTP đã sử dụng
        del otp_storage[email]

        return jsonify({'message': 'Đăng ký thành công'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_auth_token(payload):
    """
    Tạo JWT token cho user authentication
    """
    try:
        # Token sẽ hết hạn sau 24 giờ
        payload['exp'] = datetime.utcnow() + timedelta(days=1)
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        return token
    except Exception as e:
        print(f"Error generating token: {str(e)}")
        return None

@app.route('/api/auth/verify-token', methods=['GET'])
def verify_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401
    
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return jsonify({'valid': True}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload['email']
        
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Thêm thông tin về phương thức đăng ký
        return jsonify({
            'name': user.get('name'),
            'email': user.get('email'),
            'phone': user.get('phone'),
            'authMethod': user.get('authMethod'),  # 'email' hoặc 'phone'
            'birthDate': user.get('birthDate'),
            'address': user.get('address'),
            'avatar': user.get('avatar'),
            'stats': user.get('stats')
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/user/profile', methods=['PUT'])
def update_user_profile():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload['email']
        
        data = request.json
        update_data = {
            'name': data.get('name'),
            'displayName': data.get('displayName'),
            'birthDate': data.get('birthDate'),
            'gender': data.get('gender'),
            'phone': data.get('phone'),
            'address': data.get('address'),
            'avatar': data.get('avatar')
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = users_collection.update_one(
            {'email': email},
            {'$set': update_data}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Profile updated successfully'}), 200
        return jsonify({'message': 'No changes made'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/user/addresses', methods=['GET'])
def get_user_addresses():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload['email']
        
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        addresses = user.get('addresses', [])
        return jsonify(addresses), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/user/addresses', methods=['POST'])
def add_address():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload['email']
        
        address_data = request.json
        address_data['id'] = str(ObjectId())  # Generate unique ID for address
        
        result = users_collection.update_one(
            {'email': email},
            {'$push': {'addresses': address_data}}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Address added successfully', 'address': address_data}), 200
        return jsonify({'error': 'Failed to add address'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/user/addresses/<address_id>', methods=['PUT'])
def update_address(address_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload['email']
        
        address_data = request.json
        
        result = users_collection.update_one(
            {'email': email, 'addresses.id': address_id},
            {'$set': {'addresses.$': address_data}}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Address updated successfully'}), 200
        return jsonify({'error': 'Failed to update address'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/user/addresses/<address_id>', methods=['DELETE'])
def delete_address(address_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload['email']
        
        result = users_collection.update_one(
            {'email': email},
            {'$pull': {'addresses': {'id': address_id}}}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Address deleted successfully'}), 200
        return jsonify({'error': 'Failed to delete address'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/user/security', methods=['PUT'])
def update_password():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload['email']
        
        data = request.json
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        user = users_collection.find_one({'email': email})
        if not user or not check_password_hash(user['password'], current_password):
            return jsonify({'error': 'Mật khẩu hiện tại không đúng'}), 400
            
        hashed_password = generate_password_hash(new_password)
        result = users_collection.update_one(
            {'email': email},
            {'$set': {'password': hashed_password}}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Password updated successfully'}), 200
        return jsonify({'error': 'Failed to update password'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/user/contact', methods=['PUT'])
def update_contact_info():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload['email']
        
        data = request.json
        action = data.get('action')  # 'add', 'update', or 'remove'
        contact_type = data.get('type')  # 'email' or 'phone'
        value = data.get('value')
        otp = data.get('otp')
        
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Kiểm tra OTP
        stored_otp = otp_storage.get(f"{email}_{contact_type}")
        if not stored_otp or stored_otp['otp'] != otp:
            return jsonify({'error': 'Invalid OTP'}), 400

        # Kiểm tra để đảm bảo luôn có ít nhất một phương thức liên hệ
        if action == 'remove':
            has_email = user.get('secondaryEmail') if contact_type == 'email' else user.get('email')
            has_phone = user.get('secondaryPhone') if contact_type == 'phone' else user.get('phone')
            if not (has_email or has_phone):
                return jsonify({'error': 'Must maintain at least one contact method'}), 400

        # Cập nhật thông tin
        update_field = f"secondary{contact_type.capitalize()}" if action == 'add' else contact_type
        if action in ['add', 'update']:
            result = users_collection.update_one(
                {'email': email},
                {'$set': {update_field: value}}
            )
        elif action == 'remove':
            result = users_collection.update_one(
                {'email': email},
                {'$unset': {update_field: ""}}
            )

        # Xóa OTP đã sử dụng
        del otp_storage[f"{email}_{contact_type}"]
        
        return jsonify({'message': 'Contact information updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/user/contact/send-otp', methods=['POST'])
def send_contact_otp():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_email = payload['email']
        
        data = request.json
        contact_type = data.get('type')  # 'email' or 'phone'
        value = data.get('value')
        
        # Tạo và lưu OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        otp_storage[f"{user_email}_{contact_type}"] = {
            'otp': otp,
            'timestamp': datetime.now()
        }
        
        # Gửi OTP
        if contact_type == 'email':
            if not send_otp_email(value, otp):
                return jsonify({'error': 'Failed to send OTP email'}), 500
        else:
            # Implement SMS sending here if needed
            pass
            
        return jsonify({'message': 'OTP sent successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401

if __name__ == '__main__':
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    # Thay đổi đường dẫn tới SSL certificate của bạn
    context.load_cert_chain('certificate.pem', 'private-key.pem')
    
    app.run(debug=True, host='0.0.0.0', port=5000, ssl_context=context)
