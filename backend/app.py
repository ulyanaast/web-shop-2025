from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import pytz
from flask_cors import CORS

app = Flask(
    __name__,
    static_folder='./static',
    static_url_path='/static'
)

CORS(app)

# Конфигурация
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static/uploads')
DB_PATH = 'orders.db'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image_path TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_name TEXT NOT NULL,
            price REAL NOT NULL,
            order_date TEXT DEFAULT CURRENT_TIMESTAMP
        )
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
               THEN '/static/' || image_path 
               ELSE NULL END as image 
        FROM products
    ''')
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
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    local_timezone = pytz.timezone('Europe/Moscow')
    current_time = datetime.now(local_timezone).strftime('%Y-%m-%d %H:%M:%S')
    
    for item in data['items']:
        cursor.execute(
            'INSERT INTO orders (product_name, price, order_date) VALUES (?, ?, ?)',
            (item['name'], item['price'], current_time)
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
        image_filename = request.form.get('image_filename')  # Получаем имя файла из формы
        
        image_path = None
        if image_filename:
            # Проверяем, что файл действительно существует
            if os.path.exists(os.path.join(UPLOAD_FOLDER, image_filename)):
                image_path = f"uploads/{image_filename}"
            else:
                return jsonify({"error": "Файл изображения не найден"}), 400
        
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
        
        # Получаем информацию о товаре перед удалением (для отладки)
        cursor.execute('SELECT * FROM products WHERE id = ?', (id,))
        product = cursor.fetchone()
        
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

@app.route('/admin')
def admin():
    return send_from_directory('../frontend/templates', 'admin.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('../frontend/static', filename)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('../frontend/static', 'favicon.ico')


if __name__ == '__main__':
    app.run(debug=True, port=5000)
