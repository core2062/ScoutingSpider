// Import necessary libraries
const fs = require('fs');
const csvParser = require('csv-parser');

// Define Points as a global variable
const Points = {
    'Speaker Autos': 1,
    'Amp Teleop': 2,
    'Speaker Teleop': 1,
    'Match Comments': null,
};

// Function to calculate points (assuming this function is defined)
function pointCalc(row, points) {
    // Implementation of point calculation
}

// Function to build second table headers (assuming this function is defined)
function Build2ndTables(points) {
    // Implementation of building second table headers
}

// Function to build second row (assuming this function is defined)
function Build2ndRow(totalPointList) {
    // Implementation of building second row
}

// Function to handle script end (assuming this function is defined)
function ScriptorEnd(firstTableId, secondTableId, jsText) {
    // Implementation of handling script end
}

// Read data from CSV
const data = [];
fs.createReadStream('/CSV/Testing2024_NorthernLightsRegional_Summary.csv')
    .pipe(csvParser())
    .on('data', (row) => {
        data.push(row);
    })
    .on('end', () => {
        let x = 0;
        let JStext = "";
        let HtmlInject = "";

        while (x < data.length) {
            try {
                const TotalPointList = pointCalc(data[x], Points);

                HtmlInject += `
<table id="firstTable:${data[x]['Team Number']}" class="Ltable">
    <tbody>
        <tr>
            <td>Team number</td>
            <td>Points</td>
            <td>Position</td>
        </tr> 
        <tr>
            <td>${data[x]['Team Number']}</td>
            <td>${TotalPointList.reduce((a, b) => a + b, 0)}</td>
            <td id="position:${data[x]['Team Number']}"></td>
        </tr>
    </tbody>
</table>

<!-- The second table is hidden by default -->
<table id="secondTable:${data[x]['Team Number']}" style="display: none;">
    <thead>
        <tr>
            ${Build2ndTables(Points)}
        </tr>
    </thead>
    <tbody>
        <tr>
            ${Build2ndRow(TotalPointList)}
        </tr>
    </tbody>
</table>
`;

                JStext = ScriptorEnd(`firstTable:${data[x]["Team Number"]}`, `secondTable:${data[x]["Team Number"]}`, JStext);
                x += 1;
            } catch (error) {
                console.error(`Error processing row ${x}: ${error}`);
                x += 1;
            }
        }

        HtmlInject += `
<script>
${JStext}
</script>
</body>
`;
        // Display the HTML (this part depends on your environment)
        console.log(HtmlInject);
    });