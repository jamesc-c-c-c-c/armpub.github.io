// Global variables
let allPapers = [];
let filteredPapers = [];

// DOM elements
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const resetButton = document.getElementById('reset-filters');
const papersGrid = document.getElementById('papers-grid');
const noResults = document.getElementById('no-results');
const paperCount = document.getElementById('paper-count');
const authorCount = document.getElementById('author-count');
const fieldCount = document.getElementById('field-count');
const abstractTextarea = document.getElementById('abstract');
const abstractCount = document.getElementById('abstract-count');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    loadPapers();
    initSearch();
    initAbstractCounter();
    showSection('home');
});

// Navigation functionality
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Show specific section
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// Load papers from JSON
async function loadPapers() {
    try {
        const response = await fetch('papers/papers.json');
        if (!response.ok) {
            throw new Error('Papers data not found');
        }
        
        const data = await response.json();
        allPapers = data.papers || [];
        filteredPapers = [...allPapers];
        
        renderPapers();
        updateStats();
    } catch (error) {
        console.error('Error loading papers:', error);
        showEmptyState();
    }
}

// Render papers to the grid
function renderPapers() {
    if (filteredPapers.length === 0) {
        papersGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    papersGrid.style.display = 'grid';
    noResults.style.display = 'none';
    
    papersGrid.innerHTML = filteredPapers.map(paper => createPaperCard(paper)).join('');
    
    // Add event listeners for expand buttons
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', toggleAbstract);
    });
}

// Create individual paper card HTML
function createPaperCard(paper) {
    const abstractWords = paper.abstract.split(' ');
    const previewText = abstractWords.slice(0, 50).join(' ');
    const hasMore = abstractWords.length > 50;
    
    const authorsText = Array.isArray(paper.authors) 
        ? paper.authors.join(', ') 
        : paper.authors;
    
    const formattedDate = formatDate(paper.date_modified);
    
    return `
        <div class="paper-card" data-id="${paper.id}">
            <div class="paper-header">
                <h3 class="paper-title">${escapeHtml(paper.title)}</h3>
                <div class="paper-authors">By: ${escapeHtml(authorsText)}</div>
                <div class="paper-date">Last modified: ${formattedDate}</div>
            </div>
            <div class="paper-content">
                <div class="paper-abstract">
                    <div class="abstract-preview">
                        ${escapeHtml(previewText)}${hasMore ? '...' : ''}
                    </div>
                    ${hasMore ? `
                        <div class="abstract-full">
                            ${escapeHtml(paper.abstract)}
                        </div>
                        <button class="expand-btn">Read full abstract</button>
                    ` : ''}
                </div>
                <div class="paper-actions">
                    <a href="${paper.pdf_url}" class="pdf-link" target="_blank">
                        <i class="fas fa-file-pdf"></i>
                        View PDF
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Toggle abstract expansion
function toggleAbstract(e) {
    const button = e.target;
    const card = button.closest('.paper-card');
    const preview = card.querySelector('.abstract-preview');
    const full = card.querySelector('.abstract-full');
    
    if (full.style.display === 'block') {
        full.style.display = 'none';
        preview.style.display = 'block';
        button.textContent = 'Read full abstract';
    } else {
        full.style.display = 'block';
        preview.style.display = 'none';
        button.textContent = 'Show less';
    }
}

// Initialize search and filter functionality
function initSearch() {
    searchInput.addEventListener('input', debounce(performSearch, 300));
    sortSelect.addEventListener('change', sortPapers);
    resetButton.addEventListener('click', resetFilters);
}

// Perform search
function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        filteredPapers = [...allPapers];
    } else {
        filteredPapers = allPapers.filter(paper => {
            const searchableText = [
                paper.title,
                Array.isArray(paper.authors) ? paper.authors.join(' ') : paper.authors,
                paper.abstract,
                ...(paper.keywords || [])
            ].join(' ').toLowerCase();
            
            return searchableText.includes(query);
        });
    }
    
    sortPapers();
    renderPapers();
}

// Sort papers
function sortPapers() {
    const sortBy = sortSelect.value;
    
    filteredPapers.sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
