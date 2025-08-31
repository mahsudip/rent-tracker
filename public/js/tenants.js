document.addEventListener('DOMContentLoaded', function() {
    // Load properties dropdown
    fetch('/api/properties')
        .then(response => response.json())
        .then(properties => {
            const select = document.getElementById('tenantProperty');
            select.innerHTML = '<option value="">Select Property</option>';
            
            properties.forEach(property => {
                const option = document.createElement('option');
                option.value = property.id;
                option.textContent = property.name;
                select.appendChild(option);
            });
        });
    
    // Show/hide sections based on property type
    document.getElementById('tenantProperty').addEventListener('change', function() {
        const propertyId = this.value;
        const sectionField = document.getElementById('sectionField');
        const sectionSelect = document.getElementById('tenantSection');
        
        if (!propertyId) {
            sectionField.style.display = 'none';
            return;
        }
        
        fetch(`/api/properties/${propertyId}`)
            .then(response => response.json())
            .then(property => {
                if (property.type === 'partial') {
                    sectionField.style.display = 'block';
                    sectionSelect.innerHTML = '';
                    
                    property.sections.forEach(section => {
                        const option = document.createElement('option');
                        option.value = section;
                        option.textContent = section;
                        sectionSelect.appendChild(option);
                    });
                } else {
                    sectionField.style.display = 'none';
                }
            });
    });
    
    // Load tenants table
    loadTenants();
    
    // Save tenant
    document.getElementById('saveTenantBtn').addEventListener('click', saveTenant);
});

/*
function loadTenants() {
    fetch('/api/tenants')
        .then(response => response.json())
        .then(tenants => {
            if (!tenants || !Array.isArray(tenants)) {
                console.error("API returned non-array:", tenants);
                return;
            }
            const tbody = document.getElementById('tenantTableBody');
            tbody.innerHTML = '';
            tenants.forEach(tenant => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tenant.fullName}</td>
                    <td>${tenant.contact}</td>
                    <td>${tenant.propertyName}</td>
                    <td>${tenant.section || '-'}</td>
                    <td>${tenant.contractYears} years</td>
                    <td>रु ${tenant.amount} (${tenant.amountType})</td>
                    <td>${tenant.status}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${tenant.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${tenant.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            // Add event listeners to edit/delete buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tenantId = this.getAttribute('data-id');
                    editTenant(tenantId);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tenantId = this.getAttribute('data-id');
                    deleteTenant(tenantId);
                });
            });
        }).catch(err => console.error("Error loading tenants:", err));
}
*/

function loadTenants() {
    fetch('/api/tenants')
        .then(response => response.json())
        .then(tenants => {
            if (!tenants || !Array.isArray(tenants)) {
                console.error("API returned non-array:", tenants);
                return;
            }
            
            // Also fetch properties to get property names
            return fetch('/api/properties')
                .then(response => response.json())
                .then(properties => {
                    const propertyMap = {};
                    properties.forEach(property => {
                        propertyMap[property.id] = property.name;
                    });
                    
                    return { tenants, propertyMap };
                });
        })
        .then(({ tenants, propertyMap }) => {
            const tbody = document.getElementById('tenantTableBody');
            tbody.innerHTML = '';
            
            tenants.forEach(tenant => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="card-title" data-title="Name:">${tenant.fullName}</td>
                    <td class="tenantCompany" data-title="Company:">${tenant.company || 'N/A'}</td>
                    <td class="mobile-hide" data-title="Mobile No.:">${tenant.contact}</td>
                    <td class="mobile-hide" data-title="Property:">${propertyMap[tenant.propertyId] || '-'}</td>
                    <td class="mobile-hide" data-title="Contract:">${tenant.contractYears} years</td>
                    <td class="mobile-hide" data-title="Started At:">${tenant.startDateAD}</td>
                    <td class="mobile-hide" data-title="Amount:">रु ${tenant.amount}/ ${tenant.amountType}</td>
                    <td class="mobile-hide" data-title="Status:"><span class="badge ${tenant.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${tenant.status}</span></td>
                    <td class="action-btns">
                        <button class="btn btn-sm view-btn" data-id="${tenant.id}" title="View Details">
                            <i class="fa-solid fa-eye" style="color: #7f37d6ff; font-size:18px;"></i>
                        </button>
                        <button class="btn btn-sm edit-btn" data-id="${tenant.id}" title="Edit">
                            <i class="fa-solid fa-pen" style="color: #7f37d6ff; font-size:18px;"></i>
                        </button>
                        <button class="btn btn-sm delete-btn" data-id="${tenant.id}" title="Delete">
                            <i class="fa-solid fa-trash" style="color: #f55353ff; font-size:18px;"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Add event listeners
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tenantId = this.getAttribute('data-id');
                    viewTenant(tenantId);
                });
            });
            
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tenantId = this.getAttribute('data-id');
                    editTenant(tenantId);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tenantId = this.getAttribute('data-id');
                    deleteTenant(tenantId);
                });
            });
        })
        .catch(err => console.error("Error loading tenants:", err));
}

function saveTenant() {
    const tenantData = {
        fullName: document.getElementById('tenantFullName').value,
        company: document.getElementById('tenantCompany').value,
        contact: document.getElementById('tenantContact').value,
        citizenNumber: document.getElementById('tenantCitizen').value,
        address: document.getElementById('tenantAddress').value,
        propertyId: document.getElementById('tenantProperty').value,
        section: document.getElementById('tenantSection').value || null,
        startDateAD: document.getElementById('contractStartDate').value,
        contractYears: parseInt(document.getElementById('contractYears').value),
        amount: parseFloat(document.getElementById('rentAmount').value),
        amountType: document.querySelector('input[name="amountType"]:checked').value,
        incrementPercent: parseFloat(document.getElementById('incrementPercent').value),
        incrementInterval: parseInt(document.getElementById('incrementInterval').value)
    };
    
    fetch('/api/tenants', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tenantData)
    })
    .then(async res=>{
        const data=await res.json();
        if(!res.ok){
            console.error('Backend returned an error:', data); 
            throw new Error(data.error);
        }
        return data;
    })
    .then(data => {
        alert('Tenant saved successfully!');
        // Close modal using Bootstrap 5 API
        const modalEl = document.getElementById('addTenantModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);

        // Reset form
        document.getElementById('addTenantForm').reset();
        modal.hide();

        loadTenants();
        // Also update payment tenant dropdown
        //updatePaymentTenantDropdown();
    })
    .catch(error => {
        console.log('Error:', error);
        alert('Error saving tenant');
    });
}

// Add these functions to your tenants.js file

function viewTenant(tenantId) {
    fetch(`/api/tenants/${tenantId}`)
        .then(response => response.json())
        .then(tenant => {
            // Also fetch the property name
            return fetch(`/api/properties/${tenant.propertyId}`)
                .then(response => response.json())
                .then(property => {
                    return { tenant, property };
                });
        })
        .then(({ tenant, property }) => {
            // Format dates
            const startDate = new Date(tenant.startDateAD);
            const endDate = new Date(tenant.endDateAD);
            
            const options = { day: '2-digit', month: 'short', year: 'numeric' };
            const formattedStartDate = startDate
                .toLocaleDateString('en-GB', options)
                // .toUpperCase(); // e.g., "01 AUG 2025"
            const formattedEndDate = endDate
                .toLocaleDateString('en-GB', options)
                // .toUpperCase();
            
            // Populate the view modal
            document.getElementById('viewFullName').textContent = tenant.fullName;
            document.getElementById('viewCompany').textContent = tenant.company || '-';
            document.getElementById('viewContact').textContent = tenant.contact;
            document.getElementById('viewCitizen').textContent = tenant.citizenNumber;
            document.getElementById('viewAddress').textContent = tenant.address;
            document.getElementById('viewProperty').textContent = property.name;
            document.getElementById('viewSection').textContent = tenant.section || '-';
            document.getElementById('viewStartDate').textContent = formattedStartDate;
            document.getElementById('viewEndDate').textContent = formattedEndDate;
            document.getElementById('viewRentAmount').textContent = `रु ${tenant.amount}/ ${tenant.amountType === 'month' ? 'mo' : 'yr'}`;
            document.getElementById('viewIncrementPercent').textContent = `${tenant.incrementPercent}%`;
            document.getElementById('viewIncrementInterval').textContent = `${tenant.incrementInterval} years`;
            document.getElementById('viewStatus').textContent = tenant.status;
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('viewTenantModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading tenant details');
        });
}

function editTenant(tenantId) {
    fetch(`/api/tenants/${tenantId}`)
        .then(response => response.json())
        .then(tenant => {
            // Fill the edit form with tenant data
            document.getElementById('editTenantId').value = tenant.id;
            document.getElementById('editTenantFullName').value = tenant.fullName;
            document.getElementById('editTenantCompany').value = tenant.company;
            document.getElementById('editTenantContact').value = tenant.contact;
            document.getElementById('editTenantCitizen').value = tenant.citizenNumber;
            document.getElementById('editTenantAddress').value = tenant.address;
            document.getElementById('editContractStartDate').value = tenant.startDateAD;
            document.getElementById('editContractYears').value = tenant.contractYears;
            document.getElementById('editRentAmount').value = tenant.amount;
            document.getElementById('editIncrementPercent').value = tenant.incrementPercent;
            document.getElementById('editIncrementInterval').value = tenant.incrementInterval;
            
            // Set amount type
            if (tenant.amountType === 'month') {
                document.getElementById('editMonthly').checked = true;
            } else {
                document.getElementById('editYearly').checked = true;
            }
            
            // Set status
            if (tenant.status === 'Active') {
                document.getElementById('editActive').checked = true;
            } else {
                document.getElementById('editInactive').checked = true;
            }
            
            // Load properties dropdown
            fetch('/api/properties')
                .then(response => response.json())
                .then(properties => {
                    const select = document.getElementById('editTenantProperty');
                    select.innerHTML = '<option value="">Select Property</option>';
                    
                    properties.forEach(property => {
                        const option = document.createElement('option');
                        option.value = property.id;
                        option.textContent = property.name;
                        if (property.id === tenant.propertyId) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    });
                    
                    // Show/hide sections based on property type
                    if (tenant.section) {
                        document.getElementById('editSectionField').style.display = 'block';
                        fetch(`/api/properties/${tenant.propertyId}`)
                            .then(response => response.json())
                            .then(property => {
                                const sectionSelect = document.getElementById('editTenantSection');
                                sectionSelect.innerHTML = '';
                                
                                property.sections.forEach(section => {
                                    const option = document.createElement('option');
                                    option.value = section;
                                    option.textContent = section;
                                    if (section === tenant.section) {
                                        option.selected = true;
                                    }
                                    sectionSelect.appendChild(option);
                                });
                            });
                    } else {
                        document.getElementById('editSectionField').style.display = 'none';
                    }
                });
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('editTenantModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading tenant data');
        });
}

function updateTenant() {
    const tenantData = {
        fullName: document.getElementById('editTenantFullName').value,
        company: document.getElementById('editTenantCompany').value,
        contact: document.getElementById('editTenantContact').value,
        citizenNumber: document.getElementById('editTenantCitizen').value,
        address: document.getElementById('editTenantAddress').value,
        propertyId: document.getElementById('editTenantProperty').value,
        section: document.getElementById('editTenantSection').value || null,
        startDateAD: document.getElementById('editContractStartDate').value,
        contractYears: parseInt(document.getElementById('editContractYears').value),
        amount: parseFloat(document.getElementById('editRentAmount').value),
        amountType: document.querySelector('input[name="editAmountType"]:checked').value,
        incrementPercent: parseFloat(document.getElementById('editIncrementPercent').value),
        incrementInterval: parseInt(document.getElementById('editIncrementInterval').value),
        status: document.querySelector('input[name="editTenantStatus"]:checked').value
    };
    
    const tenantId = document.getElementById('editTenantId').value;
    
    fetch(`/api/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tenantData)
    })
    .then(response => response.json())
    .then(data => {
        alert('Tenant updated successfully!');
        // Close modal
        const modalEl = document.getElementById('editTenantModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
        
        // Refresh the table
        loadTenants();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating tenant');
    });
}

function deleteTenant(tenantId) {
    if (confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
        fetch(`/api/tenants/${tenantId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert('Tenant deleted successfully!');
            loadTenants();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting tenant');
        });
    }
}

// Update the DOMContentLoaded event listener to include the new functionality
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Add event listeners for edit/delete buttons in the loadTenants function
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tenantId = this.getAttribute('data-id');
            editTenant(tenantId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tenantId = this.getAttribute('data-id');
            deleteTenant(tenantId);
        });
    });
    
    // Add event listener for property change in edit modal
    document.getElementById('editTenantProperty').addEventListener('change', function() {
        const propertyId = this.value;
        const sectionField = document.getElementById('editSectionField');
        const sectionSelect = document.getElementById('editTenantSection');
        
        if (!propertyId) {
            sectionField.style.display = 'none';
            return;
        }
        
        fetch(`/api/properties/${propertyId}`)
            .then(response => response.json())
            .then(property => {
                if (property.type === 'partial') {
                    sectionField.style.display = 'block';
                    sectionSelect.innerHTML = '';
                    
                    property.sections.forEach(section => {
                        const option = document.createElement('option');
                        option.value = section;
                        option.textContent = section;
                        sectionSelect.appendChild(option);
                    });
                } else {
                    sectionField.style.display = 'none';
                    sectionSelect.innerHTML = '';
                }
            });
    });
    
    // Add event listener for update button
    document.getElementById('updateTenantBtn').addEventListener('click', updateTenant);
});


// Function to update payment tenant dropdown
function updatePaymentTenantDropdown() {
    fetch('/api/tenants')
        .then(response => response.json())
        .then(tenants => {
            const select = document.getElementById('paymentTenant');
            select.innerHTML = '<option value="">Select Tenant</option>';
            
            tenants.forEach(tenant => {
                const option = document.createElement('option');
                option.value = tenant.id;
                option.textContent = `${tenant.fullName} (${tenant.propertyName}${tenant.section ? ` - ${tenant.section}` : ''})`;
                select.appendChild(option);
            });
        });
}



