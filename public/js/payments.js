document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const NEPALI_MONTHS = [
        'Baisakh', 'Jestha', 'Ashad', 'Shrawan', 
        'Bhadra', 'Ashoj', 'Kartik', 'Mangsir', 
        'Poush', 'Magh', 'Falgun', 'Chaitra'
    ];

    // DOM Elements
    const elements = {
        paymentMonth: document.getElementById('paymentMonth'),
        paymentYear: document.getElementById('paymentYear'),
        paymentMethod: document.getElementById('paymentMethod'),
        paymentTenant: document.getElementById('paymentTenant'),
        baseRent: document.getElementById('baseRent'),
        additionalAmount: document.getElementById('additionalAmount'),
        deductionAmount: document.getElementById('deductionAmount'),
        totalAmount: document.getElementById('totalAmount'),
        savePaymentBtn: document.getElementById('savePaymentBtn'),
        filterTenant: document.getElementById('filterTenant'),
        filterMonth: document.getElementById('filterMonth'),
        filterYear: document.getElementById('filterYear'),
        paymentTableBody: document.getElementById('paymentTableBody'),
        chequeDetails: document.getElementById('chequeDetails'),
        bankTransferDetails: document.getElementById('bankTransferDetails'),
        clearFilters: document.getElementById('clearFilters')
    };

    elements.depositMethod = document.getElementById('depositMethod');
    elements.depositTenant = document.getElementById('depositTenant');
    elements.depositChequeDetails = document.getElementById('depositChequeDetails');
    elements.depositBankTransferDetails = document.getElementById('depositBankTransferDetails');
    elements.saveDepositBtn = document.getElementById('saveDepositBtn');

    // Initialize dropdowns
    function initializeDropdowns() {
        // Month dropdown
        NEPALI_MONTHS.forEach((month, index) => {
            const option = new Option(month, index + 1);
            elements.paymentMonth.add(option);
        });
    }

    function initializeInputs() {    
        const currentYear = new Date().getFullYear();
        document.getElementById('paymentYear').value = currentYear;
        document.getElementById('filterYear').value = '';
    }

    // Event handlers
    function setupEventListeners() {
        elements.depositMethod.addEventListener('change', handleDepositMethodChange);
        elements.saveDepositBtn.addEventListener('click', recordSecurityDeposit);
        elements.paymentMethod.addEventListener('change', handlePaymentMethodChange);
        elements.paymentTenant.addEventListener('change', handleTenantChange);
        elements.additionalAmount.addEventListener('input', calculateTotalAmount);
        elements.deductionAmount.addEventListener('input', calculateTotalAmount);
        elements.savePaymentBtn.addEventListener('click', recordPayment);
        elements.filterTenant.addEventListener('change', loadPayments);
        elements.filterMonth.addEventListener('change', loadPayments);
        elements.filterYear.addEventListener('change', loadPayments);
        elements.clearFilters.addEventListener('click', clearFilters);
        
        // View buttons (delegated event)
        elements.paymentTableBody.addEventListener('click', function(e) {
            const btn = e.target.closest('.view-btn, .delete-btn');
            if (!btn) return;
            
            const paymentId = btn.getAttribute('data-id');
            if (btn.classList.contains('view-btn')) {
                viewPaymentDetails(paymentId);
            } else if (btn.classList.contains('delete-btn') && confirm('Are you sure you want to delete this payment?')) {
                deletePayment(paymentId);
            }
        });
    }

    function handlePaymentMethodChange() {
        const method = this.value;
        elements.chequeDetails.style.display = method === 'Cheque' ? 'block' : 'none';
        elements.bankTransferDetails.style.display = method === 'Bank Transfer' ? 'block' : 'none';
    }

    function handleDepositMethodChange() {
        const method = this.value;
        elements.depositChequeDetails.style.display = method === 'Cheque' ? 'block' : 'none';
        elements.depositBankTransferDetails.style.display = method === 'Bank Transfer' ? 'block' : 'none';
    }

    async function recordSecurityDeposit() {
        const method = elements.depositMethod.value;
        const depositData = {
            tenantId: elements.depositTenant.value,
            amount: parseFloat(document.getElementById('depositAmount').value),
            paymentDate: document.getElementById('depositDate').value,
            paymentMethod: method,
            notes: document.getElementById('depositNotes').value,
            type: 'security_deposit'
        };

        if (method === 'Cheque') {
            depositData.chequeNumber = document.getElementById('depositChequeNumber').value;
            depositData.chequeBank = document.getElementById('depositChequeBank').value;
        } else if (method === 'Bank Transfer') {
            depositData.depositedBank = document.getElementById('depositTransferBank').value;
        }

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(depositData)
            });
            const data = await response.json();
            alert('Security deposit recorded successfully!');
            document.getElementById('securityDepositForm').reset();
            loadPayments();
        } catch (error) {
            console.error('Error:', error);
            alert('Error recording security deposit');
        }
    }


    async function handleTenantChange() {
        const tenantId = this.value;
        if (!tenantId) return;

        try {
            const response = await fetch(`/api/tenants/${tenantId}`);
            const tenant = await response.json();
            elements.baseRent.value = tenant.amount;
            calculateTotalAmount();
        } catch (error) {
            console.error('Error fetching tenant:', error);
        }
    }

    function calculateTotalAmount() {
        const baseRent = parseFloat(elements.baseRent.value) || 0;
        const additional = parseFloat(elements.additionalAmount.value) || 0;
        const deduction = parseFloat(elements.deductionAmount.value) || 0;
        elements.totalAmount.value = (baseRent + additional - deduction).toFixed(2);
    }

    async function loadPayments() {
        const params = new URLSearchParams();
        if (elements.filterTenant.value) params.append('tenantId', elements.filterTenant.value);
        if (elements.filterMonth.value) params.append('month', elements.filterMonth.value);
        if (elements.filterYear.value) params.append('year', elements.filterYear.value);

        try {
            const response = await fetch(`/api/payments?${params.toString()}`);
            const payments = await response.json();
            renderPaymentsTable(payments);
        } catch (error) {
            console.error('Error loading payments:', error);
        }
    }

function renderPaymentsTable(payments) {
    elements.paymentTableBody.innerHTML = payments.map(payment => {
        // More robust deposit detection:
        // 1. First check if type exists and indicates deposit
        // 2. Fall back to checking if it's a deposit by amount or missing month
        const isDeposit = (payment.type && 
                          (payment.type.toLowerCase() === 'security_deposit' || 
                           payment.type.toLowerCase().includes('deposit')))
                      || (!payment.month && !payment.year)  // No month/year specified
                      || (payment.totalAmount === payment.baseRent * 10); // Common deposit amount
        
        const monthYear = isDeposit ? 'Security Deposit' : 
                        `${NEPALI_MONTHS[payment.month - 1] || payment.month} ${payment.year}`;
        
        return `
            <tr>
                <td>${monthYear}</td>
                <td>${payment.tenantName}</td>
                <td>${payment.propertyName}</td>
                <td>${isDeposit ? 'N/A' : `NPR ${payment.baseRent}`}</td>
                <td>NPR ${payment.totalAmount}</td>
                <td>${payment.paymentDate}</td>
                <td>${payment.paymentMethod}</td>
                <td>
                    <button class="btn btn-sm btn-info view-btn" data-id="${payment.id}" title="View Details">
                        <i class="bi bi-eye-fill"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${payment.id}" title="Delete">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

    async function updateDepositTenantDropdown() {
        try {
            const response = await fetch('/api/tenants');
            const tenants = await response.json();
            elements.depositTenant.innerHTML = '<option value="">Select Tenant</option>';
            tenants.forEach(tenant => {
                elements.depositTenant.add(new Option(tenant.fullName, tenant.id));
            });
        } catch (error) {
            console.error('Error loading tenants:', error);
        }
    }

    async function recordPayment() {
        const method = elements.paymentMethod.value;
        const paymentData = {
            tenantId: elements.paymentTenant.value,
            month: elements.paymentMonth.value,
            year: elements.paymentYear.value,
            baseRent: parseFloat(elements.baseRent.value),
            additionalAmount: parseFloat(elements.additionalAmount.value) || 0,
            deductionAmount: parseFloat(elements.deductionAmount.value) || 0,
            paymentDate: document.getElementById('paymentDate').value,
            paymentMethod: method,
            additionalNotes: document.getElementById('additionalNotes').value,
        };

        if (method === 'Cheque') {
            paymentData.chequeNumber = document.getElementById('chequeNumber').value;
            paymentData.chequeBank = document.getElementById('chequeBank').value;
            paymentData.depositedBank = document.getElementById('depositedBank').value;
        } else if (method === 'Bank Transfer') {
            paymentData.depositedBank = document.getElementById('transferBank').value;
        }

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            const data = await response.json();
            alert('Payment recorded successfully!');
            document.getElementById('recordPaymentForm').reset();
            loadPayments();
        } catch (error) {
            console.error('Error:', error);
            alert('Error recording payment');
        }
    }

    async function deletePayment(paymentId) {
        try {
            const response = await fetch(`/api/payments/${paymentId}`, { method: 'DELETE' });
            if (response.ok) {
                alert('Payment deleted successfully!');
                loadPayments();
            } else {
                alert('Error deleting payment');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting payment');
        }
    }

    async function updatePaymentTenantDropdown() {
        try {
            const response = await fetch('/api/tenants');
            const tenants = await response.json();
            elements.paymentTenant.innerHTML = '<option value="">Select Tenant</option>';
            tenants.forEach(tenant => {
                elements.paymentTenant.add(new Option(tenant.fullName, tenant.id));
            });
        } catch (error) {
            console.error('Error loading tenants:', error);
        }
    }

    async function viewPaymentDetails(paymentId) {
        try {
            const response = await fetch(`/api/payments/${paymentId}`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const payment = await response.json();
            updatePaymentModal(payment);
            
            const modal = new bootstrap.Modal(document.getElementById('viewPaymentModal'));
            modal.show();
        } catch (error) {
            console.error('Error loading payment details:', error);
            alert('Error loading payment details. Please check console for more information.');
        }
    }

function updatePaymentModal(payment) {
    // Format dates
    const paymentDate = new Date(payment.paymentDate);
    
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const formattedPaymentDate = paymentDate
        .toLocaleDateString('en-GB', options)
        // .toUpperCase(); // e.g., "01 AUG 2025"

    // Check if this is a security deposit
    const isDeposit = (payment.type && 
                      (payment.type.toLowerCase() === 'security_deposit' || 
                       payment.type.toLowerCase().includes('deposit')))
                  || (!payment.month && !payment.year);

    // Set month/year display
    const monthYear = isDeposit ? 'Security Deposit' : 
                     `${NEPALI_MONTHS[payment.month - 1] || payment.month} ${payment.year}`;
    
    // Update modal fields
    document.getElementById('viewTenantName').textContent = payment.tenantName;
    document.getElementById('viewPropertyName').textContent = payment.propertyName;
    document.getElementById('viewMonthYear').textContent = monthYear;
    document.getElementById('viewBaseRent').textContent = isDeposit ? 'N/A' : `NPR ${payment.baseRent}`;
    document.getElementById('viewPaymentDate').textContent = formattedPaymentDate;
    document.getElementById('viewPaymentMethod').textContent = payment.paymentMethod;
    document.getElementById('viewTotalAmount').textContent = `NPR ${payment.totalAmount}`;
    
    // Additional amounts
    document.getElementById('viewAdditionalAmount').textContent = 
        payment.additionalAmount > 0 ? `NPR +${payment.additionalAmount}` : '-';
    document.getElementById('viewAdditionalNotes').textContent = 
        payment.additionalNotes || '-';
    
    // Deduction amounts
    document.getElementById('viewDeductionAmount').textContent = 
        payment.deductionAmount > 0 ? `NPR -${payment.deductionAmount}` : '-';
    
    // Payment method details
    const chequeDetails = document.getElementById('viewChequeDetails');
    const bankTransferDetails = document.getElementById('viewBankTransferDetails');
    
    chequeDetails.style.display = 'none';
    bankTransferDetails.style.display = 'none';
    
    if (payment.paymentMethod === 'Cheque') {
        chequeDetails.style.display = 'block';
        document.getElementById('viewChequeNumber').textContent = payment.chequeNumber || '-';
        document.getElementById('viewChequeBank').textContent = payment.chequeBank || '-';
        document.getElementById('viewDepositedBank').textContent = payment.depositedBank || '-';
    } else if (payment.paymentMethod === 'Bank Transfer') {
        bankTransferDetails.style.display = 'block';
        document.getElementById('viewTransferBank').textContent = payment.depositedBank || '-';
    }
}
    async function initializeFilters() {
        try {
            // Load tenants for filter dropdown
            const response = await fetch('/api/tenants');
            const tenants = await response.json();
            elements.filterTenant.innerHTML = '<option value="">All Tenants</option>';
            tenants.forEach(tenant => {
                elements.filterTenant.add(new Option(tenant.fullName, tenant.id));
            });

            // Initialize month dropdown
            NEPALI_MONTHS.forEach((month, index) => {
                elements.filterMonth.add(new Option(month, index + 1));
            });

        } catch (error) {
            console.error('Error initializing filters:', error);
        }
    }

    function clearFilters() {
        elements.filterTenant.value = '';
        elements.filterMonth.value = '';
        elements.filterYear.value = '';
        loadPayments();
    }

    // Initial setup
    initializeInputs();
    initializeDropdowns();
    setupEventListeners();
    updatePaymentTenantDropdown();
    updateDepositTenantDropdown();
    loadPayments();
    initializeFilters();
});