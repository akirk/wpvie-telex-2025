/**
 * Reveal.js Slide Navigation Plugin
 *
 * Press 't' (TOC) to open navigation overlay with all slide headlines
 * Type to filter, use arrow keys to navigate, Enter to jump to slide, ESC to close
 */
const SlideNav = {
	id: 'slide-nav',

	init: function(deck) {
		let overlay = null;
		let slideList = [];
		let filteredList = [];
		let selectedIndex = 0;
		let searchInput = null;

		// Create overlay HTML
		function createOverlay() {
			overlay = document.createElement('div');
			overlay.id = 'slide-nav-overlay';
			overlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.9);
				z-index: 1000;
				display: none;
				overflow-y: auto;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			`;

			const container = document.createElement('div');
			container.style.cssText = `
				max-width: 800px;
				margin: 50px auto;
				padding: 20px;
				color: white;
			`;

			const title = document.createElement('h2');
			title.textContent = 'Slide Navigation';
			title.style.cssText = `
				margin-bottom: 10px;
				font-size: 24px;
				font-family: inherit;
			`;

			const instructions = document.createElement('p');
			instructions.textContent = 'Tippen zum Filtern, ↑↓ navigieren, Enter springen, ESC schließen';
			instructions.style.cssText = `
				margin-bottom: 20px;
				font-size: 14px;
				color: #ccc;
				font-family: inherit;
			`;

			searchInput = document.createElement('input');
			searchInput.type = 'text';
			searchInput.placeholder = 'Suche...';
			searchInput.style.cssText = `
				width: 100%;
				padding: 12px;
				font-size: 16px;
				border: 2px solid #4a90e2;
				border-radius: 4px;
				background: #222;
				color: white;
				margin-bottom: 20px;
				box-sizing: border-box;
				font-family: inherit;
			`;

			const list = document.createElement('ul');
			list.id = 'slide-nav-list';
			list.style.cssText = `
				list-style: none;
				padding: 0;
				margin: 0;
				font-family: inherit;
			`;

			container.appendChild(title);
			container.appendChild(instructions);
			container.appendChild(searchInput);
			container.appendChild(list);
			overlay.appendChild(container);
			document.body.appendChild(overlay);

			// Search input event
			searchInput.addEventListener('input', () => {
				filterSlides(searchInput.value);
			});
		}

		// Collect all slide headlines
		function collectSlides() {
			const slides = deck.getSlides();
			const seen = new Map();
			slideList = [];

			slides.forEach((slide, index) => {
				const h1 = slide.querySelector('h1');
				const h2 = slide.querySelector('h2');

				let headline = null;
				if (h1) {
					// Clone the h1 to avoid modifying the original
					const clone = h1.cloneNode(true);
					// Replace <br> tags with spaces
					clone.querySelectorAll('br').forEach(br => {
						br.replaceWith(' ');
					});
					headline = clone.textContent.trim().replace(/\s+/g, ' ');
				} else if (h2) {
					const clone = h2.cloneNode(true);
					clone.querySelectorAll('br').forEach(br => {
						br.replaceWith(' ');
					});
					headline = clone.textContent.trim().replace(/\s+/g, ' ');
				}

				if (headline) {
					// Deduplicate: only keep first occurrence
					if (!seen.has(headline)) {
						seen.set(headline, true);
						slideList.push({
							index: index,
							h: slide.dataset.indexH || index,
							v: slide.dataset.indexV || 0,
							headline: headline,
							isH1: !!h1
						});
					}
				}
			});
			filteredList = [...slideList];
		}

		// Filter slides based on search
		function filterSlides(query) {
			const lowerQuery = query.toLowerCase();
			if (!lowerQuery) {
				filteredList = [...slideList];
			} else {
				filteredList = slideList.filter(item =>
					item.headline.toLowerCase().includes(lowerQuery)
				);
			}
			selectedIndex = 0;
			renderList();
		}

		// Render slide list
		function renderList() {
			const list = document.getElementById('slide-nav-list');

			// Clear list safely
			while (list.firstChild) {
				list.removeChild(list.firstChild);
			}

			if (filteredList.length === 0) {
				const li = document.createElement('li');
				li.textContent = 'Keine Slides gefunden';
				li.style.cssText = `
					padding: 12px 16px;
					color: #999;
					font-style: italic;
					font-family: inherit;
				`;
				list.appendChild(li);
				return;
			}

			filteredList.forEach((item, idx) => {
				const li = document.createElement('li');
				li.style.cssText = `
					padding: 12px 16px;
					margin: 4px 0;
					cursor: pointer;
					background: ${idx === selectedIndex ? '#4a90e2' : '#333'};
					border-radius: 4px;
					font-size: ${item.isH1 ? '20px' : '18px'};
					font-weight: ${item.isH1 ? 'bold' : 'normal'};
					transition: background 0.2s;
					font-family: inherit;
				`;
				li.textContent = item.headline;
				li.dataset.index = idx;

				li.addEventListener('click', () => {
					jumpToSlide(idx);
				});

				li.addEventListener('mouseenter', () => {
					selectedIndex = idx;
					renderList();
				});

				list.appendChild(li);
			});
		}

		// Jump to selected slide
		function jumpToSlide(index) {
			const item = filteredList[index];
			if (item) {
				deck.slide(parseInt(item.h), parseInt(item.v));
				closeOverlay();
			}
		}

		// Open overlay
		function openOverlay() {
			if (!overlay) {
				createOverlay();
			}
			collectSlides();
			selectedIndex = 0;
			if (searchInput) {
				searchInput.value = '';
			}
			renderList();
			overlay.style.display = 'block';
			// Focus search input
			setTimeout(() => {
				if (searchInput) {
					searchInput.focus();
				}
			}, 100);
		}

		// Close overlay
		function closeOverlay() {
			if (overlay) {
				overlay.style.display = 'none';
			}
		}

		// Keyboard navigation within overlay
		function handleOverlayKeys(event) {
			if (overlay && overlay.style.display === 'block') {
				switch (event.key) {
					case 'ArrowDown':
						event.preventDefault();
						event.stopPropagation();
						if (filteredList.length > 0) {
							selectedIndex = Math.min(selectedIndex + 1, filteredList.length - 1);
							renderList();
							// Scroll to selected item
							const selected = document.querySelector(`#slide-nav-list li:nth-child(${selectedIndex + 1})`);
							if (selected) {
								selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
							}
						}
						break;
					case 'ArrowUp':
						event.preventDefault();
						event.stopPropagation();
						if (filteredList.length > 0) {
							selectedIndex = Math.max(selectedIndex - 1, 0);
							renderList();
							// Scroll to selected item
							const selectedUp = document.querySelector(`#slide-nav-list li:nth-child(${selectedIndex + 1})`);
							if (selectedUp) {
								selectedUp.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
							}
						}
						break;
					case 'Enter':
						event.preventDefault();
						event.stopPropagation();
						if (filteredList.length > 0) {
							jumpToSlide(selectedIndex);
						}
						break;
					case 'Escape':
						event.preventDefault();
						event.stopPropagation();
						closeOverlay();
						break;
				}
			}
		}

		// Global keyboard handler
		document.addEventListener('keydown', (event) => {
			// Check if overlay is open first
			const overlayOpen = overlay && overlay.style.display === 'block';

			// Handle navigation within overlay
			if (overlayOpen) {
				handleOverlayKeys(event);
				return;
			}

			// Open overlay with 't' key (TOC) - but not when typing in an input
			if (event.key === 't' && !event.target.matches('input, textarea')) {
				event.preventDefault();
				event.stopPropagation();
				openOverlay();
			}
		}, true);
	}
};

// Register plugin with Reveal.js
if (typeof Reveal !== 'undefined') {
	Reveal.registerPlugin('slide-nav', SlideNav);
}
