const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const chartCanvas = document.getElementById('myChart');
const currencySelector = document.getElementById('currency');
const convertAmountInput = document.getElementById('convert-amount');
const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const convertBtn = document.getElementById('convert-btn');
const conversionResult = document.getElementById('conversion-result');
let myChart;

// Get transactions from local storage
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
const localStorageCurrency = localStorage.getItem('currency');

let transactions = localStorageTransactions !== null ? localStorageTransactions : [];
let currentCurrency = localStorageCurrency !== null ? localStorageCurrency : 'USD';

// Add transaction
function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a text and amount');
    } else {
        const transaction = {
            id: generateID(),
            text: text.value,
            amount: +amount.value,
        };

        transactions.push(transaction);

        addTransactionDOM(transaction);
        updateValues();
        updateLocalStorage();

        text.value = '';
        amount.value = '';
    }
}

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
    // Get sign
    const sign = transaction.amount < 0 ? '-' : '+';
    const currencySymbol = getCurrencySymbol(currentCurrency);

    const item = document.createElement('li');

    // Add class based on value
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

    item.innerHTML = `
    ${transaction.text} <span>${sign}${currencySymbol}${Math.abs(transaction.amount)}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;

    list.appendChild(item);
}

// Update the balance, income and expense
function updateValues() {
    const amounts = transactions.map((transaction) => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

    const income = amounts
        .filter((item) => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);

    const expense = (
        amounts.filter((item) => item < 0).reduce((acc, item) => (acc += item), 0) * -1
    ).toFixed(2);

    const currencySymbol = getCurrencySymbol(currentCurrency);

    if (balance) balance.innerText = `${currencySymbol}${total}`;
    if (money_plus) money_plus.innerText = `${currencySymbol}${income}`;
    if (money_minus) money_minus.innerText = `${currencySymbol}${expense}`;

    if (chartCanvas) updateChart(income, expense);
}

// Remove transaction by ID
function removeTransaction(id) {
    transactions = transactions.filter((transaction) => transaction.id !== id);

    updateLocalStorage();

    initExpenseTracker();
}

// Update local storage transactions
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('currency', currentCurrency);
}

// Get currency symbol
function getCurrencySymbol(currencyCode) {
    switch (currencyCode) {
        case 'USD':
            return '$';
        case 'EUR':
            return '€';
        case 'GBP':
            return '£';
        case 'AUD':
            return 'A$';
        case 'SGD':
            return 'S$';
        case 'INR':
            return '₹';
        case 'BDT':
            return '৳';
        default:
            return '$';
    }
}

// Update chart
function updateChart(income, expense) {
    if (!chartCanvas) return; // Ensure chartCanvas exists before attempting to draw

    const ctx = chartCanvas.getContext('2d');

    if (myChart) {
        myChart.destroy(); // Destroy existing chart before creating a new one
    }

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [
                {
                    label: 'Amount',
                    data: [income, expense],
                    backgroundColor: ['rgba(46, 204, 113, 0.6)', 'rgba(192, 57, 43, 0.6)'],
                    borderColor: ['rgba(46, 204, 113, 1)', 'rgba(192, 57, 43, 1)'],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

// Init Expense Tracker app
function initExpenseTracker() {
    if (list) list.innerHTML = ''; // Ensure list element exists

    transactions.forEach(addTransactionDOM);
    updateValues();
    updateChart(0, 0);

    if (currencySelector) currencySelector.value = currentCurrency; // Set selected currency in dropdown
}

// Currency Converter Logic
const API_KEY = 'e785112d340e372e40070df3'; // Replaced with the provided API key

async function fetchExchangeRates(baseCurrency) {
    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.result === 'success') {
            return data.conversion_rates;
        } else {
            console.error('Error fetching exchange rates:', data['error-type']);
            return null;
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return null;
    }
}

async function convertCurrency() {
    const amountToConvert = parseFloat(convertAmountInput.value);
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    if (isNaN(amountToConvert) || amountToConvert <= 0) {
        alert('Please enter a valid amount for conversion.');
        if (conversionResult) conversionResult.innerText = '';
        return;
    }

    if (conversionResult) conversionResult.innerText = 'Converting...';

    const rates = await fetchExchangeRates(fromCurrency);
    if (rates && rates[toCurrency]) {
        const convertedAmount = amountToConvert * rates[toCurrency];
        const toCurrencySymbol = getCurrencySymbol(toCurrency);
        if (conversionResult) conversionResult.innerText = `${amountToConvert} ${fromCurrency} = ${toCurrencySymbol}${convertedAmount.toFixed(2)} ${toCurrency}`;
    } else {
        if (conversionResult) conversionResult.innerText = 'Conversion failed. Please try again or check your API key.';
    }
}

// Init Currency Converter app
function initCurrencyConverter() {
    if (convertBtn) convertBtn.addEventListener('click', convertCurrency);
    // Populate dropdowns if needed, or set default values
    if (fromCurrencySelect) fromCurrencySelect.value = 'USD';
    if (toCurrencySelect) toCurrencySelect.value = 'EUR';
}

// History Toggle Functionality
function initHistoryToggle() {
    const historyHeader = document.getElementById('history-header');
    const historyContent = document.getElementById('list');
    
    if (historyHeader && historyContent) {
        historyHeader.addEventListener('click', () => {
            historyContent.classList.toggle('collapsed');
            historyHeader.classList.toggle('collapsed');
        });
    }
}

// About Modal Functionality
function initAboutModal() {
    const aboutBtn = document.getElementById('about-btn');
    const modal = document.getElementById('about-modal');
    const closeBtn = document.getElementById('modal-close');
    
    if (aboutBtn && modal) {
        aboutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.classList.add('show');
        });
    } else {
        console.log('About button or modal not found:', { aboutBtn, modal });
    }
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.classList.remove('show');
        });
    }
    
    // Close modal when clicking outside of it
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }
}

// Initialize when DOM is ready
function initializeApp() {
    // Conditional Initialization based on page
    if (document.location.pathname.includes('currency_converter.html')) {
        initCurrencyConverter();
        initAboutModal();
    } else {
        // Assume index.html or other pages where expense tracker is present
        initExpenseTracker();
        initHistoryToggle();
        initAboutModal();
        if (form) form.addEventListener('submit', addTransaction);
        if (currencySelector) currencySelector.addEventListener('change', (e) => {
            currentCurrency = e.target.value;
            updateLocalStorage();
            updateValues();
        });
    }
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}
