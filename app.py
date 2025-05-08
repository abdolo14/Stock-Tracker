from flask import Flask, jsonify, request, send_from_directory, session, redirect, url_for
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import requests
from datetime import datetime
import random
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_url_path='/static', static_folder='static')
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True, resources={r"*": {"origins": ["http://localhost:5014", "http://127.0.0.1:*"], "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type"]}})

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['stock_tracker']
users_collection = db['users']
stocks_collection = db['stocks']
portfolio_collection = db['portfolio']

from bson.objectid import ObjectId

class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['_id'])
        self.username = user_data['username']
        self.email = user_data['email']

@login_manager.user_loader
def load_user(user_id):
    try:
        user_data = users_collection.find_one({'_id': ObjectId(user_id)})
        return User(user_data) if user_data else None
    except Exception as e:
        print(f'Error loading user: {e}')
        return None


@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    try:
        print(f'Fetching data for {symbol}...')
        url = f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}'
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if 'chart' not in data or 'result' not in data['chart'] or not data['chart']['result']:
            return jsonify({'error': f'No data available for {symbol}'}), 404
            
        result = data['chart']['result'][0]
        quote = result['meta']
        
        current_price = quote.get('regularMarketPrice', 0)
        previous_close = quote.get('previousClose', current_price)
        change_percent = ((current_price - previous_close) / previous_close) * 100 if previous_close else 0
        
        response_data = {
            'symbol': symbol,
            'name': quote.get('instrumentType', 'Stock') + ': ' + symbol,
            'price': round(current_price, 2),
            'change': round(change_percent, 2),
            'volume': quote.get('regularMarketVolume', 0)
        }
        
        print(f'Successfully fetched data for {symbol}')
        return jsonify(response_data)

    except Exception as e:
        print(f'Error fetching data for {symbol}: {str(e)}')
        return jsonify({'error': f'Failed to fetch data for {symbol}: {str(e)}'}), 500

@app.route('/api/portfolio', methods=['GET', 'POST'])
@login_required
def manage_portfolio():
    if request.method == 'POST':
        data = request.json
        data['user_id'] = current_user.id
        
        # Check if stock already exists in user's portfolio
        existing_stock = portfolio_collection.find_one({
            'user_id': current_user.id,
            'symbol': data['symbol']
        })
        
        if existing_stock:
            # Update existing position
            portfolio_collection.update_one(
                {'_id': existing_stock['_id']},
                {'$set': {
                    'shares': existing_stock['shares'] + data['shares'],
                    'price': data['price']
                }}
            )
            return jsonify({'message': 'Portfolio updated successfully'})
        
        # Add new stock to portfolio
        portfolio_collection.insert_one(data)
        return jsonify({'message': 'Stock added to portfolio'})
    
    # Get user's portfolio
    portfolio = list(portfolio_collection.find({'user_id': current_user.id}, {'_id': 0}))
    return jsonify(portfolio)

@app.route('/api/portfolio/<symbol>', methods=['DELETE'])
@login_required
def remove_from_portfolio(symbol):
    result = portfolio_collection.delete_one({
        'user_id': current_user.id,
        'symbol': symbol
    })
    
    if result.deleted_count == 0:
        return jsonify({'error': 'Stock not found in portfolio'}), 404
    
    return jsonify({'message': 'Stock removed from portfolio'})

@app.route('/api/historical/<symbol>', methods=['GET'])
def get_historical_data(symbol):
    try:
        url = f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1y&interval=1d'
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if 'chart' not in data or 'result' not in data['chart'] or not data['chart']['result']:
            return jsonify({'error': f'No historical data available for {symbol}'}), 404
            
        result = data['chart']['result'][0]
        timestamps = result['timestamp']
        quotes = result['indicators']['quote'][0]
        
        historical_data = [{
            'Date': datetime.fromtimestamp(ts).strftime('%Y-%m-%d'),
            'Close': close,
            'Volume': volume
        } for ts, close, volume in zip(timestamps, quotes['close'], quotes['volume'])]
        
        return jsonify(historical_data)
    except Exception as e:
        print(f'Error fetching historical data for {symbol}: {str(e)}')
        return jsonify({'error': 'Failed to fetch historical data'}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    data = request.json
    
    # Check if username or email already exists
    if users_collection.find_one({'$or': [
        {'username': data['username']},
        {'email': data['email']}
    ]}):
        return jsonify({'error': 'Username or email already exists'}), 400
    
    # Create new user
    user_data = {
        'username': data['username'],
        'email': data['email'],
        'password': generate_password_hash(data['password'])
    }
    
    result = users_collection.insert_one(user_data)
    user_data['_id'] = result.inserted_id
    
    # Log the user in
    user = User(user_data)
    login_user(user)
    
    return jsonify({'message': 'Registration successful'})

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    data = request.json
    
    # Find user by username
    user_data = users_collection.find_one({'username': data['username']})
    
    if not user_data or not check_password_hash(user_data['password'], data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    user = User(user_data)
    login_user(user)
    
    return jsonify({'message': 'Login successful'})

@app.route('/api/auth/logout', methods=['GET'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'})

@app.route('/api/auth/user', methods=['GET'])
@login_required
def get_user():
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email
    })

@app.route('/', methods=['GET'])
def serve_landing():
    if current_user.is_authenticated:
        return redirect('/dashboard')
    response = send_from_directory('templates', 'landing.html')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/auth/login', methods=['GET'])
def serve_login():
    if current_user.is_authenticated:
        return redirect('/dashboard')
    response = send_from_directory('templates', 'login.html')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/auth/register', methods=['GET'])
def serve_register():
    if current_user.is_authenticated:
        return redirect('/dashboard')
    response = send_from_directory('templates', 'register.html')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/dashboard', methods=['GET'])
@login_required
def serve_dashboard():
    response = send_from_directory('templates', 'dashboard.html')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5014)
