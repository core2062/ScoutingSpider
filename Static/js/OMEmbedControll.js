// File path to the JSON file
var jsonFilePath = "static/YearlyCSV/StyleAndLinks.json";

// Function to fetch JSON data and update links
function LoadLinks() {
    fetch(jsonFilePath)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            // Assigning the links from JSON data
            var statBotics2062 = data.OurEventLinkStatBoticsTeam;
            var statBoticsEvent = data.OurEventLinkStatBoticsEvent;
            var blueAllianceEvent = data.OurEventLinkBlueAllinaceEvent;
            var blueAllianceTeam = data.OurEventLinkBlueAllinaceTeam;

            // Updating the embed logic after links are loaded
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

            // Add event listeners for the switches to update the embed dynamically
            document.getElementById("switch1").addEventListener("change", UpdateEmbed);
            document.getElementById("switch2").addEventListener("change", UpdateEmbed);
        })
        .catch((error) => {
            console.error("Error fetching JSON:", error);
        });
}

// Load the links and initialize the application
LoadLinks();
