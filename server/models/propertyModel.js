const ExcelJS = require('exceljs');
const path = require('path');
const dbPath = path.join(__dirname, '../../database/properties.xlsx');

// In your propertyModel.js, add error logging:
async function addProperty(propertyData) {
    console.log('Adding property:', propertyData);
    try {
        const workbook = await initPropertiesDB();
        const worksheet = workbook.getWorksheet('Properties');
        
        const newProperty = {
            id: Date.now().toString(),
            name: propertyData.name,
            address: propertyData.address,
            type: propertyData.type,
            sections: JSON.stringify(propertyData.sections || []),
            createdAt: new Date().toISOString()
        };
        
        worksheet.addRow([
            newProperty.id,
            newProperty.name,
            newProperty.address,
            newProperty.type,
            newProperty.sections,
            newProperty.createdAt
        ]);
        
        // Add explicit error handling for file writing
        await workbook.xlsx.writeFile(dbPath).catch(err => {
            console.error('File write error:', err);
            throw new Error('Failed to write to database file');
        });
        console.log('Property added successfully!');
        return newProperty;
    } catch (error) {
        console.error('Error in addProperty:', error);
        throw error; // Rethrow to be caught by the route
    }
}

async function updateProperty(id, propertyData) {
    try {
        const workbook = await initPropertiesDB();
        const worksheet = workbook.getWorksheet('Properties');
        
        let propertyFound = false;
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && row.getCell(1).value === id) {
                // Update the property data
                row.getCell(2).value = propertyData.name;
                row.getCell(3).value = propertyData.address;
                row.getCell(4).value = propertyData.type;
                row.getCell(5).value = JSON.stringify(propertyData.sections || []);
                propertyFound = true;
            }
        });
        
        if (!propertyFound) {
            throw new Error('Property not found');
        }
        
        await workbook.xlsx.writeFile(dbPath);
        return { id, ...propertyData };
    } catch (error) {
        console.error('Error in updateProperty:', error);
        throw error;
    }
}

async function deleteProperty(id) {
    try {
        const workbook = await initPropertiesDB();
        const worksheet = workbook.getWorksheet('Properties');
        
        let rowToDelete = null;
        
        // Find the row to delete
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && row.getCell(1).value === id) {
                rowToDelete = row.number; // Store the row number
            }
        });
        
        if (!rowToDelete) {
            throw new Error('Property not found');
        }
        
        // Remove the row
        worksheet.spliceRows(rowToDelete, 1);
        
        // Save the changes
        await workbook.xlsx.writeFile(dbPath);
        return { message: 'Property deleted successfully' };
    } catch (error) {
        console.error('Error in deleteProperty:', error);
        throw error;
    }
}

const fs = require('fs');

async function initPropertiesDB() {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(dbPath);
    } catch (error) {
        // File doesn't exist, create it
        const worksheet = workbook.addWorksheet('Properties');
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Address', key: 'address', width: 50 },
            { header: 'Type', key: 'type', width: 20 }, // Whole/Partial
            { header: 'Sections', key: 'sections', width: 30 }, // JSON array if partial
            { header: 'CreatedAt', key: 'createdAt', width: 20 }
        ];
        await workbook.xlsx.writeFile(dbPath);
    }
    return workbook;
}

async function getAllProperties() {
    const workbook = await initPropertiesDB();
    const worksheet = workbook.getWorksheet('Properties');
    const properties = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header
            properties.push({
                id: row.getCell(1).value,
                name: row.getCell(2).value,
                address: row.getCell(3).value,
                type: row.getCell(4).value,
                sections: JSON.parse(row.getCell(5).value || '[]'),
                createdAt: row.getCell(6).value
            });
        }
    });
    return properties;
}

async function getPropertyById(id) {
    const properties = await getAllProperties();
    return properties.find(p => p.id === id);
}

// Other CRUD operations (addProperty, updateProperty, deleteProperty)

module.exports = {
    getAllProperties,
    getPropertyById,
    addProperty,
    updateProperty,  // Add this line
    deleteProperty
    // export other functions
};