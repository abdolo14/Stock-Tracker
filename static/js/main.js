console.log('JavaScript file loaded!');

let chart = null;

async function searchStock() {
    console.log('Search function called');
    const symbol = document.getElementById('stockSymbol').value.toUpperCase();
    console.log('Symbol:', symbol);
    if (!symbol) return;

    try {
        console.log('Fetching data for symbol:', symbol);
        const response = await fetch(`/api/stock/${symbol}`);
        console.log('Response:', response);
        const data = await response.json();
        console.log('Data:', data);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        console.log('Updating stock info');
        updateStockInfo(data);
        console.log('Fetching historical data');
        await fetchHistoricalData(symbol);
        console.log('Showing stock info card');
        document.getElementById('stockInfo').classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching stock data:', error);
        alert(error.message || 'Error fetching stock data. Please try again.');
    }
}

function updateStockInfo(data) {
    document.getElementById('stockInfo').classList.remove('hidden');
    document.getElementById('symbol').textContent = data.symbol;
    document.getElementById('price').textContent = `$${data.price}`;
    
    const changeElement = document.getElementById('change');
    const changeValue = data.change;
    const changeText = `${changeValue > 0 ? '+' : ''}${changeValue}%`;
    changeElement.textContent = changeText;
    changeElement.className = `text-xl font-bold ${changeValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    
    document.getElementById('volume').textContent = data.volume.toLocaleString();
    document.getElementById('addSymbol').value = data.symbol;


}

async function fetchHistoricalData(symbol) {
    try {
        const response = await fetch(`/api/historical/${symbol}`, {
            credentials: 'include'
        });
        const data = await response.json();
        updateChart(data);
    } catch (error) {
        console.error('Error fetching historical data:', error);
    }
}

function updateChart(data) {
    const dates = data.map(item => new Date(item.Date).toLocaleDateString());
    const prices = data.map(item => item.Close);
    const volumes = data.map(item => item.Volume);

    // Calculate moving averages
    const ma50 = calculateMA(prices, 50);
    const ma200 = calculateMA(prices, 200);

    if (chart) {
        chart.destroy();
    }

    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // Create gradient for price line
    const priceGradient = ctx.createLinearGradient(0, 0, 0, 400);
    priceGradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    priceGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Price',
                    data: prices,
                    borderColor: '#a855f7',
                    borderWidth: 2,
                    backgroundColor: priceGradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#a855f7',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    order: 1
                },
                {
                    label: '50-day MA',
                    data: ma50,
                    borderColor: '#06b6d4',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    order: 2
                },
                {
                    label: '200-day MA',
                    data: ma200,
                    borderColor: '#f472b6',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    order: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Historical Price Data (1 Year)',
                    color: '#fff',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    labels: {
                        color: '#ffffff',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'Price') {
                                return `Price: $${context.parsed.y.toFixed(2)}`;
                            }
                            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#ffffff',
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#ffffff',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            },
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'linear'
                }
            }
        }
    });
}

function calculateMA(prices, period) {
    const ma = [];
    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            ma.push(null);
            continue;
        }
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += prices[i - j];
        }
        ma.push(sum / period);
    }
    return ma;
}


// Load portfolio data on page load
async function loadPortfolio() {
    try {
        const response = await fetch('/api/portfolio', {
            credentials: 'include'
        });
        const data = await response.json();
        updatePortfolioTable(data);
    } catch (error) {
        console.error('Error loading portfolio:', error);
    }
}

async function addToPortfolio(symbol, shares) {
    try {
        // First get current stock price
        const response = await fetch(`/api/stock/${symbol}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Add to portfolio
        const addResponse = await fetch('/api/portfolio', {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                symbol: symbol,
                shares: parseInt(shares),
                price: data.price
            })
        });
        
        if (!addResponse.ok) {
            throw new Error('Failed to add stock to portfolio');
        }
        
        // Refresh portfolio display
        await loadPortfolio();
        
        // Clear input fields
        document.getElementById('addSymbol').value = '';
        document.getElementById('addShares').value = '';
        
        alert('Stock added to portfolio successfully!');
    } catch (error) {
        console.error('Error adding to portfolio:', error);
        alert(error.message || 'Error adding stock to portfolio');
    }
}

async function removeFromPortfolio(symbol) {
    try {
        const response = await fetch(`/api/portfolio/${symbol}`, {
            credentials: 'include',
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to remove stock from portfolio');
        }
        
        await loadPortfolio();
        alert('Stock removed from portfolio successfully!');
    } catch (error) {
        console.error('Error removing from portfolio:', error);
        alert(error.message || 'Error removing stock from portfolio');
    }
}

function updatePortfolioTable(portfolio) {
    const tbody = document.getElementById('portfolioTable');
    tbody.innerHTML = '';
    
    portfolio.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border px-4 py-2">${item.symbol}</td>
            <td class="border px-4 py-2">${item.shares}</td>
            <td class="border px-4 py-2">$${item.price.toFixed(2)}</td>
            <td class="border px-4 py-2">$${(item.shares * item.price).toFixed(2)}</td>
            <td class="border px-4 py-2">
                <button onclick="removeFromPortfolio('${item.symbol}')"
                        class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                    Remove
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Add event listeners
// Check if user is logged in
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/user', {
            credentials: 'include'
        });
        if (!response.ok) {
            window.location.href = '/';
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/';
        return null;
    }
}

// Update user info in the header
function updateUserInfo(user) {
    const userInfo = document.getElementById('userInfo');
    userInfo.textContent = `Welcome, ${user.username}!`;
}

// Handle logout
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            credentials: 'include'
        });
        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Initialize event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded');
    
    const user = await checkAuth();
    if (!user) return;
    
    // Update UI with user info
    updateUserInfo(user);
    
    // Load initial data
    await Promise.all([
        loadPortfolio()
    ]);
    
    // Search stock on Enter key press
    document.getElementById('stockSymbol').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchStock();
        }
    });

    // Search button click handler
    document.getElementById('searchButton').addEventListener('click', () => {
        searchStock();
    });
    
    // Add stock on Enter key press in shares field
    document.getElementById('addShares').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const symbol = document.getElementById('addSymbol').value.toUpperCase();
            const shares = document.getElementById('addShares').value;
            if (validatePortfolioInput(symbol, shares)) {
                addToPortfolio(symbol, shares);
            }
        }
    });
});

function validatePortfolioInput(symbol, shares) {
    if (!symbol || !shares) {
        alert('Please enter both symbol and number of shares');
        return false;
    }
    
    if (shares <= 0) {
        alert('Please enter a positive number of shares');
        return false;
    }
    return true;
}
