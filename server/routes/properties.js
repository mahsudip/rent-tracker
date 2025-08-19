const express = require('express');
const router = express.Router();
const propertyModel = require('../models/propertyModel');

// Get all properties
router.get('/', async (req, res) => {
    try {
        const properties = await propertyModel.getAllProperties();
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get properties count
router.get('/count', async (req, res) => {
    try {
        const properties = await propertyModel.getAllProperties();
        res.json({ total: properties.length });
    } catch (error) {
        console.error('Error in /count route:', error);
        res.status(500).json({ error: error.message });
    }
});
// Get property by ID
router.get('/:id', async (req, res) => {
    try {
        const property = await propertyModel.getPropertyById(req.params.id);
        if (property) {
            res.json(property);
        } else {
            res.status(404).json({ error: 'Property not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new property
router.post('/', async (req, res) => {
    try {
        const newProperty = await propertyModel.addProperty(req.body);
        res.status(201).json(newProperty);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update property
router.put('/:id', async (req, res) => {
    try {
        const updatedProperty = await propertyModel.updateProperty(req.params.id, req.body);
        res.json(updatedProperty);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete property
router.delete('/:id', async (req, res) => {
    try {
        await propertyModel.deleteProperty(req.params.id);
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



module.exports = router;