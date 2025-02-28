// Track if user interaction has occurred
let firstInteractionOccurred = false;

// Register first interaction
document.addEventListener('click', function() {
    firstInteractionOccurred = true;
}, { once: true });

// Play a sound effect
function playSFX(sfxName) {
    // Don't attempt to play if sound is muted in settings
    if (playerPreferences.mutedSFX || !soundEffects[sfxName]) {
        return;
    }
    
    try {
        // Create a new audio element to allow overlapping sounds
        const sound = soundEffects[sfxName].cloneNode();
        sound.volume = 0.5; // Set volume (will be used after successful play)
        
        // If this is the first interaction, we can just play normally
        if (firstInteractionOccurred) {
            sound.play();
        } else {
            // For sounds before first interaction, attempt to play muted first
            sound.muted = true;
            
            // Try to play muted first (should work in most browsers)
            sound.play()
                .then(() => {
                    // If successful, unmute (may or may not work depending on browser)
                    sound.muted = false;
                })
                .catch(err => {
                    // Just log the error silently - expected before interaction
                    console.log('Sound could not autoplay:', err);
                });
        }
    } catch (err) {
        // Catch any other errors
        console.log('Audio playback error:', err);
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
    // For markets, show billboard effect
    else if (plant.type === 'market') {
        // Get row and column of this market
        const marketRow = Math.floor(tileIndex / 5);
        const marketCol = tileIndex % 5;
        let billboardCount = 0;
        
        // Check all tiles for billboards in the same row or column
        for (let i = 0; i < gameState.gardenGrid.length; i++) {
            if (gameState.gardenGrid[i] && gameState.gardenGrid[i].type === 'billboard') {
                const billboardRow = Math.floor(i / 5);
                const billboardCol = i % 5;
                
                // If the billboard is in the same row or column as this market
                if (billboardRow === marketRow || billboardCol === marketCol) {
                    billboardCount += 1;
                }
            }
        }
        
        const marketBoost = 1 + billboardCount;
        
        // Debug info - check if billboards are detected
        console.log(`Market at tile ${tileIndex} has ${billboardCount} billboards in line. Total boost: ${marketBoost}`);
        
        description = `When placed next to a basket, increases the points per lime by ${marketBoost}.`;
        
        if (billboardCount > 0) {
            description += ` (enhanced by ${billboardCount} billboard${billboardCount > 1 ? 's' : ''} in the same row/column)`;
        }
    }
    // For baskets, update description to show market effects
    else if (plant.type === 'basket') {
        const adjacentTiles = getAdjacentTiles(tileIndex);
        let marketBoost = 0;
        let marketCount = 0;
        let billboardCount = 0;
        
        // Check for adjacent markets
        for (const adjTile of adjacentTiles) {
            if (gameState.gardenGrid[adjTile] && gameState.gardenGrid[adjTile].type === 'market') {
                marketCount++;
                
                // Get market position
                const marketTile = adjTile;
                const marketRow = Math.floor(marketTile / 5);
                const marketCol = marketTile % 5;
                
                // Base boost from market
                let marketBoostValue = 1;
                let marketBillboardCount = 0;
                
                // Check all tiles for billboards in the same row or column as this market
                for (let i = 0; i < gameState.gardenGrid.length; i++) {
                    if (gameState.gardenGrid[i] && gameState.gardenGrid[i].type === 'billboard') {
                        const billboardRow = Math.floor(i / 5);
                        const billboardCol = i % 5;
                        
                        // If the billboard is in the same row or column as this market
                        if (billboardRow === marketRow || billboardCol === marketCol) {
                            marketBoostValue += 1; // Billboard increases market's boost by 1
                            marketBillboardCount += 1;
                            billboardCount += 1;
                        }
                    }
                }
                
                // Debug info - check each market's boost calculation
                console.log(`Market at tile ${adjTile} has ${marketBillboardCount} billboards in line. Boost: ${marketBoostValue}`);
                
                marketBoost += marketBoostValue; // Add the total market boost value
            }
        }
        
        const pointsPerLime = 5 + marketBoost;
        
        // Debug basket calculation
        console.log(`Basket at tile ${tileIndex} has ${marketCount} markets nearby. Total boost: ${marketBoost}`);
        
        description = `When placed next to a lime tree, collects 1 lime per second. Hover over to collect all limes. Each lime gives +${pointsPerLime} points. Maximum of ${formatNumber(plantTypes.basket.maxLimes)} limes.`;
        
        if (marketBoost > 0) {
            if (billboardCount > 0) {
                description += ` (includes +${marketCount} from ${marketCount > 1 ? 'markets' : 'market'} with ${billboardCount} billboard${billboardCount > 1 ? 's' : ''} boost)`;
            } else {
                description += ` (includes +${marketBoost} from ${marketCount > 1 ? 'markets' : 'market'})`;
            }
        }
    }
    // For billboards, show how they enhance nearby markets
    else if (plant.type === 'billboard') {
        // Get billboard position
        const billboardRow = Math.floor(tileIndex / 5);
        const billboardCol = tileIndex % 5;
        let marketCount = 0;
        
        // Count markets in the same row or column
        for (let i = 0; i < gameState.gardenGrid.length; i++) {
            if (gameState.gardenGrid[i] && gameState.gardenGrid[i].type === 'market') {
                const marketRow = Math.floor(i / 5);
                const marketCol = i % 5;
                
                // If the market is in the same row or column as this billboard
                if (marketRow === billboardRow || marketCol === billboardCol) {
                    marketCount += 1;
                }
            }
        }
        
        description = "Advertise your limes! Increases Market's basket boost by 1.";
        
        if (marketCount > 0) {
            description += ` Currently boosting ${marketCount} market${marketCount > 1 ? 's' : ''} in this row/column.`;
        } else {
            description += ` (Not currently boosting any markets. Place in same row/column as markets for effect.)`;
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