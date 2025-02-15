document.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
    try {
        const response = await fetch("YearlyCSV/RawData.csv");
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
        }

        const csvText = await response.text();
        const csvData = parseCSV(csvText);

        const matchesDict = {};

        // Organize data by match number
        for (const row of csvData) {
            const matchNumber = row["Match Number"];
            if (!matchesDict[matchNumber]) {
                matchesDict[matchNumber] = [];
            }
            matchesDict[matchNumber].push(row);
        }

        // Sort match numbers
        const sortedMatches = Object.keys(matchesDict).sort((a, b) => parseInt(a) - parseInt(b));

        generateHTML(sortedMatches, matchesDict, Object.keys(csvData[0]));
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((header) =>
        header.trim().replace(/(^"|"$)/g, "")
    );
    return lines.slice(1).map((line) => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((value) =>
            value.trim().replace(/(^"|"$)/g, "")
        );
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || ""; // Ensure missing values don't break processing
            return obj;
        }, {});
    });
}

function generateHTML(sortedMatches, matchesDict, headers) {
    const mainTable = document.getElementById("main-table");

    let mainTableRows = "";
    sortedMatches.forEach((matchNumber) => {
        const matchTeams = matchesDict[matchNumber].map(row => row["Team Number"]).join(", ");
        mainTableRows += `
            <tr>
                <td>${matchNumber}</td>
                <td>${matchTeams}</td>
                <td><button onclick="showMatch('${matchNumber}')">Show</button></td>
            </tr>
        `;
    });

    mainTable.innerHTML += mainTableRows;

    window.showMatch = function (matchNumber) {
        const matchDetails = matchesDict[matchNumber];
        const detailsTable = document.getElementById("match-details-table");

        const headerRow = headers.map((header) => `<th>${header}</th>`).join("");
        const dataRows = matchDetails
            .map((row) => `<tr>${headers.map((header) => `<td>${row[header]}</td>`).join("")}</tr>`)
            .join("");

        detailsTable.innerHTML = `<tr>${headerRow}</tr>${dataRows}`;
        document.getElementById("2nd-table").style.display = "block";
        document.getElementById("2nd-table").scrollIntoView({ behavior: "smooth" });
    };
}

function clearTable() {
    document.getElementById("2nd-table").style.display = "none";
}