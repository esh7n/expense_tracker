const balance = document.getElementById('balance');
const list = document.getElementById('list');
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

// Global variable to track which button was pressed
let currentTransactionType = null;

// Show quick add input for income
function showIncomeInput(e) {
    e.preventDefault();
    const incomeBtn = document.getElementById('income-btn');
    const expenseBtn = document.getElementById('expense-btn');
    const quickAdd = document.getElementById('quick-add');
    const quickAmount = document.getElementById('quick-amount');
    const quickText = document.getElementById('quick-text');

    // Check if income button is already pressed (toggle behavior)
    if (incomeBtn.classList.contains('pressed')) {
        // Reset everything
        incomeBtn.classList.remove('pressed');
        expenseBtn.classList.remove('pressed');
        quickAdd.style.display = 'none';
        quickAmount.value = '';
        quickText.value = '';
        currentTransactionType = null;
        return;
    }

    // Remove pressed class from expense button (mutually exclusive)
    expenseBtn.classList.remove('pressed');

    currentTransactionType = 'income';

    // Add pressed class to button
    incomeBtn.classList.add('pressed');

    quickAdd.style.display = 'block';
    // Clear any previous values
    quickAmount.value = '';
    quickText.value = '';
    quickAmount.focus();
}

// Show quick add input for expense
function showExpenseInput(e) {
    e.preventDefault();
    const expenseBtn = document.getElementById('expense-btn');
    const incomeBtn = document.getElementById('income-btn');
    const quickAdd = document.getElementById('quick-add');
    const quickAmount = document.getElementById('quick-amount');
    const quickText = document.getElementById('quick-text');

    // Check if expense button is already pressed (toggle behavior)
    if (expenseBtn.classList.contains('pressed')) {
        // Reset everything
        expenseBtn.classList.remove('pressed');
        incomeBtn.classList.remove('pressed');
        quickAdd.style.display = 'none';
        quickAmount.value = '';
        quickText.value = '';
        currentTransactionType = null;
        return;
    }

    // Remove pressed class from income button (mutually exclusive)
    incomeBtn.classList.remove('pressed');

    currentTransactionType = 'expense';

    // Add pressed class to button
    expenseBtn.classList.add('pressed');

    quickAdd.style.display = 'block';
    // Clear any previous values
    quickAmount.value = '';
    quickText.value = '';
    quickAmount.focus();
}

// Add transaction using quick input
function confirmAddTransaction(e) {
    e.preventDefault();

    const quickAmount = document.getElementById('quick-amount');
    const quickText = document.getElementById('quick-text');
    const amount = quickAmount.value.trim();
    const text = quickText.value.trim();

    if (amount === '' || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (text === '') {
        alert('Please enter a description');
        return;
    }

    const transaction = {
        id: generateID(),
        text: text,
        amount: currentTransactionType === 'income' ? +amount : -amount,
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);
    updateValues();
    updateLocalStorage();

    // Remove pressed class from buttons
    document.getElementById('income-btn').classList.remove('pressed');
    document.getElementById('expense-btn').classList.remove('pressed');

    // Hide input and reset
    document.getElementById('quick-add').style.display = 'none';
    quickAmount.value = '';
    quickText.value = '';
    currentTransactionType = null;
}

// Cancel adding transaction
function cancelAddTransaction(e) {
    e.preventDefault();

    // Remove pressed class from buttons
    document.getElementById('income-btn').classList.remove('pressed');
    document.getElementById('expense-btn').classList.remove('pressed');

    document.getElementById('quick-add').style.display = 'none';
    document.getElementById('quick-amount').value = '';
    document.getElementById('quick-text').value = '';
    currentTransactionType = null;
}

// Add transaction (legacy function for form submission)
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

    // Display only the last 6 transactions
    const recentTransactions = transactions.slice(-6);
    recentTransactions.forEach(addTransactionDOM);
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

        // Add event listeners for income and expense buttons
        const incomeBtn = document.getElementById('income-btn');
        const expenseBtn = document.getElementById('expense-btn');
        const confirmBtn = document.getElementById('confirm-add');
        const cancelBtn = document.getElementById('cancel-add');

        if (incomeBtn) incomeBtn.addEventListener('click', showIncomeInput);
        if (expenseBtn) expenseBtn.addEventListener('click', showExpenseInput);
        if (confirmBtn) confirmBtn.addEventListener('click', confirmAddTransaction);
        if (cancelBtn) cancelBtn.addEventListener('click', cancelAddTransaction);

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
