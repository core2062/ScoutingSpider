var statBotics2062 = "https://www.statbotics.io/team/2062";
var statBoticsEvent = "https://www.statbotics.io/event/2024mndu2#qual-matches";
var blueAllianceEvent = "https://www.thebluealliance.com/event/2024mndu2";
var blueAllianceTeam = "https://www.thebluealliance.com/team/2062";

function UpdateEmbed() {
    // Get the state of both switches
    var switch1 = document.getElementById("switch1").checked;
    var switch2 = document.getElementById("switch2").checked;

    // Determine the URL to display based on the state of the switches
    var embedElement = document.getElementById("embed");

    if (switch1 && switch2) {
        embedElement.src = statBotics2062; // Both switches are ON
    } else if (switch1 && !switch2) {
        embedElement.src = blueAllianceTeam; // First switch ON, second OFF
    } else if (!switch1 && switch2) {
        embedElement.src = statBoticsEvent; // First switch OFF, second ON
    } else {
        embedElement.src = blueAllianceEvent; // Both switches are OFF
    }
}

// Call UpdateEmbed function initially to set the correct URL based on the default state
UpdateEmbed();