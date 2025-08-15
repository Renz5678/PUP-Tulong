// Create this as static/js/ratings.js

// Global variables
let allRatings = [];
let currentFilter = { stars: null, sort_by: 'newest' };

// Load ratings when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Ratings page loaded');
    loadRatings();
    setupEventListeners();
});

// Setup event listeners for filter buttons
function setupEventListeners() {
    // Star filter buttons
    document.querySelectorAll('.rating').forEach(button => {
        button.addEventListener('click', function() {
            const text = this.textContent;
            
            if (text.includes('Stars')) {
                // Extract star count
                const stars = parseInt(text.match(/(\d+) Star/)[1]);
                filterRatings(stars, currentFilter.sort_by);
            } else if (text.includes('Star ⭐')) {
                // Handle "1 Star" case
                filterRatings(1, currentFilter.sort_by);
            } else if (text.includes('Most recent')) {
                filterRatings(currentFilter.stars, 'newest');
            } else if (text.includes('Oldest')) {
                filterRatings(currentFilter.stars, 'oldest');
            } else if (text.includes('A-Z')) {
                filterRatings(currentFilter.stars, 'az');
            } else if (text.includes('Z-A')) {
                filterRatings(currentFilter.stars, 'za');
            }
            
            // Update active state
            document.querySelectorAll('.rating').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Load all ratings
async function loadRatings() {
    try {
        console.log('🔄 Loading ratings...');
        
        const response = await fetch('/dashboard/ratings', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load ratings: ${response.status}`);
        }
        
        const data = await response.json();
        allRatings = data.ratings || [];
        
        console.log(`✅ Loaded ${allRatings.length} ratings:`, allRatings);
        
        displayRatings(allRatings);
        
    } catch (error) {
        console.error('❌ Error loading ratings:', error);
        showError('Failed to load ratings. Please try again.');
    }
}

// Filter ratings
async function filterRatings(stars = null, sort_by = 'newest') {
    try {
        currentFilter = { stars, sort_by };
        
        const params = new URLSearchParams();
        if (stars) params.append('stars', stars);
        if (sort_by) params.append('sort_by', sort_by);
        
        const response = await fetch(`/dashboard/ratings/filter?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to filter ratings: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Filtered ratings (${stars || 'all'} stars, ${sort_by}):`, data);
        
        displayRatings(data.ratings || []);
        
    } catch (error) {
        console.error('❌ Error filtering ratings:', error);
        showError('Failed to filter ratings.');
    }
}

// Display ratings in the grid
function displayRatings(ratings) {
    const container = document.getElementById('ratings-container');
    
    if (!ratings || ratings.length === 0) {
        container.innerHTML = `
            <div class="no-ratings">
<h3 style="color: white; text-align: left;">No ratings found</h3>
<p style="color: white; text-align: left;">You haven't received any ratings yet.</p>
            </div>
        `;
        return;
    }
    
    const ratingsHTML = ratings.map(rating => createRatingCard(rating)).join('');
    container.innerHTML = ratingsHTML;
}

// Create individual rating card
function createRatingCard(rating) {
    const stars = '⭐'.repeat(rating.rating || 0);
    const date = new Date(rating.created_at || '').toLocaleDateString();
    const comment = rating.comment || 'No comment provided';
    const taskId = rating.task_id || 'Unknown';
    
    return `
        <div class="rating-card">
            <div class="rating-header">
                <div class="rating-stars">${stars}</div>
                <div class="rating-date">${date}</div>
            </div>
            <div class="rating-content">
                <h4>Task: ${taskId}</h4>
                <p class="rating-comment">${comment}</p>
            </div>
            <div class="rating-footer">
                <small>From: ${rating.email || 'Anonymous'}</small>
            </div>
        </div>
    `;
}

// Show error message
function showError(message) {
    const container = document.getElementById('ratings-container');
    container.innerHTML = `
        <div class="error-message">
            <h3>⚠️ Error</h3>
            <p>${message}</p>
            <button onclick="loadRatings()" class="retry-btn">Try Again</button>
        </div>
    `;
}

// Clear all filters
function clearFilters() {
    currentFilter = { stars: null, sort_by: 'newest' };
    displayRatings(allRatings);
    
    // Remove active states
    document.querySelectorAll('.rating').forEach(b => b.classList.remove('active'));
}

// Export functions for global access
window.loadRatings = loadRatings;
window.filterRatings = filterRatings;
window.clearFilters = clearFilters;