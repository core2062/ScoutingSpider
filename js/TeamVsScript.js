const JsonFilePath = 'YearlyCSV/Points.json';
let Points = {};
let compatibility = {
    "1114-254": 0.05,
    "1678-118": -0.03
};

fetch(JsonFilePath)
    .then(response => response.json())
    .then(data => {
        Points = data;
    })
    .catch(error => console.error('Error loading JSON:', error));

let teamsData = [];

async function fetchCSV() {
    const response = await fetch('YearlyCSV/Summary.csv');
    const data = await response.text();
    return data;
}

fetchCSV().then(csvData => {
    Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            teamsData = results.data;
        }
    });
});

async function analyzeDataAI() {
    for (let team of teamsData) {
        if (!team["Team Number"]) continue;
        let teamNum = team["Team Number"];
        let performance = (team["Wins"] || 0) - (team["Losses"] || 0);
        let trend = ((team["Recent Wins"] || 0) - (team["Recent Losses"] || 0)) * 0.05;
        Points[teamNum] = (Points[teamNum] || 0) + performance * 0.1 + trend;
    }
}

function calcPosition(teamData) {
    let total = 0;
    let details = [];

    for (let key in Points) {
        if (teamData[key] !== null && Points[key] !== null) {
            const value = Points[key] * (teamData[key] || 0);
            total += value;
            details.push({ role: key, contribution: value });
        }
    }
    return { total: total, details: details };
}

function applyCompatibility(teams) {
    let adjustment = 0;
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            const key = `${teams[i]}-${teams[j]}`;
            const reverseKey = `${teams[j]}-${teams[i]}`;
            if (compatibility[key]) adjustment += compatibility[key];
            if (compatibility[reverseKey]) adjustment += compatibility[reverseKey];
        }
    }
    return adjustment;
}

async function generateTeams() {
    await analyzeDataAI();
    
    let redTeams = [
        document.getElementById('redTeam1').value,
        document.getElementById('redTeam2').value,
        document.getElementById('redTeam3').value
    ];

    let blueTeams = [
        document.getElementById('blueTeam1').value,
        document.getElementById('blueTeam2').value,
        document.getElementById('blueTeam3').value
    ];

    let redTotal = 0;
    let blueTotal = 0;
    let redDetails = [];
    let blueDetails = [];

    redTeams.forEach(teamNum => {
        let teamData = teamsData.find(team => team["Team Number"] == teamNum);
        if (teamData) {
            const { total, details } = calcPosition(teamData);
            redTotal += total;
            redDetails.push({ team: teamNum, details });
        }
    });

    blueTeams.forEach(teamNum => {
        let teamData = teamsData.find(team => team["Team Number"] == teamNum);
        if (teamData) {
            const { total, details } = calcPosition(teamData);
            blueTotal += total;
            blueDetails.push({ team: teamNum, details });
        }
    });

    const redAdjustment = applyCompatibility(redTeams);
    const blueAdjustment = applyCompatibility(blueTeams);
    redTotal += redAdjustment;
    blueTotal += blueAdjustment;

    let winner = redTotal > blueTotal ? 'Red Team' : 'Blue Team';

    document.getElementById('results').innerHTML = '';
    document.getElementById('redTeamData').innerHTML = '';
    document.getElementById('blueTeamData').innerHTML = '';

    document.getElementById('results').innerHTML = `
        <p>Red Team Total: ${redTotal.toFixed(2)}</p>
        <p>Blue Team Total: ${blueTotal.toFixed(2)}</p>
        <h3>Winner: ${winner}</h3>
    `;

    displayTeamData('Red Team', redDetails, 'redTeamData');
    displayTeamData('Blue Team', blueDetails, 'blueTeamData');
}

function displayTeamData(teamName, teamDetails, containerId) {
    let container = document.getElementById(containerId);
    let teamHtml = `<h3>${teamName} Data</h3>`;

    teamDetails.forEach(team => {
        teamHtml += `<table><caption>Team ${team.team}</caption><thead><tr><th>Role</th><th>Contribution</th></tr></thead><tbody>`;
        team.details.forEach(detail => {
            teamHtml += `<tr><td>${detail.role}</td><td>${detail.contribution.toFixed(2)}</td></tr>`;
        });
        teamHtml += '</tbody></table><br>';
    });

    container.innerHTML += teamHtml;
}
