from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from dotenv import load_dotenv
import threading
import time
import hmac
import hashlib
import json
import requests
from urllib.parse import parse_qsl
import os

load_dotenv('job.env')

bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
bot_username = os.getenv('TELEGRAM_BOT_USERNAME')
webapp_url = os.getenv('WEBAPP_URL')

bot_username = os.getenv('TELEGRAM_BOT_USERNAME')  # Вернёт "Not_Pictures_bot"
referral_link = f"https://t.me/{bot_username}?start=ref_123"

def set_bot_commands():
    if not bot_token:
        raise ValueError("Telegram bot token not configured!")
        
    url = f"https://api.telegram.org/bot{bot_token}/setCommands"
    commands = [
        {
            "command": "start",
            "description": "Start the WebApp"
        }
    ]
    response = requests.post(url, json={"commands": commands})
    if response.status_code != 200:
        print(f"Failed to set commands: {response.text}")

# Вызов при старте
if __name__ == '__main__':
    set_bot_commands()


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    points = db.Column(db.Float, default=0.0)
    points_active = db.Column(db.Boolean, default=False)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.String(50), db.ForeignKey('user.id'))
    referred_id = db.Column(db.String(50), db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/api/referral', methods=['GET', 'POST'])
def handle_referrals():
    init_data = request.headers.get('X-Telegram-InitData')
    if not init_data or not verify_init_data(init_data):
        return jsonify({'error': 'Invalid initData'}), 401
    
    parsed_data = dict(parse_qsl(init_data))
    user_data = json.loads(parsed_data.get('user', '{}'))
    user_id = str(user_data.get('id'))
    
    if request.method == 'GET':
        return jsonify({
            'referral_link': f'https://t.me/Not_Pictures_bot?start=ref_{user_id}',
            'referral_count': Referral.query.filter_by(referrer_id=user_id).count()
        })
    
    elif request.method == 'POST':
        
        referred_id = request.json.get('referred_id')
        if not referred_id:
            return jsonify({'error': 'referred_id is required'}), 400
        
        if Referral.query.filter_by(referrer_id=user_id, referred_id=referred_id).first():
            return jsonify({'error': 'User already referred'}), 400
        
        
        referral = Referral(referrer_id=user_id, referred_id=referred_id)
        db.session.add(referral)
        
        
        referrer = User.query.get(user_id)
        referred_user = User.query.get(referred_id)
        
        referrer.points += 20  # Бонус за приглашение
        referred_user.points += 10  # Бонус новому пользователю
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Referral accepted! 20 points added',
            'new_balance': referrer.points
        })


with app.app_context():
    db.create_all()
    print("Database initialized")


def verify_init_data(init_data: str) -> bool:
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return False
            
        parsed_data = dict(parse_qsl(init_data))
        hash_str = parsed_data.pop('hash')
        
        data_check_string = "\n".join(
            f"{key}={value}" 
            for key, value in sorted(parsed_data.items())
        )
        
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        return calculated_hash == hash_str
    except:
        return False


def points_accumulator():
    with app.app_context():
        while True:
            try:
                active_users = User.query.filter_by(points_active=True).all()
                print(f"Processing {len(active_users)} active users")
                
                for user in active_users:
                    user.points += 0.01
                    user.last_active = datetime.utcnow()
                    print(f"Added points to user {user.id}")
                
                db.session.commit()
                time.sleep(60)  # Run every minute
            except Exception as e:
                print(f"Points accumulator error: {str(e)}")
                time.sleep(30)

def set_menu_button():
    url = f"https://api.telegram.org/bot{bot_token}/setChatMenuButton"
    menu_button = {
        "menu_button": {
            "type": "web_app",
            "text": "Open App",
            "web_app": {
                "url": f"{webapp_url}"
            }
        }
    }
    requests.post(url, json=menu_button)

set_menu_button()

points_thread = threading.Thread(target=points_accumulator, daemon=True)
points_thread.start()

@app.route('/webapp')
def webapp_info():
    return jsonify({
        'bot_username': bot_username,
        'webapp_url': webapp_url,
        'status': 'ready'
    })

@app.route('/')
def index():
    # Проверяем, что запрос пришел из Telegram
    init_data = request.headers.get('X-Telegram-InitData')
    if not init_data or not verify_init_data(init_data):
        return "Please open this page from Telegram", 403
    return render_template('index.html')

@app.route('/drawing')
def drawing():
    return render_template('drawing.html')

@app.route('/top')
def top():
    return render_template('top.html')

@app.route('/earn')
def earn():
    return render_template('earn.html')

@app.route('/buns')
def buns():
    return render_template('buns.html')

@app.route('/invite')
def invite():
    return render_template('invite.html')



@app.route('/api/user', methods=['GET'])
def get_user():
    init_data = request.headers.get('X-Telegram-InitData')
    if not init_data or not verify_init_data(init_data):
        return jsonify({'error': 'Invalid initData'}), 401
    
    parsed_data = dict(parse_qsl(init_data))
    user_data = json.loads(parsed_data.get('user', '{}'))
    user_id = str(user_data.get('id'))
    
    if not user_id:
        return jsonify({'error': 'User ID not found'}), 400
    
    user = User.query.get(user_id)
    if not user:
        user = User(id=user_id)
        db.session.add(user)
        db.session.commit()
    
    return jsonify({
        'id': user.id,
        'points': round(user.points, 2),
        'points_active': user.points_active,
        'last_active': user.last_active.isoformat() if user.last_active else None
    })

@app.route('/api/toggle_points', methods=['POST'])
def toggle_points():
    init_data = request.headers.get('X-Telegram-InitData')
    if not init_data or not verify_init_data(init_data):
        return jsonify({'error': 'Invalid initData'}), 401
    
    parsed_data = dict(parse_qsl(init_data))
    user_data = json.loads(parsed_data.get('user', '{}'))
    user_id = str(user_data.get('id'))
    
    if not user_id:
        return jsonify({'error': 'User ID not found'}), 400
    
    user = User.query.get(user_id)
    if not user:
        user = User(id=user_id)
        db.session.add(user)
    
    user.points_active = not user.points_active
    user.last_active = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'points_active': user.points_active,
        'message': f'Points accumulation {"started" if user.points_active else "stopped"}'
    })

@app.route('/api/wallet/balance', methods=['GET'])
def get_wallet_balance():
    init_data = request.headers.get('X-Telegram-InitData')
    if not init_data or not verify_init_data(init_data):
        return jsonify({'error': 'Invalid initData'}), 401
    
    parsed_data = dict(parse_qsl(init_data))
    user_data = json.loads(parsed_data.get('user', '{}'))
    wallet_address = user_data.get('wallet_address')
    
    if not wallet_address:
        return jsonify({'error': 'Wallet address not found'}), 400
    
    
    return jsonify({
        'status': 'success',
        'address': wallet_address,
        'balance': 0.0,  
        'currency': 'TON'
    })

@app.route('/api/referral/stats', methods=['GET'])
def get_referral_stats():
    init_data = request.headers.get('X-Telegram-InitData')
    if not init_data or not verify_init_data(init_data):
        return jsonify({'error': 'Invalid initData'}), 401
    
    parsed_data = dict(parse_qsl(init_data))
    user_data = json.loads(parsed_data.get('user', '{}'))
    user_id = str(user_data.get('id'))
    
    referral_count = Referral.query.filter_by(referrer_id=user_id).count()
    earned_points = referral_count * 20
    
    return jsonify({
        'referral_count': referral_count,
        'earned_points': earned_points,
        'referral_link': f'https://t.me/Not_Pictures_bot?start=ref_{user_id}'
    })

if __name__ == '__main__':
    app.run(debug=True)