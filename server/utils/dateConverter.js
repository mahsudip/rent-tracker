// const NepaliDate = require('nepali-date');

// function toNepaliDate(englishDate) {
//     const date = new Date(englishDate);
//     const nepDate = new NepaliDate(date);
//     return nepDate.format('YYYY-MM-DD');
// }

// function toEnglishDate(nepaliDateStr) {
//     const parts = nepaliDateStr.split('-');
//     const nepaliDate = new NepaliDate(
//         parseInt(parts[0]),
//         parseInt(parts[1]) - 1,
//         parseInt(parts[2])
//     );
//     return nepaliDate.toJsDate().toISOString().split('T')[0];
// }

// module.exports = {
//     toNepaliDate,
//     toEnglishDate
// };