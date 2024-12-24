from pymongo import MongoClient

# Kết nối MongoDB
client = MongoClient('mongodb://localhost:27017/')

# Thêm đoạn code để kiểm tra kết nối
try:
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    print("MongoDB connection successful!")
except Exception as e:
    print("MongoDB connection failed:", e)

db = client['DouneStore']
product_collection = db['product']

# Xóa dữ liệu cũ nếu có
product_collection.delete_many({})

# Dữ liệu mẫu
products_data = [
    {
        "category": "ai tools",
        "name": "ChatGPT Plus",
        "description": "Trợ lý AI thông minh với khả năng chat và xử lý ngôn ngữ tự nhiên",
        "price": "599.000đ/tháng",
        "image": "https://storage.googleapis.com/doune-storage/products/chatgpt-plus.jpg",
        "labels": ["hot", "new"]
    },
    {
        "category": "ai tools",
        "name": "Midjourney",
        "description": "Công cụ AI tạo hình ảnh từ văn bản chuyên nghiệp",
        "price": "799.000đ/tháng",
        "image": "https://storage.googleapis.com/doune-storage/products/midjourney.jpg",
        "labels": ["hot"]
    },
    {
        "category": "software",
        "name": "Adobe Creative Cloud",
        "description": "Bộ công cụ thiết kế đồ họa chuyên nghiệp",
        "price": "1.299.000đ/tháng",
        "image": "https://storage.googleapis.com/doune-storage/products/adobe-cc.jpg",
        "labels": ["sale"]
    },
    {
        "category": "software",
        "name": "Visual Studio Code Pro",
        "description": "IDE phát triển code đa nền tảng với nhiều tính năng cao cấp",
        "price": "299.000đ/tháng",
        "image": "https://storage.googleapis.com/doune-storage/products/vscode-pro.jpg",
        "labels": ["new"]
    },
    {
        "category": "data",
        "name": "Tableau Professional",
        "description": "Phần mềm phân tích và trực quan hóa dữ liệu hàng đầu",
        "price": "899.000đ/tháng",
        "image": "https://storage.googleapis.com/doune-storage/products/tableau.jpg",
        "labels": ["hot"]
    },
    {
        "category": "data",
        "name": "Power BI Premium",
        "description": "Nền tảng phân tích dữ liệu doanh nghiệp của Microsoft",
        "price": "699.000đ/tháng",
        "image": "https://storage.googleapis.com/doune-storage/products/power-bi.jpg",
        "labels": ["sale"]
    },
    {
        "category": "robot kit",
        "name": "Arduino Starter Kit",
        "description": "Bộ kit học lập trình robot cơ bản với Arduino",
        "price": "1.499.000đ",
        "image": "https://storage.googleapis.com/doune-storage/products/arduino-kit.jpg",
        "labels": ["new"]
    },
    {
        "category": "robot kit",
        "name": "Raspberry Pi 4 Complete Kit",
        "description": "Bộ kit phát triển IoT và robot với Raspberry Pi 4",
        "price": "2.999.000đ",
        "image": "https://storage.googleapis.com/doune-storage/products/raspberry-pi-kit.jpg",
        "labels": ["hot", "sale"]
    }
]

# Import dữ liệu
product_collection.insert_many(products_data)
print("Đã import dữ liệu thành công!") 