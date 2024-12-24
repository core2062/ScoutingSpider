from flask import Flask, render_template, request, jsonify, render_template_string
import subprocess
import os

app = Flask(__name__)

# File paths for data
file_paths = {
    "summary": "static/YearlyCSV/Summary2024.csv",
    "raw": "static/YearlyCSV/RawData2024.csv",
    "json": "static/YearlyCSV/Points.json",
    "style_links": "static/YearlyCSV/StyleAndLinks.json"
}

# Python scripts to run
script_paths = ["MatchGen.py", "TeamGen.py"]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/Leader.html')
def leader():
    return render_template('Leader.html')

@app.route('/OurMatches.html')
def our_matches():
    return render_template('OurMatches.html')

@app.route('/Team.html')
def teams():
    return render_template('GenTeams.html')

@app.route('/Matches.html')
def matches():
    return render_template('GenMatches.html')

@app.route('/Admin.html')
def admin():
    return render_template('Admin.html')

@app.route('/TeamVS.html')
def team_gen():
    return render_template('TeamVS.html')

@app.route('/navbar.html')
def navbar():
    file_path = 'static/InjectedHtml/navbar.html'
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            html_content = file.read()
        return render_template_string(html_content)
    except FileNotFoundError:
        return render_template("404.html"), 404
@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)