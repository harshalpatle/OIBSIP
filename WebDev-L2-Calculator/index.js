(function () {
  const expressionEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');

  // Calculator state
  let firstOperand = null;      // number stored before an operator was pressed
  let operator = null;          // pending operator: '+', '-', '*', '/'
  let currentInput = '0';       // what's currently being typed / shown
  let awaitingNextOperand = false; // true right after an operator or equals
  let expressionText = '';      // the running expression string shown above
  let isError = false;

  const OPERATOR_SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  function updateDisplay() {
    resultEl.textContent = currentInput;
    resultEl.classList.toggle('error', isError);
    expressionEl.textContent = expressionText;
  }

  function inputDigit(digit) {
    if (isError) {
      fullReset();
    }
    if (awaitingNextOperand) {
      currentInput = digit === '.' ? '0.' : digit;
      awaitingNextOperand = false;
    } else {
      if (digit === '.') {
        if (currentInput.includes('.')) return; // prevent multiple decimals
        currentInput = currentInput + '.';
      } else {
        currentInput = (currentInput === '0') ? digit : currentInput + digit;
      }
    }
    updateDisplay();
  }

  function compute(a, op, b) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/':
        if (b === 0) {
          return null; // signal division-by-zero
        }
        return a / b;
      default: return b;
    }
  }

  function formatNumber(num) {
    if (!isFinite(num)) return 'Error';
    let rounded = Math.round(num * 1e10) / 1e10;
    return rounded.toString();
  }

  function handleOperator(nextOperator) {
    if (isError) return;

    const inputValue = parseFloat(currentInput);

    if (operator && awaitingNextOperand) {
      // User changed their mind about the operator; just swap it
      operator = nextOperator;
      expressionText = expressionText.slice(0, -2) + OPERATOR_SYMBOLS[nextOperator] + ' ';
      updateDisplay();
      return;
    }

    if (firstOperand === null) {
      firstOperand = inputValue;
    } else if (operator) {
      const result = compute(firstOperand, operator, inputValue);
      if (result === null) {
        showDivisionError();
        return;
      }
      firstOperand = result;
      currentInput = formatNumber(result);
    }

    expressionText = formatNumber(firstOperand) + ' ' + OPERATOR_SYMBOLS[nextOperator] + ' ';
    operator = nextOperator;
    awaitingNextOperand = true;
    updateDisplay();
  }

  function handleEquals() {
    if (isError) return;
    if (operator === null || firstOperand === null) return;

    const inputValue = parseFloat(currentInput);
    const result = compute(firstOperand, operator, inputValue);

    if (result === null) {
      showDivisionError();
      return;
    }

    expressionText = formatNumber(firstOperand) + ' ' + OPERATOR_SYMBOLS[operator] + ' ' + formatNumber(inputValue) + ' =';
    currentInput = formatNumber(result);
    firstOperand = null;
    operator = null;
    awaitingNextOperand = true; // next digit starts fresh
    updateDisplay();
  }

  function showDivisionError() {
    isError = true;
    currentInput = 'Cannot divide by zero';
    expressionText = '';
    firstOperand = null;
    operator = null;
    awaitingNextOperand = true;
    updateDisplay();
  }

  function fullReset() {
    firstOperand = null;
    operator = null;
    currentInput = '0';
    awaitingNextOperand = false;
    expressionText = '';
    isError = false;
    updateDisplay();
  }

  function backspace() {
    if (isError) {
      fullReset();
      return;
    }
    if (awaitingNextOperand) return; // nothing sensible to delete mid-operator
    if (currentInput.length <= 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
      currentInput = '0';
    } else {
      currentInput = currentInput.slice(0, -1);
    }
    updateDisplay();
  }

  // Event delegation: one listener for the whole keypad, no inline onclick
  document.querySelector('.keys').addEventListener('click', function (e) {
    const btn = e.target.closest('button.key');
    if (!btn) return;

    if (btn.dataset.number !== undefined) {
      inputDigit(btn.dataset.number);
    } else if (btn.dataset.operator !== undefined) {
      handleOperator(btn.dataset.operator);
    } else if (btn.dataset.action === 'equals') {
      handleEquals();
    } else if (btn.dataset.action === 'clear') {
      fullReset();
    } else if (btn.dataset.action === 'backspace') {
      backspace();
    }
  });

  // Keyboard support, same code paths as button clicks
  document.addEventListener('keydown', function (e) {
    if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
    else if (e.key === '.') inputDigit('.');
    else if (['+', '-', '*', '/'].includes(e.key)) handleOperator(e.key);
    else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleEquals(); }
    else if (e.key === 'Backspace') backspace();
    else if (e.key === 'Escape') fullReset();
  });

  updateDisplay();
})();
