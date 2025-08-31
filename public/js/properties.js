document.addEventListener('DOMContentLoaded', function() {
    // Toggle sections field based on property type
    document.querySelectorAll('input[name="propertyType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('sectionsContainer').style.display = 
                this.value === 'partial' ? 'block' : 'none';
        });
    });
    
    // Load properties table
    loadProperties();
    
    // Save property
    document.getElementById('savePropertyBtn').addEventListener('click', saveProperty);
});

function loadProperties() {
    fetch('/api/properties')
        .then(response => response.json())
        .then(properties => {
            const tbody = document.getElementById('propertyTableBody');
            tbody.innerHTML = '';
            
            properties.forEach(property => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="card-title" data-title="Month of:">${property.name}</td>
                    <td class="property-address" data-title="Address:">${property.address}</td>
                    <td class="property-type" data-title="Type:">${property.type === 'whole' ? 'Whole Property' : 'Section-wise'}</td>
                    <td class="property-section" data-title="Section:">${property.sections.join(', ') || '-'}</td>
                    <td class="property-action-btns">
                        <button class="btn btn-sm edit-btn" data-id="${property.id}">
                            <i class="fa-solid fa-pen" style="color: #7f37d6ff; font-size:18px;"></i>
                        </button>
                        <button class="btn btn-sm delete-btn" data-id="${property.id}">
                            <i class="fa-solid fa-trash" style="color: #f55353ff; font-size:18px;"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Add event listeners to edit/delete buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const propertyId = this.getAttribute('data-id');
                    editProperty(propertyId);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const propertyId = this.getAttribute('data-id');
                    deleteProperty(propertyId);
                });
            });
        });
}

function saveProperty() {
    const name = document.getElementById('propertyName').value;
    const address = document.getElementById('propertyAddress').value;
    const type = document.querySelector('input[name="propertyType"]:checked').value;
    const sections = type === 'partial' ? 
        document.getElementById('propertySections').value.split(',').map(s => s.trim()) : [];
    
    const propertyData = {
        name,
        address,
        type,
        sections
    };
    
    fetch('/api/properties', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
    })
    .then(response => response.json())
    .then(data => {
        alert('Property saved successfully!');
       // Close modal using Bootstrap 5 API
        const modalEl = document.getElementById('addPropertyModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();

        // Reset form
        document.getElementById('addPropertyForm').reset();
        sectionsContainer.style.display = 'none';

        modal.hide();
        loadProperties();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving property');
    });
}

// Similar functions for editProperty and deleteProperty


    // Add this to your existing code

    // Edit property function
    function editProperty(propertyId) {
        fetch(`/api/properties/${propertyId}`)
            .then(response => response.json())
            .then(property => {
                // Fill the edit form with property data
                document.getElementById('editPropertyId').value = property.id;
                document.getElementById('editPropertyName').value = property.name;
                document.getElementById('editPropertyAddress').value = property.address;
                
                // Set the property type
                if (property.type === 'whole') {
                    document.getElementById('editWholeProperty').checked = true;
                    document.getElementById('editSectionsContainer').style.display = 'none';
                } else {
                    document.getElementById('editPartialProperty').checked = true;
                    document.getElementById('editSectionsContainer').style.display = 'block';
                    document.getElementById('editPropertySections').value = property.sections.join(', ');
                }
                
                // Show the modal
                const modal = new bootstrap.Modal(document.getElementById('editPropertyModal'));
                modal.show();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error loading property data');
            });
    }

    // Update property function
    function updateProperty() {
        const id = document.getElementById('editPropertyId').value;
        const name = document.getElementById('editPropertyName').value;
        const address = document.getElementById('editPropertyAddress').value;
        const type = document.querySelector('input[name="editPropertyType"]:checked').value;
        const sections = type === 'partial' ? 
            document.getElementById('editPropertySections').value.split(',').map(s => s.trim()) : [];
        
        const propertyData = {
            name,
            address,
            type,
            sections
        };
        
        fetch(`/api/properties/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(propertyData)
        })
        .then(response => response.json())
        .then(data => {
            alert('Property updated successfully!');
            // Close modal
            const modalEl = document.getElementById('editPropertyModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            
            // Refresh the table
            loadProperties();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating property');
        });
    }

    // Add event listeners for the edit modal
    document.addEventListener('DOMContentLoaded', function() {
        // ... existing code ...
        
        // Toggle sections field in edit modal
        document.querySelectorAll('input[name="editPropertyType"]').forEach(radio => {
            radio.addEventListener('change', function() {
                document.getElementById('editSectionsContainer').style.display = 
                    this.value === 'partial' ? 'block' : 'none';
            });
        });
        
        // Update property button
        document.getElementById('updatePropertyBtn').addEventListener('click', updateProperty);
    });

// Delete property function
function deleteProperty(propertyId) {
    if (confirm('Are you sure you want to delete this property?')) {
        fetch(`/api/properties/${propertyId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert('Property deleted successfully!');
            loadProperties(); // Refresh the table
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting property');
        });
    }
}