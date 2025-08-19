const ExcelJS = require('exceljs');
const path = require('path');
const tenantModel = require('./tenantModel');  // Add this import
const propertyModel = require('./propertyModel');  // Add this import

const dbPath = path.join(__dirname, '../../database/payments.xlsx');

async function initPaymentsDB() {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(dbPath);
    } catch (error) {
        const worksheet = workbook.addWorksheet('Payments');
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Tenant ID', key: 'tenantId', width: 10 },
            { header: 'Tenant Name', key: 'tenantName', width: 25 },
            { header: 'Property ID', key: 'propertyId', width: 10 },
            { header: 'Property Name', key: 'propertyName', width: 25 },
            { header: 'Month', key: 'month', width: 15 },
            { header: 'Year', key: 'year', width: 15 },
            { header: 'Base Rent', key: 'baseRent', width: 15 },
            { header: 'Additional Amount', key: 'additionalAmount', width: 15 },
            { header: 'Deduction Amount', key: 'deductionAmount', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Payment Date', key: 'paymentDate', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Cheque Number', key: 'chequeNumber', width: 20 },
            { header: 'Cheque Bank', key: 'chequeBank', width: 20 },
            { header: 'Deposited Bank', key: 'depositedBank', width: 20 },
            { header: 'Additional Notes', key: 'additionalNotes', width: 50 },
            { header: 'Type', key: 'type', width: 20 }, // New column for payment type
            { header: 'Created At', key: 'createdAt', width: 20 }
        ];
        await workbook.xlsx.writeFile(dbPath);
    }
    return workbook;
}

async function recordPayment(paymentData) {
    const workbook = await initPaymentsDB();
    const worksheet = workbook.getWorksheet('Payments');
    
    try {
        let newPayment;
        
        if (paymentData.type === 'security_deposit') {
            const tenant = await tenantModel.getTenantById(paymentData.tenantId);
            newPayment = {
                id: Date.now().toString(),
                tenantId: paymentData.tenantId,
                tenantName: tenant.fullName,
                propertyId: tenant.propertyId,
                propertyName: '', // Will be filled below
                month: 0,
                year: 0,
                baseRent: paymentData.amount,
                additionalAmount: 0,
                deductionAmount: 0,
                totalAmount: paymentData.amount,
                paymentDate: paymentData.paymentDate,
                paymentMethod: paymentData.paymentMethod,
                chequeNumber: paymentData.chequeNumber || '',
                chequeBank: paymentData.chequeBank || '',
                depositedBank: paymentData.depositedBank || '',
                additionalNotes: paymentData.notes || '',
                type: 'security_deposit',
                createdAt: new Date().toISOString()
            };
            
            // Get property name if available
            try {
                const property = await propertyModel.getPropertyById(tenant.propertyId);
                newPayment.propertyName = property.name;
            } catch (error) {
                newPayment.propertyName = 'N/A';
            }
        } else {
            // Regular payment processing (keep existing code)
            const tenant = await tenantModel.getTenantById(paymentData.tenantId);
            const property = await propertyModel.getPropertyById(tenant.propertyId);
            
            const totalAmount = paymentData.baseRent + 
                              (paymentData.additionalAmount || 0) - 
                              (paymentData.deductionAmount || 0);

            newPayment = {
                id: Date.now().toString(),
                tenantId: paymentData.tenantId,
                tenantName: tenant.fullName,
                propertyId: tenant.propertyId,
                propertyName: property.name,
                month: paymentData.month,
                year: paymentData.year,
                baseRent: paymentData.baseRent,
                additionalAmount: paymentData.additionalAmount || 0,
                deductionAmount: paymentData.deductionAmount || 0,
                totalAmount: totalAmount,
                paymentDate: paymentData.paymentDate,
                paymentMethod: paymentData.paymentMethod,
                chequeNumber: paymentData.chequeNumber || '',
                chequeBank: paymentData.chequeBank || '',
                depositedBank: paymentData.depositedBank || '',
                additionalNotes: paymentData.additionalNotes || '',
                type: 'rent', // Default type for regular payments
                createdAt: new Date().toISOString()
            };
        }
        
        worksheet.addRow(Object.values(newPayment));
        await workbook.xlsx.writeFile(dbPath);
        return newPayment;
    } catch (error) {
        console.error('Error recording payment:', error);
        throw error;
    }
}

// ... (keep getAllPayments and deletePayment functions the same)
async function getAllPayments() {
    const workbook = await initPaymentsDB();
    const worksheet = workbook.getWorksheet('Payments');
    const payments = [];
    
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header
            payments.push({
                id: row.getCell(1).value,
                tenantId: row.getCell(2).value,
                tenantName: row.getCell(3).value,
                propertyName: row.getCell(5).value,
                month: row.getCell(6).value,
                year: row.getCell(7).value,
                baseRent: row.getCell(8).value,
                additionalAmount: row.getCell(9).value,
                deductionAmount: row.getCell(10).value,
                totalAmount: row.getCell(11).value,
                paymentDate: row.getCell(12).value,
                paymentMethod: row.getCell(13).value,
                chequeNumber: row.getCell(14).value,
                chequeBank: row.getCell(15).value,
                depositedBank: row.getCell(16).value,
                additionalNotes: row.getCell(17).value,
            });
        }
    });
    
    return payments;
}

async function deletePayment(id) {
    const workbook = await initPaymentsDB();
    const worksheet = workbook.getWorksheet('Payments');
    
    let rowToDelete = null;
    
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1 && row.getCell(1).value === id) {
            rowToDelete = row.number;
        }
    });
    
    if (!rowToDelete) {
        throw new Error('Payment not found');
    }
    
    worksheet.spliceRows(rowToDelete, 1);
    await workbook.xlsx.writeFile(dbPath);
    return { message: 'Payment deleted successfully' };
}


module.exports = {
    recordPayment,
    getAllPayments,
    deletePayment
};

