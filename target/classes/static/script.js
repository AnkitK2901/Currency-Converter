document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const fromCurrencySelect = document.getElementById('from-currency');
    const toCurrencySelect = document.getElementById('to-currency');
    const swapButton = document.getElementById('swap-button');
    const form = document.getElementById('converter-form');
    const resultContainer = document.getElementById('result-container');
    const resultText = document.getElementById('result-text');
    const rateText = document.getElementById('rate-text');
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');
    const convertButton = document.getElementById('convert-button');
    const amountSymbol = document.getElementById('amount-symbol');

    // --- Currency Symbols Map ---
    const currencySymbols = {
        AED: 'د.إ', AFN: '؋', ALL: 'L', AMD: '֏', ARS: '$', AUD: 'A$',
        BDT: '৳', BGN: 'лв', BHD: '.د.ب', BND: 'B$', BOB: 'Bs.', BRL: 'R$',
        BTN: 'Nu.', BWP: 'P', BYN: 'Br', BZD: 'BZ$', CAD: 'C$', CHF: 'Fr',
        CLP: '$', CNY: '¥', COP: '$', CRC: '₡', CUP: '₱', CZK: 'Kč',
        DKK: 'kr', DOP: 'RD$', DZD: 'د.ج', EGP: 'E£', ERN: 'Nfk', ETB: 'Br',
        EUR: '€', FJD: 'FJ$', GBP: '£', GEL: '₾', GGP: '£', GHS: 'GH₵',
        GIP: '£', GTQ: 'Q', GYD: '$', HKD: 'HK$', HNL: 'L', HRK: 'kn',
        HUF: 'Ft', IDR: 'Rp', ILS: '₪', IMP: '£', INR: '₹', IQD: 'ع.د',
        IRR: '﷼', ISK: 'kr', JEP: '£', JMD: 'J$', JOD: 'JD', JPY: '¥',
        KES: 'KSh', KGS: 'лв', KHR: '៛', KPW: '₩', KRW: '₩', KWD: 'KD',
        KZT: '₸', LAK: '₭', LBP: 'ل.ل', LKR: 'රු', LRD: 'L$', LYD: 'LD',
        MAD: 'DH', MDL: 'L', MGA: 'Ar', MKD: 'ден', MNT: '₮', MUR: '₨',
        MVR: '.ރ', MWK: 'MK', MXN: 'Mex$', MYR: 'RM', MZN: 'MT', NAD: 'N$',
        NGN: '₦', NIO: 'C$', NOK: 'kr', NPR: '₨', NZD: 'NZ$', OMR: 'r.o.',
        PAB: 'B/.', PEN: 'S/', PGK: 'K', PHP: '₱', PKR: '₨', PLN: 'zł',
        PYG: '₲', QAR: 'QR', RON: 'L', RSD: 'дин', RUB: '₽', RWF: 'FRw',
        SAR: 'SR', SBD: 'Si$', SCR: 'SR', SDG: 'ج.س', SEK: 'kr', SGD: 'S$',
        SHP: '£', SLL: 'Le', SOS: 'Sh.So.', SRD: '$', SSP: '£', SYP: 'S£',
        THB: '฿', TJS: 'SM', TMT: 'T', TND: 'DT', TOP: 'T$', TRY: '₺',
        TWD: 'NT$', TZS: 'TSh', UAH: '₴', UGX: 'USh', USD: '$', UYU: '$U',
        UZS: 'лв', VES: 'Bs.', VND: '₫', YER: '﷼', ZAR: 'R', ZMW: 'ZK'
    };

    // --- Choices.js Initialization ---
    let fromCurrencyChoices, toCurrencyChoices;

    function initChoices(selectElement, placeholder = 'Select currency') {
        return new Choices(selectElement, {
            searchEnabled: true,
            searchPlaceholderValue: 'Search currencies...',
            placeholderValue: placeholder,
            itemSelectText: '',
            shouldSort: true,
            searchResultLimit: 10,
            position: 'auto',
            //
            renderChoiceLabel: function (item) {
                return item.customProperties?.fullLabel || item.label;
            },
            callbackOnCreateTemplates: function (template) {
                return {
                    item: function (classNames, data) {
                        return template(`
                        <div class="${classNames.item} ${data.highlighted ? classNames.highlightedState : classNames.itemSelectable}"
                            data-item data-id="${data.id}" data-value="${data.value}" ${data.active ? 'aria-selected="true"' : ''}>
                            ${data.value}
                        </div>
                    `);
                    },
                    choice: function (classNames, data) {
                        return template(`
                        <div class="${classNames.item} ${classNames.itemChoice} ${data.disabled ? classNames.itemDisabled : classNames.itemSelectable}"
                            data-select-text="" data-choice data-id="${data.id}" data-value="${data.value}" ${data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable'}>
                            ${data.customProperties?.fullLabel || data.label}
                        </div>
                    `);
                    }
                };
            },
            //
            classNames: {
                containerOuter: 'choices',
                containerInner: 'choices__inner',
                input: 'choices__input',
                inputCloned: 'choices__input--cloned',
                list: 'choices__list',
                listItems: 'choices__list--multiple',
                listSingle: 'choices__list--single',
                listDropdown: 'choices__list--dropdown',
                item: 'choices__item',
                itemSelectable: 'choices__item--selectable',
                itemDisabled: 'choices__item--disabled',
                itemChoice: 'choices__item--choice',
                placeholder: 'choices__placeholder',
                group: 'choices__group',
                groupHeading: 'choices__heading',
                button: 'choices__button',
                activeState: 'is-active',
                focusState: 'is-focused',
                openState: 'is-open',
                disabledState: 'is-disabled',
                highlightedState: 'is-highlighted',
                selectedState: 'is-selected',
                flippedState: 'is-flipped',
                loadingState: 'is-loading',
                noResults: 'has-no-results',
                noChoices: 'has-no-choices'
            },
            fuseOptions: {
                threshold: 0.3,
                distance: 100,
                keys: ['value', 'label']
            }
        });
    }

    // --- Helper Functions ---
    function showError(message) {
        errorText.textContent = message;
        errorContainer.classList.remove('hidden');
        resultContainer.classList.add('hidden');
    }

    function hideError() {
        errorContainer.classList.add('hidden');
    }

    function updateAmountSymbol() {
        const fromCurrency = fromCurrencyChoices.getValue(true);
        amountSymbol.textContent = currencySymbols[fromCurrency] || fromCurrency;
    }

    function formatCurrency(amount, currencyCode) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        try {
            return formatter.format(amount);
        } catch (e) {
            return `${amount.toFixed(2)} ${currencyCode}`;
        }
    }

    // --- Main Functions ---
    async function populateCurrencies() {
        try {
            const response = await fetch('https://openexchangerates.org/api/currencies.json?app_id=3620f92c5c89408d955659bc11aa6bdf');
            if (!response.ok) throw new Error('Failed to load currency list.');

            const currencies = await response.json();

            fromCurrencyChoices = initChoices(fromCurrencySelect, 'From currency');
            toCurrencyChoices = initChoices(toCurrencySelect, 'To currency');

            const currencyOptions = Object.entries(currencies).map(([code, name]) => ({
                value: code,
                label: code + name, // What appears after selection (just code)
                customProperties: {
                    fullLabel: `${code} - ${name}` // What appears in the dropdown
                }
            }));

            fromCurrencyChoices.setChoices(currencyOptions, 'value', 'label', true);
            toCurrencyChoices.setChoices(currencyOptions, 'value', 'label', true);

            fromCurrencyChoices.setChoiceByValue('USD');
            toCurrencyChoices.setChoiceByValue('INR');
            updateAmountSymbol();
        } catch (error) {
            showError("Could not load currency list. Please refresh.");
            console.error('Currency load error:', error);
        }
    }

    async function convertCurrency(amount, fromCurrency, toCurrency) {
        convertButton.textContent = 'Converting...';
        convertButton.disabled = true;
        resultContainer.classList.add('hidden');
        hideError();

        // This URL calls YOUR Java backend server
        const backendApiUrl = `/api/convert?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`;

        try {
            // Fetch data from your Java backend
            const response = await fetch(backendApiUrl);
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Conversion failed.');
            }

            // Use the real data returned from the Java server
            const convertedAmount = new Decimal(data.convertedAmount);
            const rate = new Decimal(data.rate);

            resultText.innerHTML = `
            <span class="from-amount">${formatCurrency(amount, fromCurrency)}</span>
            <span class="equals">=</span>
            <span class="to-amount">${formatCurrency(convertedAmount, toCurrency)}</span>
        `;

            rateText.textContent = `1 ${fromCurrency} = ${rate.toDecimalPlaces(6)} ${toCurrency}`;
            resultContainer.classList.remove('hidden');

        } catch (err) {
            showError(err.message || 'Conversion failed. Please try again.');
            console.error('Conversion error:', err);
        } finally {
            convertButton.textContent = 'Convert';
            convertButton.disabled = false;
        }
    }

    // --- Event Listeners ---
    fromCurrencySelect.addEventListener('change', updateAmountSymbol);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const amountStr = document.getElementById('amount').value;
        const fromCurrency = fromCurrencyChoices.getValue(true);
        const toCurrency = toCurrencyChoices.getValue(true);

        if (!amountStr || isNaN(amountStr)) {
            showError("Please enter a valid amount");
            return;
        }

        const amount = new Decimal(amountStr);
        if (amount.isNegative() || amount.isZero()) {
            showError("Amount must be greater than zero.");
            return;
        }
        if (fromCurrency === toCurrency) {
            showError("'From' and 'To' currencies cannot be the same.");
            return;
        }

        await convertCurrency(amount, fromCurrency, toCurrency);
    });

    swapButton.addEventListener('click', () => {
        const fromValue = fromCurrencyChoices.getValue(true);
        const toValue = toCurrencyChoices.getValue(true);

        if (fromValue && toValue) {
            fromCurrencyChoices.setChoiceByValue(toValue);
            toCurrencyChoices.setChoiceByValue(fromValue);
            updateAmountSymbol();

            const amount = document.getElementById('amount').value;
            if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Initialize the app
    populateCurrencies();

    // Keyboard shortcut (Alt+S for swap)
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 's') {
            swapButton.click();
        }
    });
});