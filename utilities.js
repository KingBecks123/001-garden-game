// Play a sound effect
function playSFX(sfxName) {
    if (!gameState.settings.mutedSFX && soundEffects[sfxName]) {
        // Create a new audio element to allow overlapping sounds
        const sound = soundEffects[sfxName].cloneNode();
        sound.volume = 0.5; // Adjust volume as needed
        sound.play().catch(err => {
            // Ignore errors - browser might block autoplay
            console.log('Audio playback error:', err);
        });
    }
}

// Helper function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Get adjacent tile indices for a given tile index
function getAdjacentTiles(index) {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const adjacent = [];
    
    // Check up
    if (row > 0) adjacent.push(index - 5);
    // Check right
    if (col < 4) adjacent.push(index + 1);
    // Check down
    if (row < 4) adjacent.push(index + 5);
    // Check left
    if (col > 0) adjacent.push(index - 1);
    
    return adjacent;
}

// Show tooltip
function showTooltip(title, description, price, targetElement) {
    const rect = targetElement.getBoundingClientRect();
    
    // Set tooltip content
    tooltip.innerHTML = `
        <div class="tooltip-title">${title}</div>
        <div class="tooltip-description">${description}</div>
        ${price ? `<div class="tooltip-price">${price}</div>` : ''}
    `;
    
    // Position and show the tooltip
    tooltip.style.display = 'block';
    tooltip.style.left = `${rect.right + 10}px`;
    tooltip.style.top = `${rect.top}px`;
    
    // Assign the target element to the tooltip for dynamic updates
    tooltip.targetElement = targetElement;
    
    // Adjust if the tooltip goes off-screen
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.right > window.innerWidth) {
        tooltip.style.left = `${rect.left - tooltipRect.width - 10}px`;
    }
    if (tooltipRect.bottom > window.innerHeight) {
        tooltip.style.top = `${rect.bottom - tooltipRect.height}px`;
    }
}

// Hide tooltip
function hideTooltip() {
    tooltip.style.display = 'none';
}

// Show a notification
function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set message and show
    notification.textContent = message;
    notification.className = 'notification-show';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.className = '';
    }, 3000);
}

// Helper function to display plant tooltip - consolidates tooltip logic
function displayPlantTooltip(tileIndex, plant, targetElement) {
    const plantType = plantTypes[plant.type];
    let description = plantType.description;
    
    // For plants that produce points, show actual points per second (including pond boosts)
    if (plant.type === 'limeBush' || plant.type === 'limeTree') {
        let actualPointsPerSecond = plantType.basePointsPerSecond;
        const adjacentTiles = getAdjacentTiles(tileIndex);
        
        // Count adjacent ponds
        let pondBoost = 0;
        for (const adjTile of adjacentTiles) {
            if (gameState.gardenGrid[adjTile] && gameState.gardenGrid[adjTile].type === 'pond') {
                pondBoost += 1;
            }
        }
        
        actualPointsPerSecond += pondBoost;
        description = `Earns ${formatNumber(actualPointsPerSecond)} points / second`;
        
        if (pondBoost > 0) {
            description += ` (includes +${pondBoost} from ponds)`;
        }
    }
    // For baskets, update description to show market effects
    else if (plant.type === 'basket') {
        const adjacentTiles = getAdjacentTiles(tileIndex);
        let marketBoost = 0;
        
        for (const adjTile of adjacentTiles) {
            if (gameState.gardenGrid[adjTile] && gameState.gardenGrid[adjTile].type === 'market') {
                marketBoost += 1;
            }
        }
        
        const pointsPerLime = 5 + marketBoost;
        description = `When placed next to a lime tree, collects 1 lime per second. Hover over to collect all limes. Each lime gives +${pointsPerLime} points. Maximum of ${formatNumber(plantTypes.basket.maxLimes)} limes.`;
        
        if (marketBoost > 0) {
            description += ` (includes +${marketBoost} from markets)`;
        }
    }
    
    // For baskets, show current lime count
    let extraInfo = null;
    if (plant.type === 'basket') {
        if (!plant.limes) plant.limes = 0;
        extraInfo = `Limes: ${formatNumber(plant.limes)}/${formatNumber(plantTypes.basket.maxLimes)}`;
    }
    
    showTooltip(
        plantType.name,
        description,
        extraInfo,
        targetElement
    );
}

// Update tooltip if currently shown
function updateTooltip() {
    // Check if there's an active tooltip
    if (tooltip.style.display === 'block' && tooltip.targetElement) {
        const tileIndex = tooltip.targetElement.dataset.index;
        
        // If it's a garden tile with a plant
        if (tileIndex !== undefined && gameState.gardenGrid[tileIndex]) {
            const plant = gameState.gardenGrid[tileIndex];
            // Just call our consolidated displayPlantTooltip function 
            displayPlantTooltip(parseInt(tileIndex), plant, tooltip.targetElement);
        }
        
        // For seed items, we don't need to update as the prices don't change during hover
    }
} 