from pymongo import MongoClient
from datetime import datetime

# Kết nối đến MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['DouneStore']

# Dữ liệu sản phẩm mẫu
sample_products = [
    {
        "name": "Robot Hút Bụi Thông Minh",
        "description": "Robot hút bụi tự động với công nghệ AI, tự động nhận diện và làm sạch hiệu quả",
        "category": "robots",
        "type": "Objects",
        "image": "https://cdn.tgdd.vn/Products/Images/7922/242732/robot-hut-bui-lau-nha-xiaomi-mop-2-pro-sku2-1.jpg",
        "isPremium": True,
        "price": 7990000,
        "createdAt": datetime.now()
    },
    {
        "name": "Robot Lau Nhà Thông Minh",
        "description": "Robot lau nhà thông minh với công nghệ lau hiện đại, tự động làm sạch sàn nhà",
        "category": "robots",
        "type": "Objects",
        "image": "https://cdn.tgdd.vn/Products/Images/7922/286990/robot-hut-bui-lau-nha-dreame-l10s-pro-1.jpg",
        "isPremium": True,
        "price": 8990000,
        "createdAt": datetime.now()
    },
    {
        "name": "Dịch Vụ Bảo Trì Robot",
        "description": "Dịch vụ bảo trì, sửa chữa robot định kỳ với đội ngũ kỹ thuật chuyên nghiệp",
        "category": "services",
        "type": "Intangibles",
        "image": "https://robotsanpham.com/wp-content/uploads/2023/03/sua-chua-robot.jpg",
        "isPremium": False,
        "price": 499000,
        "createdAt": datetime.now()
    },
]
def seed_products():
    try:
        # Xóa tất cả sản phẩm cũ (tùy chọn)
        db.Product.delete_many({})
        
        # Thêm sản phẩm mới
        result = db.Product.insert_many(sample_products)
        
        print(f"Đã thêm thành công {len(result.inserted_ids)} sản phẩm")
        
        # Hiển thị danh sách sản phẩm đã thêm
        print("\nDanh sách sản phẩm:")
        for product in db.Product.find():
            print(f"- {product['name']} ({product['category']})")
            
    except Exception as e:
        print(f"Lỗi: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    seed_products()