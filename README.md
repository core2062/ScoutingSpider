# Welcome to the (Static/Github Build) Scouting Spider--This page is currently under reconstrustion and is ment to be resigned for the 2026 year

# [FRC Kight Krawler](https://www.team2052.com/frckrawler/)
This system runs on FRC knight Krawler. a scouting system developed by FRC team 2052 Krawler robotics. the CORE2062 Scouting Spider currently runs on 2 CVS files from them the raw data export and the summary two VERY IMPORTANT parts to this system.

# Files and Architecture
The github pages of this build has a modified flask file architecture; the main difference HTML files at main/root per GitHub index.html Instructions and the rest are put there just for neatness

here a list of all data/folder that do need to be updated every competition 

 - **RawData.csv and Summary.csv**	
	 - This file contains the raw data that is needed for the java script to run properly. The Files are meant to be overwritten every time new data is added. You will get theses file from the knight krawler app which is meant to be paired with this system.
	 - 
 - **StyleAndLinks.json**
	 - This file is meant to be a better or cleaning way of editing links without needing to go into the system. 
	 
 - **Points.json**
	 - This file controls the points and there value; this file is needed for the leader board and TeamVS file specifically as they rely on needing data . to properly change it. 
		 - 1: The file needs to be in a JSON format
		 - 2: The file needs to have the CVS values lists as in/found the RawCSV File 
		 - 3: for any point you want to show on the leader-board but for it not to have a value give it the **null** value. 
					  

# MISC Important Information 

## CSV File specifications
The system at a bare minim needs, a Team Name, Team Number, Match number, For systems to detect it has the right file. Without theses the system wont have a starting point for the team, and match analysts and leader boards wont run properly

