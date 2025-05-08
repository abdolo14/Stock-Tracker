# Stock Tracker Application

A modern web-based stock tracking application that helps users monitor their investments and track stock performance in real-time.

## Features

- **Real-time Stock Data**: Search and view current stock prices and performance
- **Portfolio Management**: Add and remove stocks from your personal portfolio
- **Interactive Charts**: Visualize stock performance with Chart.js
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Modern UI with Tailwind CSS

## Technologies Used

### Backend
- Python 3.12
- Flask 2.3.3
- MongoDB
- Yahoo Finance API

### Frontend
- HTML5
- Vanilla JavaScript
- Tailwind CSS
- Chart.js

## Setup Instructions

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stock-tracker
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up MongoDB:
- Install MongoDB if not already installed
- Create a database named 'stock_tracker'

5. Create a .env file with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/stock_tracker
SECRET_KEY=your_secret_key_here
```

6. Run the application:
```bash
python app.py
```

7. Visit `http://localhost:5014` in your browser

## API Endpoints

### Authentication
- POST `/auth/register` - Register new user
- POST `/auth/login` - User login
- GET `/auth/logout` - User logout

### Stocks
- GET `/api/stock/<symbol>` - Get real-time stock data
- GET `/api/historical/<symbol>` - Get historical data

### Portfolio
- GET `/api/portfolio` - Get user's portfolio
- POST `/api/portfolio` - Add stock to portfolio
- DELETE `/api/portfolio/<symbol>` - Remove stock from portfolio

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
- `/api/stock/<symbol>` - Get real-time stock data
- `/api/historical/<symbol>` - Get historical price data
- `/api/portfolio` - Manage portfolio (GET/POST)
- `process_stock.php` - Handle watchlist and alerts

## Note
Make sure to have all services (MongoDB, Flask server, PHP server) running before using the application.
