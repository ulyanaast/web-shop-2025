from flask import Blueprint, render_template, request, flash, redirect, url_for
import sqlite3
from pathlib import Path
import os
from werkzeug.utils import secure_filename

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

BASE_DIR = Path(__file__).parent.parent
UPLOAD_FOLDER = BASE_DIR / 'frontend' / 'static' / 'uploads'
DB_PATH = BASE_DIR / 'backend' / 'orders.db'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.lower().endswith(('.png', '.jpg', '.jpeg'))

@admin_bp.route('/', methods=['GET', 'POST'])
def admin_panel():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if request.method == 'POST':
        try:
            name = request.form['name']
            price = float(request.form['price'])
            image_path = None
            
            if 'image' in request.files:
                file = request.files['image']
                if file and file.filename != '':
                    filename = secure_filename(file.filename)
                    file.save(UPLOAD_FOLDER / filename)
                    image_path = f'uploads/{filename}'
            
            cursor.execute(
                'INSERT INTO products (name, price, image_path) VALUES (?, ?, ?)',
                (name, price, image_path)
            )
            conn.commit()
            flash('Товар успешно добавлен!', 'success')
            
        except ValueError:
            flash('Некорректная цена', 'error')
        except Exception as e:
            conn.rollback()
            flash(f'Ошибка: {str(e)}', 'error')
        finally:
            conn.close()
            return redirect(url_for('admin.admin_panel'))
    
    products = conn.execute('SELECT * FROM products ORDER BY id DESC').fetchall()
    conn.close()
    return render_template('admin.html', products=products)