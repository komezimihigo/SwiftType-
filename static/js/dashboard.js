/**
* Dashboard Module
* Displays user statistics and results
*/

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
});

/**
* Load dashboard data from server
*/
async function loadDashboardData() {
    try {
        const response = await fetch('/stats/summary');
        const data = await response.json();

        if (data.success) {
            // Update statistics
            updateStatistics(data.stats);

            // Update weak keys
            updateWeakKeys(data.weak_keys);
        } else {
            console.error('Error loading stats:', data.error);
        }

        // Load recent results
        await loadRecentResults();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

/**
* Update statistics summary
*/
function updateStatistics(stats) {
    document.getElementById('totalTests').textContent = stats.total_tests || 0;
    document.getElementById('avgWpm').textContent = stats.avg_wpm || 0;
    document.getElementById('bestWpm').textContent = stats.best_wpm || 0;
    document.getElementById('avgAccuracy').textContent = (stats.avg_accuracy || 0) + '%';
}

/**
* Update weak keys display
*/
function updateWeakKeys(weakKeys) {
    const container = document.getElementById('weakKeysContainer');

    if (!weakKeys || weakKeys.length === 0) {
        container.innerHTML = '<p>No weak keys yet. Keep practicing!</p>';
        return;
    }

    let html = '';
    weakKeys.forEach(key => {
        const percentage = ((key.error_count / weakKeys[0].error_count) * 100).toFixed(0);
        html += `
            <div class="weak-key-item">
                <div class="weak-key-char">${escapeHtml(key.character)}</div>
                <div class="weak-key-count">${key.error_count} errors</div>
                <div style="font-size: 0.75rem; color: #999;">${percentage}% relative</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
* Load and display recent results
*/
async function loadRecentResults() {
    try {
        const response = await fetch('/stats/results');
        const data = await response.json();

        if (data.success) {
            updateResultsTable(data.results);
        }
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

/**
* Update results table
*/
function updateResultsTable(results) {
    const tbody = document.getElementById('resultsTableBody');

    if (!results || results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No results yet. Take a typing test!</td></tr>';
        return;
    }

    let html = '';
    results.forEach(result => {
        const date = new Date(result.test_date).toLocaleDateString();
        html += `
            <tr>
                <td>${date}</td>
                <td>${result.wpm}</td>
                <td>${result.raw_wpm}</td>
                <td>${result.accuracy}%</td>
                <td>${result.errors}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
* Escape HTML special characters
*/
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}




