const filePaths = {
    summary: 'static/YearlyCSV/Summary2024.csv',
    raw: 'static/YearlyCSV/RawData2024.csv',
    json: 'static/YearlyCSV/Points.json',
    Stylelinks: 'static/YearlyCSV/StyleAndLinks.json'
};

const toggleVisibility = (textarea, filePath) => {
    if (textarea.style.display === 'none' || textarea.style.display === '') {
        fetchFile(filePath, textarea); // Load the file and show it
        textarea.style.display = 'block';
    } else {
        textarea.style.display = 'none'; // Hide the textarea
    }
};

const adjustTextareaHeight = (textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
};

async function fetchFile(filePath, textarea) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('File not found');
        const data = await response.text();
        textarea.value = data;
        adjustTextareaHeight(textarea);
    } catch (error) {
        alert(`Failed to load file: ${error.message}`);
    }
}

async function updateFile(fileType, content) {
    try {
        const response = await fetch('/update-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_type: fileType, content })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unknown error occurred');
        alert('File update started. Monitoring progress...');
        pollUpdateStatus(); // Start polling after initiating the update
    } catch (error) {
        alert(`Failed to update file: ${error.message}`);
        await forceWriteFile(fileType, content); // Attempt force write
    }
}

async function forceWriteFile(fileType, content) {
    try {
        const forceWriteUrl = `/force-write-file?file_type=${encodeURIComponent(fileType)}`;
        const response = await fetch(forceWriteUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });

        if (!response.ok) throw new Error('Force write failed');
        alert('Force write successful!');
    } catch (error) {
        alert(`Force write attempt failed: ${error.message}`);
    }
}

async function pollUpdateStatus() {
    const statusElement = document.getElementById("update-status");

    while (true) {
        const response = await fetch('/update-status');
        if (response.ok) {
            const status = await response.json();
            statusElement.textContent = `Status: ${status.status}, Message: ${status.message}`;

            if (status.status === "idle" || status.status === "completed" || status.status === "error") {
                break;
            }
        } else {
            statusElement.textContent = "Failed to fetch status.";
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every second
    }
}

// Login handler
document.getElementById('login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === "CORE Admin" && password === "CORE2062") {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('content-container').style.display = 'block';
    } else {
        alert('Invalid username or password. Please try again.');
    }
});

// Set up event listeners for toggle and update buttons
document.getElementById('show-summary').addEventListener('click', () => {
    toggleVisibility(document.getElementById('summary-textarea'), filePaths.summary);
});

document.getElementById('update-summary').addEventListener('click', () => {
    updateFile('summary', document.getElementById('summary-textarea').value);
});

// Other event listeners for raw, json, and style links follow similar patterns...
