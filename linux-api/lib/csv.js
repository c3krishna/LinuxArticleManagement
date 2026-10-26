function csvCell(value) {
    let cell = value instanceof Date ? value.toISOString() : String(value ?? '');
    // Stop spreadsheet apps from evaluating cells as formulas.
    if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
    return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function toCsv(header, rows) {
    return [header.join(',')].concat(rows.map((row) => header.map((key) => csvCell(row[key])).join(','))).join('\r\n');
}

module.exports = { csvCell, toCsv };
