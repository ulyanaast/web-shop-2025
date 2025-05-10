from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import pytz
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend/static', static_url_path='/static')

# Настройки CORS
CORS(app, 
     resources={
         r"/api/*": {
             "origins": [
                 "https://ulyanaast.github.io",
                 "https://ulyanasst.github.io",
                 "http://localhost:*",
                 "https://ast-backend-rw3h.onrender.com"
             ],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "X-Device-ID"],  # Добавьте X-Device-ID
             "supports_credentials": True,
             "expose_headers": ["Content-Type"]
         }
     }
)

# Конфигурация
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, '../frontend/static/uploads')
DB_PATH = 'orders.db'
BASE_STATIC_URL = 'https://ast-backend-rw3h.onrender.com/static/uploads/'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Проверяем существование столбца device_id
    cursor.execute("PRAGMA table_info(orders)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'device_id' not in columns:
        # Безопасное добавление столбца с default значением
        cursor.execute('''
            ALTER TABLE orders 
            ADD COLUMN device_id TEXT DEFAULT 'default_device'
        ''')
    
    conn.commit()
    conn.close()

init_db()

# API для магазина
@app.route('/api/products')
def get_products():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, name, price, 
               CASE WHEN image_path IS NOT NULL 
               THEN ? || SUBSTR(image_path, 8) 
               ELSE NULL END as image 
        FROM products
    ''', (BASE_STATIC_URL,))
    products = cursor.fetchall()
    conn.close()
    return jsonify([{
        "id": p[0],
        "name": p[1],
        "price": p[2],
        "image": p[3]
    } for p in products])

@app.route('/api/order', methods=['POST'])
def save_order():
    data = request.json
    device_id = request.headers.get('X-Device-ID') or request.cookies.get('device_id')
    
    if not device_id:
        return jsonify({"error": "Device ID not found"}), 400
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    local_timezone = pytz.timezone('Europe/Moscow')
    current_time = datetime.now(local_timezone).strftime('%Y-%m-%d %H:%M:%S')
    
    for item in data['items']:
        cursor.execute(
            'INSERT INTO orders (product_name, price, order_date, device_id) VALUES (?, ?, ?, ?)',
            (item['name'], item['price'], current_time, device_id)
        )
    
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# API для админки
@app.route('/api/admin/available-images')
def get_available_images():
    images = []
    for file in os.listdir(UPLOAD_FOLDER):
        if file.lower().endswith(('.png', '.jpg', '.jpeg')):
            images.append(file)
    return jsonify(sorted(images))

@app.route('/api/admin/products', methods=['GET'])
def admin_get_products():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, price, image_path FROM products ORDER BY id DESC')
    products = cursor.fetchall()
    conn.close()
    return jsonify([{
        "id": p[0],
        "name": p[1],
        "price": p[2],
        "image": f"/static/{p[3]}" if p[3] else None
    } for p in products])

@app.route('/api/admin/products', methods=['POST'])
def admin_add_product():
    try:
        name = request.form['name']
        price = float(request.form['price'])
        image_filename = request.form.get('image_filename')
        
        image_path = None
        if image_filename and os.path.exists(os.path.join(UPLOAD_FOLDER, image_filename)):
            image_path = f"uploads/{image_filename}"
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO products (name, price, image_path) VALUES (?, ?, ?)',
            (name, price, image_path)
        )
        conn.commit()
        return jsonify({"success": True, "id": cursor.lastrowid})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/admin/products/<int:id>', methods=['DELETE'])
def admin_delete_product(id):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM products WHERE id = ?', (id,))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

# Статические файлы
@app.route('/')
def home():
    return send_from_directory('../frontend', 'index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('../frontend/static', 'favicon.ico')

@app.route('/admin')
def admin_panel():
    return send_from_directory('../frontend/templates', 'admin.html')

@app.route('/web-shop-2025/cart')
def serve_cart():
    return send_from_directory('../frontend/templates', 'cart.html')
@app.route('/web-shop-2025/static/<path:filename>')
def static_files(filename):
    return send_from_directory('../frontend/static', filename)

@app.route('/web-shop-2025/orders')
def serve_orders():
    return send_from_directory('../frontend/templates', 'orders.html')

# Дополнительные роуты
@app.route('/api/admin/orders')
def get_orders():
    device_id = request.headers.get('X-Device-ID') or request.cookies.get('device_id') or 'default_device'
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT o.id, o.product_name, o.price, o.order_date, p.image_path
        FROM orders o
        LEFT JOIN products p ON o.product_name = p.name
        WHERE o.device_id = ?
        ORDER BY o.order_date DESC
    ''', (device_id,))
    
    orders = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        "id": o[0],
        "product_name": o[1],
        "price": o[2],
        "order_date": o[3],
        "image": f"{BASE_STATIC_URL}{o[4].split('/')[-1]}" if o[4] else None
    } for o in orders])

@app.route('/api/orders')
def get_grouped_orders():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM orders ORDER BY order_date DESC')
    orders = cursor.fetchall()
    conn.close()
    
    grouped = {}
    for o in orders:
        key = o[3]  # order_date
        if key not in grouped:
            grouped[key] = {
                "date": key,
                "items": [],
                "total": 0
            }
        grouped[key]["items"].append({
            "product_name": o[1],
            "price": o[2]
        })
        grouped[key]["total"] += o[2]
    
    return jsonify(list(grouped.values()))

@app.route('/api/order', methods=['OPTIONS'])
def handle_options():
    response = jsonify({"success": True})
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, X-Device-ID')
    return response

@app.route('/admin-static/<path:filename>')
def admin_static(filename):
    return send_from_directory('../frontend/static', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
