const express = require('express');
const router = express.Router();
const tenantModel = require('../models/tenantModel');


// Get all tenants
router.get('/', async (req, res) => {
    try {
        const tenants = await tenantModel.getAllTenants();
        res.json(tenants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get tenants count
router.get('/count', async (req, res) => {
    try {
        const tenants = await tenantModel.getAllTenants();
        const activeTenants = tenants.filter(t => t.status === 'Active');
        res.json({ total: activeTenants.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get upcoming renewals
router.get('/renewals', async (req, res) => {
    try {
        const tenants = await tenantModel.getAllTenants();
        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const upcoming = tenants.filter(tenant => {
            const endDate = new Date(tenant.endDateAD);
            return endDate > now;
        });
        
        res.json(upcoming);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Get tenant by ID
router.get('/:id', async (req, res) => {
    try {
        const tenant = await tenantModel.getTenantById(req.params.id);
        if (tenant) {
            res.json(tenant);
        } else {
            res.status(404).json({ error: 'Tenant not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new tenant
router.post('/', async (req, res) => {
    try {
        const newTenant = await tenantModel.addTenant(req.body);
        res.status(201).json(newTenant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update tenant
router.put('/:id', async (req, res) => {
    try {
        const updatedTenant = await tenantModel.updateTenant(req.params.id, req.body);
        res.json(updatedTenant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete tenant
router.delete('/:id', async (req, res) => {
    try {
        await tenantModel.deleteTenant(req.params.id);
        res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Get all upcoming renewals with detailed time calculations
router.get('/renewals', async (req, res) => {
    try {
        const tenants = await tenantModel.getAllTenants();
        const properties = await propertyModel.getAllProperties();

        // Create property map
        const propertyMap = properties.reduce((map, property) => {
            map[property.id] = property;
            return map;
        }, {});

        const now = new Date();
        const upcomingRenewals = tenants
            .filter(tenant => tenant.endDateAD) // Only tenants with end dates
            .map(tenant => {
                const endDate = new Date(tenant.endDateAD);
                const timeDiff = endDate - now;
                
                // Calculate total days left
                const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                
                // Calculate years, months, days breakdown
                let years = 0, months = 0, days = 0;
                if (timeDiff > 0) {
                    years = endDate.getFullYear() - now.getFullYear();
                    months = endDate.getMonth() - now.getMonth();
                    days = endDate.getDate() - now.getDate();
                    
                    // Adjust for negative months/days
                    if (days < 0) {
                        months--;
                        days += new Date(
                            now.getFullYear(), 
                            now.getMonth() + 1, 
                            0
                        ).getDate();
                    }
                    if (months < 0) {
                        years--;
                        months += 12;
                    }
                }

                return {
                    ...tenant,
                    propertyName: propertyMap[tenant.propertyId]?.name || 'N/A',
                    endDateFormatted: endDate.toISOString().split('T')[0],
                    timeRemaining: {
                        years,
                        months,
                        days,
                        totalDays
                    }
                };
            })
            .filter(tenant => tenant.timeRemaining.totalDays > 0) // Only future dates
            .sort((a, b) => a.timeRemaining.totalDays - b.timeRemaining.totalDays); // Sort by soonest

        res.json(upcomingRenewals);
    } catch (error) {
        console.error('Error fetching renewals:', error);
        res.status(500).json({ error: 'Failed to fetch renewal data' });
    }
});

module.exports = router;