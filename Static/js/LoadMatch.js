fetch("/inject_html")
    .then(response => response.text())
    .then(data => {
        document.getElementById('MatchGen-placeholder').innerHTML = data;
    })
    .catch(error => console.error('Error loading match data:', error));
