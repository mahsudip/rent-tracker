const ExcelJS = require('exceljs');
const path = require('path');
//const toNepaliDate  = require('../utils/dateConverter');

const dbPath = path.join(__dirname, '../../database/tenants.xlsx');

async function addTenant(tenantData) {
    console.log('Adding property:', tenantData);
    const workbook = await initTenantsDB();
    const worksheet = workbook.getWorksheet('Tenants');
    if (!worksheet) throw new Error("Worksheet 'Tenants' not found in Excel file!");

    // Calculate end dates
    const startDate = new Date(tenantData.startDateAD);
    startDate.setHours(0, 0, 0, 0); // Normalize time to midnight (UTC)

    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + tenantData.contractYears);
    endDate.setTime(endDate.getTime() - 86400000); // Subtract 1 day in milliseconds
    
    const newTenant = {
        id: Date.now().toString(),
        fullName: tenantData.fullName,
        company: tenantData.company,
        contact: tenantData.contact,
        citizenNumber: tenantData.citizenNumber,
        address: tenantData.address,
        propertyId: tenantData.propertyId,
        section: tenantData.section,
        contractYears: tenantData.contractYears,
        startDateAD: tenantData.startDateAD,
        startDateBS: tenantData.startDateAD,
        endDateAD: endDate.toISOString().split('T')[0],
        endDateBS: endDate.toISOString().split('T')[0],
        amount: tenantData.amount,
        amountType: tenantData.amountType,
        incrementPercent: tenantData.incrementPercent,
        incrementInterval: tenantData.incrementInterval,
        status: 'Active'
    };

    console.log("i am new data ",newTenant); //test

    worksheet.addRow([
        newTenant.id,
        newTenant.fullName,
        newTenant.company,
        newTenant.contact,
        newTenant.citizenNumber,
        newTenant.address,
        newTenant.propertyId,
        Array.isArray(newTenant.section) ? JSON.stringify(newTenant.section) : newTenant.section,
        newTenant.contractYears,
        newTenant.startDateAD,
        newTenant.startDateBS,
        newTenant.endDateAD,
        newTenant.endDateBS,
        newTenant.amount,
        newTenant.amountType,
        newTenant.incrementPercent,
        newTenant.incrementInterval,
        newTenant.status
    ]);
    
    await workbook.xlsx.writeFile(dbPath);
    return newTenant;
}

async function updateTenant(id, tenantData) {
    try {
        const workbook = await initTenantsDB();
        const worksheet = workbook.getWorksheet('Tenants');
        
        let tenantFound = false;
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && row.getCell(1).value === id) {
                // Update the tenant data
                row.getCell(2).value = tenantData.fullName;
                row.getCell(3).value = tenantData.company;
                row.getCell(4).value = tenantData.contact;
                row.getCell(5).value = tenantData.citizenNumber;
                row.getCell(6).value = tenantData.address;
                row.getCell(7).value = tenantData.propertyId;
                row.getCell(8).value = tenantData.section;
                row.getCell(9).value = tenantData.contractYears;
                row.getCell(10).value = tenantData.startDateAD;
                row.getCell(14).value = tenantData.amount;
                row.getCell(15).value = tenantData.amountType;
                row.getCell(16).value = tenantData.incrementPercent;
                row.getCell(17).value = tenantData.incrementInterval;
                row.getCell(18).value = tenantData.status;
                
                // Update end dates
                const startDate = new Date(tenantData.startDateAD);
                startDate.setHours(0, 0, 0, 0); // Normalize time to midnight (UTC)

                const endDate = new Date(startDate);
                endDate.setFullYear(endDate.getFullYear() + tenantData.contractYears);
                endDate.setTime(endDate.getTime() - 86400000); // Subtract 1 day in milliseconds
                
                row.getCell(12).value = endDate.toISOString().split('T')[0];

                console.log("i am updated data ",tenantData); //test

                tenantFound = true;
            }
        });
        
        if (!tenantFound) {
            throw new Error('Tenant not found');
        }
        
        await workbook.xlsx.writeFile(dbPath);
        return { id, ...tenantData };
    } catch (error) {
        console.error('Error in updateTenant:', error);
        throw error;
    }
}

async function deleteTenant(id) {
    try {
        const workbook = await initTenantsDB();
        const worksheet = workbook.getWorksheet('Tenants');
        
        let rowToDelete = null;
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && row.getCell(1).value === id) {
                rowToDelete = row.number;
            }
        });
        
        if (!rowToDelete) {
            throw new Error('Tenant not found');
        }
        
        worksheet.spliceRows(rowToDelete, 1);
        await workbook.xlsx.writeFile(dbPath);
        return { message: 'Tenant deleted successfully' };
    } catch (error) {
        console.error('Error in deleteTenant:', error);
        throw error;
    }
}

async function initTenantsDB() {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(dbPath);
    } catch (error) {
        const worksheet = workbook.addWorksheet('Tenants');
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Full Name', key: 'fullName', width: 30 },
            { header: 'Company', key: 'company', width: 30 },
            { header: 'Contact', key: 'contact', width: 15 },
            { header: 'Citizen Number', key: 'citizenNumber', width: 20 },
            { header: 'Address', key: 'address', width: 50 },
            { header: 'Property ID', key: 'propertyId', width: 10 },
            { header: 'Section', key: 'section', width: 20 },
            { header: 'Contract Years', key: 'contractYears', width: 15 },
            { header: 'Start Date AD', key: 'startDateAD', width: 15 },
            { header: 'Start Date BS', key: 'startDateBS', width: 15 },
            { header: 'End Date AD', key: 'endDateAD', width: 15 },
            { header: 'End Date BS', key: 'endDateBS', width: 15 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Amount Type', key: 'amountType', width: 15 }, // month/year
            { header: 'Increment Percent', key: 'incrementPercent', width: 15 },
            { header: 'Increment Interval', key: 'incrementInterval', width: 15 },
            { header: 'Status', key: 'status', width: 15 } // Active/Inactive
        ];
        await workbook.xlsx.writeFile(dbPath);
    }
    return workbook;
}

async function getAllTenants() {
    const workbook = await initTenantsDB();
    const worksheet = workbook.getWorksheet('Tenants');
    const properties = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header
            properties.push({
                id: row.getCell(1).value,
                fullName: row.getCell(2).value,
                company: row.getCell(3).value,
                contact: row.getCell(4).value,
                citizenNumber: row.getCell(5).value,
                address:row.getCell(6).value,
                propertyId: row.getCell(7).value,
                section: row.getCell(8).value || null,
                contractYears: row.getCell(9).value,
                startDateAD:row.getCell(10).value,
                startDateBS: row.getCell(11).value,
                endDateAD: row.getCell(12).value,
                endDateBS: row.getCell(13).value,
                amount:row.getCell(14).value,
                amountType: row.getCell(15).value,
                incrementPercent: row.getCell(16).value,
                incrementInterval: row.getCell(17).value,
                status: row.getCell(18).value,
            });
        }
    });
    return properties;
}

async function getTenantById(id) {
    const tenants = await getAllTenants();
    return tenants.find(t => t.id === id);
}


// Update the exports at the bottom of the file
module.exports = {
    addTenant,
    getAllTenants,
    getTenantById,
    updateTenant,
    deleteTenant
};
