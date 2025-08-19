document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard statistics
    fetch('/api/properties/count')
        .then(response => response.json())
        .then(data => {
            document.getElementById('activeProperties').textContent = data.total;
        });
    
    fetch('/api/tenants/count')
        .then(response => response.json())
        .then(data => {
            document.getElementById('activeTenants').textContent = data.total;
        });
    
    fetch('/api/payments/monthly')
        .then(response => response.json())
        .then(data => {
            document.getElementById('monthlyRevenue').textContent = `NPR ${data.total}`;
        });

     //get recent 5
        fetch('/api/payments')
            .then(response => response.json())
            .then(payments => {
                // Sort and get recent 5
                const recentPayments = payments
                    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                    .slice(0, 5);
                    
                const tbody = document.getElementById('recentPayments');
                tbody.innerHTML = '';
                
                recentPayments.forEach(payment => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${payment.tenantName}</td>
                        <td>NPR ${payment.totalAmount}</td>
                        <td>${payment.paymentDate}</td>
                        <td><span class="badge bg-success">Paid</span></td>
                    `;
                    tbody.appendChild(row);
                });
            });
    

// Load upcoming renewals
    fetch('/api/tenants/renewals')
        .then(response => response.json())
        .then(renewals => {
            const tbody = document.getElementById('upcomingRenewals');
            tbody.innerHTML = '';

            if (!renewals || renewals.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">
                            No upcoming renewals found
                        </td>
                    </tr>`;
                return;
            }

            renewals.forEach(renewal => {
                const endDate = new Date(renewal.endDateAD);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize time
                
                // Calculate days until renewal
                const timeDiff = endDate - today;
                const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                
                // Format renewal date
                const renewalDate = endDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${renewal.fullName || 'N/A'}</td>
                    <td>${renewal.propertyName || 'N/A'}</td>
                    <td>${renewalDate}</td>
                    <td>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading renewals:', error);
            document.getElementById('upcomingRenewals').innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        Error loading renewal data
                    </td>
                </tr>`;
        });
});