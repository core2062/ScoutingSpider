const url = 'https://cors-anywhere.herokuapp.com/https://www.thebluealliance.com/event/2024mndu2';  // CORS proxy for testing

async function fetchAndExtractTable() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        // Extract the table
        extractSpecificTable(doc, 0);  // Assuming table index 0 is correct
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function extractSpecificTable(doc, tableIndex) {
    const tables = doc.getElementsByTagName('table');
    if (tables.length === 0) {
        console.error('No tables found in the document.');
        document.getElementById('output').innerText = 'No table found at the provided URL.';
        return;
    }

    const table = tables[tableIndex];
    let tableData = [];

    if (table) {
        const rows = table.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            let cells = row.getElementsByTagName('td');
            let rowData = [];

            for (let j = 0; j < cells.length; j++) {
                rowData.push(cells[j].innerText);
            }

            tableData.push(rowData);
        }

        displayTableData(tableData);
    } else {
        console.error('Specified table index not found.');
        document.getElementById('output').innerText = 'Table at the specified index not found.';
    }
}

function displayTableData(tableData) {
    const outputDiv = document.getElementById('output');
    let html = '<table border="1">';

    tableData.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += `<td>${cell}</td>`;
        });
        html += '</tr>';
    });

    html += '</table>';
    outputDiv.innerHTML = html;
}

// Call the function to fetch and extract table data on page load
fetchAndExtractTable();
