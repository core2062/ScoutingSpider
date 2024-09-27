 // Load navbar.html into the placeholder div
 fetch('/statsic/StaticHtml/navbar.html')
 .then(response => response.text())
 .then(data => document.getElementById('navbar-placeholder').innerHTML = data);