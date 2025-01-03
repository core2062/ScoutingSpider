# Welcome to the (Static Build) Scouting Spider 

> Heads Up Most Important information about The **FLASK BUILD**  of the website will be found on [Here](https://github.com/Magicflash67/ScoutingSpider/tree/FlaskServerBuild?tab=readme-ov-file#scoutingspider-flask-build)
>  *(if Link doesn't work https://github.com/Magicflash67/ScoutingSpider/tree/FlaskServerBuild?tab=readme-ov-file#scoutingspider-flask-build)*
> the Main branch this file goes over the static or git hub pages  version

# [FRC Kight Krawler](https://www.team2052.com/frckrawler/)
This system runs on FRC knight Krawler. a scouting system developed by FRC team 2052 Krawler robotics. the CORE2062Scouting Spider currently runs on 2 CVS files from them the raw data export and the summary two VERY IMPORTANT parts to this system.

# Files and Architecture
The github pages of this build has a modified flask file architecture; the main difference HTML files at main/root per GitHub index.html Instructions and the rest are put there just for neatness
## The Yearly CSV Folder
This Folder Hold CSV logic and other data, even though there labeled as 2024, there meant to be over written with that years data. 

here a list of all data/folder that do need to be updated every competition 

 - **RawData2024.csv and Summary.csv**	
	 - This file contains the raw data that is needed for the java script to run properly. The Files are meant to be overwritten every time new data is added. You will get theses file from the knight krawler app which is meant to be paired with this system.
	 - 
 - **StyleAndLinks.json**
	 - This file is meant to be a better or cleaning way of editing links without needing to go into the system. 
	 
 - **Points.json**
	 - This file controls the points and there value; this file is needed for the leader board and TeamVS file specifically as they rely on needing data . to properly change it. 
		 - 1: The file needs to be in a JSON format
		 - 2: The file needs to have the CVS values lists as in/found the RawCSV File 
		 - 3: for any point you want to show on the leader-board but for it not to have a value give it the **null** value. 

> Common uses for the null, or no point value is when you need to show a common string like end percentages, or comments. thing that wont or cant have a numerical value set to them like stings or chars 
					  

# MISC Important Information 

## CSV File specifications
The system at a bare minim needs, a Team Name, Team Number, Match number, and Alliance color  For systems to detect it has the right file. Without theses the system wont have a starting point for the team, and match analysts and leader boards wont run properly

## Backups and Archives
backups and archives, Using GitHub actions we have an archival system. were each new branch gets backed up and archived, then a link is manually put in for that previous year. 

## File system example
a very pointlessly complicated graph thats also hard to see on github dark mode
```mermaid
%% Graph Definition - Flipped Layout
graph RL
    %% Main Branch
    subgraph Main Branch
        classDef html fill:#f4b084,stroke:#c55a11,stroke-width:2px;  %% Orange theme
        A404[404.html]
        AIndex[index.html]
        AOur[OurMatches.html]
        AGen[GenMatches.html]
        AGean[geanteams.html]
        ALeader[Leader.html]
        ATeamsVs[TeamsVs.html]
        class A404,AIndex,AOur,AGen,AGean,ALeader,ATeamsVs html
    end

    %% YearlyCSV Directory
    subgraph YearlyCSV Directory
        classDef csv fill:#c6e0b4,stroke:#548235,stroke-width:2px;  %% Green theme
        YPoints[Points.json] --> ALeader
        YPoints --> ATeamsVs
        YStyle[StyleAndLinks.json] --> AIndex
        YStyle --> AOur
        YRaw[RawData2024.csv] --> AGen
        YRaw --> AGean
        YSummary[Summary.csv] --> ALeader
        YSummary --> ATeamsVs
        class YPoints,YStyle,YRaw,YSummary csv
    end

    %% JS Directory
    subgraph JS Directory
        classDef js fill:#bdd7ee,stroke:#2e75b6,stroke-width:2px;  %% Blue theme
        JScript[script.js] --> A404
        JScript --> AIndex
        JScript --> AOur
        JScript --> AGen
        JScript --> AGean
        JScript --> ALeader
        JScript --> ATeamsVs
        JLoad[loadMatch.js] --> AGen
        class JScript,JLoad js
    end

    %% InjectedHtml Directory
    subgraph InjectedHtml Directory
        classDef injected fill:#ffe699,stroke:#bf8f00,stroke-width:2px;  %% Yellow theme
        INavbar[navbar.html] --> JScript
        class INavbar injected
    end

    %% Static Files
    subgraph Static Files
        classDef static fill:#d9d9d9,stroke:#7f7f7f,stroke-width:2px;  %% Gray theme
        Images[(images)] --> A404
        Images --> AIndex
        Images --> AOur
        Images --> AGen
        Images --> AGean
        Images --> ALeader
        Images --> ATeamsVs

        CSS[(css)] --> A404
        CSS --> AIndex
        CSS --> AOur
        CSS --> AGen
        CSS --> AGean
        CSS --> ALeader
        CSS --> ATeamsVs
        class Images,CSS static
    end

