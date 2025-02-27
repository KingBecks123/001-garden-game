// Game state
let gameState = {
    points: 0,
    pointsPerSecond: 0,
    selectedSeed: null,
    plants: [],
    gardenGrid: Array(25).fill(null),
    unlocked: {
        limeBush: true,
        limeTree: false,
        pond: false,
        basket: false,
        market: false
    },
    lastSave: Date.now(),
    settings: {
        mutedMusic: false,
        mutedSFX: false,
        darkMode: false
    },
    isDragging: false,
    isRemoving: false
};

// Sound effects
const soundEffects = {
    click: new Audio('sfx/click.mp3'),
    remove: new Audio('sfx/remove.mp3'),
    basketFull: new Audio('sfx/basket_full.mp3')
};

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

// Plant definitions
const plantTypes = {
    limeBush: {
        id: 'limeBush',
        name: 'Lime Bush',
        description: 'Earns 1 point / second',
        price: 0,
        unlockCondition: 0,
        basePointsPerSecond: 1,
        image: 'images/lime-bush.svg'
    },
    limeTree: {
        id: 'limeTree',
        name: 'Lime Tree',
        description: 'Earns 3 points / second',
        price: 50,
        unlockCondition: 100,
        basePointsPerSecond: 3,
        image: 'images/lime-tree.svg'
    },
    pond: {
        id: 'pond',
        name: 'Pond',
        description: 'When placed next to a lime plant, that plant produces +1 point / second',
        price: 200,
        unlockCondition: 1000,
        basePointsPerSecond: 0,
        image: 'images/pond.svg'
    },
    basket: {
        id: 'basket',
        name: 'Basket',
        description: 'When placed next to a lime tree, collects 1 lime per second. Hover over to collect all limes. Each lime gives +5 points. Maximum of 100 limes.',
        price: 1000,
        unlockCondition: 10000,
        basePointsPerSecond: 0,
        maxLimes: 100,
        image: 'images/basket.svg'
    },
    market: {
        id: 'market',
        name: 'Market',
        description: 'When placed next to a basket, increases the points per lime by 1.',
        price: 10000,
        unlockCondition: 20000,
        basePointsPerSecond: 0,
        image: 'images/market.svg'
    }
};

// Upgrade definitions (to be implemented later)
const upgradeTypes = {
    // We'll add these later
};

// DOM Elements
const pointsDisplay = document.getElementById('points');
const seedGrid = document.getElementById('seed-grid');
const gardenGrid = document.getElementById('garden-grid');
const upgradesGrid = document.getElementById('upgrades-grid');
const tooltip = document.getElementById('tooltip');
const muteMusic = document.getElementById('mute-music');
const muteSFX = document.getElementById('mute-sfx');
const deleteSave = document.getElementById('delete-save');
const infoButton = document.getElementById('info-button');
const themeToggle = document.getElementById('theme-toggle');
const pointsPerSecondDisplay = document.getElementById('points-per-second');

// Initialize the game
function initGame() {
    loadGame();
    // Force theme button update after DOM is ready
    setTimeout(() => {
        applyTheme();
    }, 0);
    createGardenGrid();
    createSeedMenu();
    createUpgradeMenu();
    updateUI();
    setupEventListeners();
    
    // Start the game loop
    setInterval(gameLoop, 1000);
    
    // Save the game every 2 seconds
    setInterval(saveGame, 2000);
    
    // Add mouse up event to stop dragging
    document.addEventListener('mouseup', () => {
        gameState.isDragging = false;
        gameState.isRemoving = false;
    });
}

// Apply the current theme (light/dark)
function applyTheme() {
    if (gameState.settings.darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = 'L';
        themeToggle.title = 'Switch to Light Mode';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = 'D';
        themeToggle.title = 'Switch to Dark Mode';
    }
}

// Game loop - runs every second
function gameLoop() {
    calculatePointsPerSecond();
    updateUI();
    updateTooltip();
    checkUnlocks();
}

// Calculate points earned per second
function calculatePointsPerSecond() {
    let pointsPerSecond = 0;
    let needsGardenUpdate = false;
    let basketBecameFull = false;
    
    // Process each plant in the garden
    for (let i = 0; i < gameState.gardenGrid.length; i++) {
        const plant = gameState.gardenGrid[i];
        if (plant) {
            // Base points for the plant
            let plantPoints = plantTypes[plant.type].basePointsPerSecond;
            
            // Special effect for ponds - boost adjacent lime plants
            if (plant.type === 'pond') {
                // Do nothing for the pond itself
            } else if (plant.type === 'limeBush' || plant.type === 'limeTree') {
                // Check if there's an adjacent pond
                const adjacentTiles = getAdjacentTiles(i);
                for (const adjTile of adjacentTiles) {
                    if (gameState.gardenGrid[adjTile] && gameState.gardenGrid[adjTile].type === 'pond') {
                        plantPoints += 1; // Pond boosts lime plants by +1 point/sec
                    }
                }
            } else if (plant.type === 'basket') {
                // Add limes to basket from adjacent lime trees
                const adjacentTiles = getAdjacentTiles(i);
                let limesCollected = 0;
                
                for (const adjTile of adjacentTiles) {
                    if (gameState.gardenGrid[adjTile] && gameState.gardenGrid[adjTile].type === 'limeTree') {
                        limesCollected += 1;
                    }
                }
                
                // Initialize limes property if it doesn't exist
                if (!plant.limes) plant.limes = 0;
                
                const wasBeforeMax = plant.limes < plantTypes.basket.maxLimes;
                
                // Add limes up to the maximum
                const maxLimes = plantTypes.basket.maxLimes;
                const newLimeCount = Math.min(plant.limes + limesCollected, maxLimes);
                plant.limes = newLimeCount;
                
                // Check if basket just became full
                if (wasBeforeMax && plant.limes >= maxLimes) {
                    needsGardenUpdate = true;
                    basketBecameFull = true;
                }
            }
            
            // Add this plant's contribution
            pointsPerSecond += plantPoints;
        }
    }
    
    // Update garden grid if any basket became full
    if (needsGardenUpdate) {
        createGardenGrid();
        
        // Play a sound if a basket became full
        if (basketBecameFull) {
            playSFX('basketFull');
        }
    }
    
    // Store the points per second value
    gameState.pointsPerSecond = pointsPerSecond;
    
    // Add the points to the total
    gameState.points += pointsPerSecond;
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

// Check for unlocks
function checkUnlocks() {
    let unlockHappened = false;
    let newlyUnlocked = [];
    
    // Check if we have enough points to unlock the Lime Tree
    if (!gameState.unlocked.limeTree && gameState.points >= plantTypes.limeTree.unlockCondition) {
        gameState.unlocked.limeTree = true;
        unlockHappened = true;
        newlyUnlocked.push(plantTypes.limeTree.name);
    }
    
    // Check if we have enough points to unlock the Pond
    if (!gameState.unlocked.pond && gameState.points >= plantTypes.pond.unlockCondition) {
        gameState.unlocked.pond = true;
        unlockHappened = true;
        newlyUnlocked.push(plantTypes.pond.name);
    }
    
    // Check if we have enough points to unlock the Basket
    if (!gameState.unlocked.basket && gameState.points >= plantTypes.basket.unlockCondition) {
        gameState.unlocked.basket = true;
        unlockHappened = true;
        newlyUnlocked.push(plantTypes.basket.name);
    }
    
    // Check if we have enough points to unlock the Market
    if (!gameState.unlocked.market && gameState.points >= plantTypes.market.unlockCondition) {
        gameState.unlocked.market = true;
        unlockHappened = true;
        newlyUnlocked.push(plantTypes.market.name);
    }
    
    // Only refresh the seed menu if something was unlocked
    if (unlockHappened) {
        createSeedMenu();
        
        // Show notification for newly unlocked plants
        newlyUnlocked.forEach(plantName => {
            showNotification(`New item unlocked: ${plantName}!`);
        });
    }
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

// Create the garden grid
function createGardenGrid() {
    gardenGrid.innerHTML = '';
    
    for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div');
        tile.className = 'garden-tile';
        tile.dataset.index = i;
        
        // If this tile has a plant, show it
        if (gameState.gardenGrid[i]) {
            const plant = gameState.gardenGrid[i];
            tile.classList.add('occupied');
            
            const plantImg = document.createElement('img');
            plantImg.src = plantTypes[plant.type].image;
            plantImg.alt = plantTypes[plant.type].name;
            plantImg.className = 'item-icon';
            
            // For baskets, show visual indication when full
            if (plant.type === 'basket' && plant.limes >= plantTypes.basket.maxLimes) {
                tile.classList.add('basket-full');
            }
            
            tile.appendChild(plantImg);
        }
        
        // Add event listeners for placing plants
        tile.addEventListener('click', (e) => {
            if (!e.shiftKey) {
                handleTileClick(i);
            }
        });
        
        tile.addEventListener('contextmenu', (e) => {
            // Always prevent default context menu behavior
            e.preventDefault();
            handleTileRightClick(i);
        });
        
        // Mouse down event for drag planting
        tile.addEventListener('mousedown', (e) => {
            if (e.shiftKey && e.button === 0) { // Left button + shift
                gameState.isDragging = true;
                gameState.isRemoving = false;
                handleTileClick(i);
            }
        });
        
        // Mouse over event for drag planting/removing
        tile.addEventListener('mouseover', (e) => {
            if (gameState.isDragging) {
                if (gameState.isRemoving) {
                    handleTileRightClick(i);
                } else {
                    handleTileClick(i);
                }
            }
        });
        
        // Hover events for showing information
        tile.addEventListener('mouseenter', () => {
            if (gameState.gardenGrid[i]) {
                const plant = gameState.gardenGrid[i];
                displayPlantTooltip(i, plant, tile);
                
                // Collect limes when hovering over a basket
                if (plant.type === 'basket' && plant.limes && plant.limes > 0) {
                    collectLimesFromBasket(i);
                }
            }
        });
        
        tile.addEventListener('mouseleave', () => {
            hideTooltip();
        });
        
        gardenGrid.appendChild(tile);
    }
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

// Collect limes from a basket
function collectLimesFromBasket(tileIndex) {
    const plant = gameState.gardenGrid[tileIndex];
    if (!plant || plant.type !== 'basket' || !plant.limes || plant.limes <= 0) return;
    
    // Calculate points per lime (base of 5)
    let pointsPerLime = 5;
    
    // Check for adjacent markets
    const adjacentTiles = getAdjacentTiles(tileIndex);
    for (const adjTile of adjacentTiles) {
        if (gameState.gardenGrid[adjTile] && gameState.gardenGrid[adjTile].type === 'market') {
            pointsPerLime += 1; // Each market adds 1 point per lime
        }
    }
    
    const limesToCollect = plant.limes;
    const pointsToAdd = limesToCollect * pointsPerLime;
    gameState.points += pointsToAdd;
    plant.limes = 0;
    
    // Show notification
    showNotification(`Collected ${formatNumber(limesToCollect)} limes for ${formatNumber(pointsToAdd)} points!`);
    
    // Play sound effect
    playSFX('click');
    
    // Update UI
    createGardenGrid();
    updateUI();
}

// Handle clicking on a garden tile
function handleTileClick(tileIndex) {
    // Check if there's a plant in this tile
    if (gameState.gardenGrid[tileIndex]) {
        const plant = gameState.gardenGrid[tileIndex];
        
        // If this is a basket, collect the limes
        if (plant.type === 'basket' && plant.limes && plant.limes > 0) {
            collectLimesFromBasket(tileIndex);
            return;
        }
        
        // For other plants, tile is occupied, do nothing
        return;
    }
    
    // Check if we have a selected seed
    if (!gameState.selectedSeed) return;
    
    // Check if we can afford the plant
    const selectedPlant = plantTypes[gameState.selectedSeed];
    if (gameState.points < selectedPlant.price) return;
    
    // Place the plant
    gameState.points -= selectedPlant.price;
    gameState.gardenGrid[tileIndex] = {
        type: gameState.selectedSeed,
        plantedAt: Date.now()
    };
    
    // Initialize limes for basket
    if (gameState.selectedSeed === 'basket') {
        gameState.gardenGrid[tileIndex].limes = 0;
    }
    
    // Play sound effect
    playSFX('click');
    
    // Update the UI
    createGardenGrid();
    updateUI();
}

// Handle right-clicking on a garden tile
function handleTileRightClick(tileIndex) {
    // Check if there's a plant in this tile
    if (!gameState.gardenGrid[tileIndex]) return;
    
    // Remove the plant
    gameState.gardenGrid[tileIndex] = null;
    
    // Play sound effect
    playSFX('remove');
    
    // Update the UI
    createGardenGrid();
    updateUI();
}

// Select a seed
function selectSeed(plantId) {
    // If it's already selected, deselect it
    if (gameState.selectedSeed === plantId) {
        gameState.selectedSeed = null;
    } else {
        gameState.selectedSeed = plantId;
    }
    
    // Play sound effect
    playSFX('click');
    
    // Update the UI
    createSeedMenu();
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

// Update UI elements
function updateUI() {
    // Update points display
    pointsDisplay.textContent = formatNumber(Math.floor(gameState.points));
    
    // Update points per second display
    pointsPerSecondDisplay.textContent = `${formatNumber(gameState.pointsPerSecond)} points/second`;
    
    // Update seed menu affordability
    createSeedMenu();
}

// Setup event listeners for settings
function setupEventListeners() {
    muteMusic.addEventListener('click', () => {
        gameState.settings.mutedMusic = !gameState.settings.mutedMusic;
        muteMusic.textContent = gameState.settings.mutedMusic ? 'Unmute Music' : 'Mute Music';
        playSFX('click');
    });
    
    muteSFX.addEventListener('click', () => {
        gameState.settings.mutedSFX = !gameState.settings.mutedSFX;
        muteSFX.textContent = gameState.settings.mutedSFX ? 'Unmute SFX' : 'Mute SFX';
        
        // Play a click sound if we're unmuting
        if (!gameState.settings.mutedSFX) {
            playSFX('click');
        }
    });
    
    deleteSave.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete your save and start over?')) {
            localStorage.removeItem('gardenGameSave');
            playSFX('click');
            location.reload();
        } else {
            playSFX('click');
        }
    });
    
    // Theme toggle button
    themeToggle.addEventListener('click', () => {
        gameState.settings.darkMode = !gameState.settings.darkMode;
        applyTheme();
        playSFX('click');
        saveGame();
    });
    
    // Theme toggle tooltip
    themeToggle.addEventListener('mouseenter', () => {
        showTooltip(
            "Theme",
            gameState.settings.darkMode ? 
                "Switch to light mode" : 
                "Switch to dark mode",
            null,
            themeToggle
        );
    });
    
    themeToggle.addEventListener('mouseleave', () => {
        hideTooltip();
    });
    
    // Info button tooltip
    infoButton.addEventListener('mouseenter', () => {
        const controlsInfo = `
            • Click an item in the menu to select it<br>
            • Click a garden tile to place the selected item<br>
            • Right-click to remove an item<br>
            • Shift + drag (left click) to place multiple items<br>
            • Hover over special items to collect resources
        `;
        
        showTooltip(
            "Game Controls",
            controlsInfo,
            null,
            infoButton
        );
    });
    
    infoButton.addEventListener('mouseleave', () => {
        hideTooltip();
    });
}

// Save the game
function saveGame() {
    localStorage.setItem('gardenGameSave', JSON.stringify(gameState));
    gameState.lastSave = Date.now();
}

// Load the game
function loadGame() {
    const savedGame = localStorage.getItem('gardenGameSave');
    if (savedGame) {
        gameState = JSON.parse(savedGame);
    }
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

// Create the seed menu
function createSeedMenu() {
    seedGrid.innerHTML = '';
    
    // Determine the next item to unlock for tooltip hint
    let nextItemToUnlock = null;
    let lowestUnlockPoints = Infinity;
    
    for (const plantId in plantTypes) {
        if (!gameState.unlocked[plantId]) {
            const unlockPoints = plantTypes[plantId].unlockCondition;
            if (unlockPoints < lowestUnlockPoints) {
                lowestUnlockPoints = unlockPoints;
                nextItemToUnlock = plantId;
            }
        }
    }
    
    // Add all plants to the menu (not just unlocked ones)
    for (const plantId in plantTypes) {
        const plant = plantTypes[plantId];
        const isUnlocked = gameState.unlocked[plantId];
        
        const seedItem = document.createElement('div');
        seedItem.className = 'seed-item';
        seedItem.dataset.plantId = plantId;
        
        // Apply the appropriate class based on unlock status
        if (!isUnlocked) {
            seedItem.classList.add('locked');
        } else if (plant.price <= gameState.points) {
            seedItem.classList.add('affordable');
        } else {
            seedItem.classList.add('not-affordable');
        }
        
        // If this is the currently selected seed, highlight it
        if (gameState.selectedSeed === plantId) {
            seedItem.classList.add('selected');
        }
        
        const plantImg = document.createElement('img');
        plantImg.src = plant.image;
        plantImg.alt = plant.name;
        plantImg.className = 'item-icon';
        
        const plantName = document.createElement('div');
        plantName.className = 'item-name';
        plantName.textContent = isUnlocked ? plant.name : '???';
        
        seedItem.appendChild(plantImg);
        seedItem.appendChild(plantName);
        
        // Add event listener for selecting this seed (only if unlocked)
        seedItem.addEventListener('click', () => {
            // Only allow selection if unlocked and affordable
            if (isUnlocked && plant.price <= gameState.points) {
                selectSeed(plantId);
            }
        });
        
        // Hover events for showing information
        if (isUnlocked) {
            // For unlocked items
            seedItem.addEventListener('mouseenter', () => {
                showTooltip(
                    plant.name,
                    plant.description,
                    `Price: ${formatNumber(plant.price)} points`,
                    seedItem
                );
            });
        } else if (plantId === nextItemToUnlock) {
            // For the next item to unlock
            seedItem.addEventListener('mouseenter', () => {
                showTooltip(
                    "Locked Item",
                    "Reach the required points to unlock this item.",
                    `Required: ${formatNumber(plant.unlockCondition)} points`,
                    seedItem
                );
            });
        }
        
        seedItem.addEventListener('mouseleave', () => {
            hideTooltip();
        });
        
        seedGrid.appendChild(seedItem);
    }
}

// Create the upgrade menu (placeholder for now)
function createUpgradeMenu() {
    upgradesGrid.innerHTML = '';
    // We'll implement this later
}

// Start the game when the page loads
window.addEventListener('load', initGame); 