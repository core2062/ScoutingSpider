const csvUrl = 'CSV/Testing2024_NorthernLightsRegional_RawExport.CSV';

fetch(csvUrl)
    .then(response => response.text())
    .then(csvData => {
        const data = parseCSV(csvData);
        const matchData = getMatchDataWithTeams(data);

        displayMatchData(matchData);
        setupMatchClickHandler(data);
    })
    .catch(error => console.error('Error fetching the CSV file:', error));

function parseCSV(csvData) {
    const lines = csvData.split('\n').map(line => line.split(','));
    const headers = lines[0];
    const rows = lines.slice(1).map(line => line.map(cell => cell.replace(/"/g, '').trim()));
    return { headers, rows };
}

function getMatchDataWithTeams(data) {
    const matchMap = {};

    data.rows.forEach(row => {
        const matchNumber = row[1];
        const teamNumber = row[0];

        if (!matchMap[matchNumber]) {
            matchMap[matchNumber] = [];
        }
        matchMap[matchNumber].push(teamNumber);
    });

    return Object.entries(matchMap).map(([matchNumber, teams]) => ({
        match: matchNumber,
        teams: teams.join(', ')
    }));
}

function displayMatchData(matchData) {
    const matchList = document.getElementById('matchList');
    matchList.innerHTML = '';

    matchData.sort((a, b) => parseInt(a.match) - parseInt(b.match)).forEach(item => {
        const li = document.createElement('li');
        li.textContent = `Match: ${item.match}, Teams: ${item.teams}`;
        li.dataset.match = item.match;
        matchList.appendChild(li);
    });
}

function setupMatchClickHandler(data) {
    const matchListItems = document.querySelectorAll('#matchList li');
    matchListItems.forEach(item => {
        item.addEventListener('click', function() {
            const matchNumber = this.dataset.match;
            displayMatchDetails(data, matchNumber);
        });
    });
}

function displayMatchDetails(data, matchNumber) {
    const table = document.getElementById('matchDataTable');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    const clearButton = document.getElementById('clearButton');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    data.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        thead.appendChild(th);
    });

    const filteredRows = data.rows.filter(row => row[1] === matchNumber);

    filteredRows.forEach(row => {
        if (!row.includes('undefined')) { // Skip rows containing 'undefined'
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        }
    });

    table.style.display = 'table';
    clearButton.style.display = 'block';
}

// When the clear button is clicked, reset the selected match and hide the table
document.getElementById('clearButton').addEventListener('click', () => {
    const table = document.getElementById('matchDataTable');
    const clearButton = document.getElementById('clearButton');

    table.style.display = 'none'; // Hide the table
    clearButton.style.display = 'none'; // Hide the clear button
});