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
        market: false,
        billboard: false
    },
    lastSave: Date.now(),
    isDragging: false,
    isRemoving: false
};

// Player preferences (separate from game state)
let playerPreferences = {
    mutedMusic: false,
    mutedSFX: false,
    darkMode: false,
    usePixelArt: true, // true for PNG, false for SVG
    lastSave: Date.now()
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
    loadPreferences();
    
    // Update UI to match preferences
    updatePreferencesUI();
    
    // Force theme button update after DOM is ready
    setTimeout(() => {
        applyTheme();
        applyImageType();
    }, 0);
    
    createGardenGrid();
    createSeedMenu();
    createUpgradeMenu();
    updateUI();
    setupEventListeners();
    
    // Start the game loop
    setInterval(gameLoop, 1000);
    
    // Save the game every 2 seconds
    setInterval(() => {
        saveGame();
        savePreferences();
    }, 2000);
    
    // Add mouse up event to stop dragging
    document.addEventListener('mouseup', () => {
        gameState.isDragging = false;
        gameState.isRemoving = false;
    });
}

// Update UI to match player preferences
function updatePreferencesUI() {
    // Update mute music button
    if (muteMusic) {
        muteMusic.textContent = playerPreferences.mutedMusic ? 'Unmute Music' : 'Mute Music';
    }
    
    // Update mute SFX button
    if (muteSFX) {
        muteSFX.textContent = playerPreferences.mutedSFX ? 'Unmute SFX' : 'Mute SFX';
    }
    
    // Theme is handled by applyTheme() separately
}

// Apply the current theme (light/dark)
function applyTheme() {
    if (playerPreferences.darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = 'L';
        themeToggle.title = 'Switch to Light Mode';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = 'D';
        themeToggle.title = 'Switch to Dark Mode';
    }
}

// Apply the current image type based on preferences
function applyImageType() {
    // Update button appearance with icon instead of text
    const imageToggleBtn = document.getElementById('image-toggle');
    if (imageToggleBtn) {
        // Clear any existing content
        imageToggleBtn.innerHTML = '';
        
        // Create lime icon - use the icon representing the CURRENT mode
        const iconImg = document.createElement('img');
        
        // Use the icon matching the current mode (showing what's CURRENTLY active)
        iconImg.src = playerPreferences.usePixelArt ? 
            'images/PNGs/toggle-lime.png' : // Show PNG icon when in PNG mode
            'images/SVGs/toggle-lime.svg';  // Show SVG icon when in SVG mode
            
        iconImg.alt = 'Toggle image type';
        iconImg.style.width = '18px';
        iconImg.style.height = '18px';
        
        // Add icon to button
        imageToggleBtn.appendChild(iconImg);
        
        // Update tooltip
        imageToggleBtn.title = playerPreferences.usePixelArt ? 'Switch to SVG images' : 'Switch to Pixel Art images';
    }
    
    // Update image paths for all plants in the garden
    updateAllPlantImages();
}

// Update all plant images in the garden to match current preference
function updateAllPlantImages() {
    // First update any plants in the garden
    createGardenGrid();
    
    // Then update the seed menu
    createSeedMenu();
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

// Check for unlocks
function checkUnlocks() {
    let unlockHappened = false;
    let newlyUnlocked = [];
    
    // Check each plant type for potential unlocks
    for (const plantId in plantTypes) {
        // Skip items that are already unlocked
        if (gameState.unlocked[plantId]) continue;
        
        // Use price as the unlock condition
        if (gameState.points >= plantTypes[plantId].price) {
            gameState.unlocked[plantId] = true;
            unlockHappened = true;
            newlyUnlocked.push(plantTypes[plantId].name);
        }
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

// Collect limes from a basket
function collectLimesFromBasket(tileIndex) {
    const plant = gameState.gardenGrid[tileIndex];
    if (!plant || plant.type !== 'basket' || !plant.limes || plant.limes <= 0) return;
    
    // Calculate points per lime (base of 5)
    let pointsPerLime = 5;
    
    // Check for adjacent markets and billboards
    const adjacentTiles = getAdjacentTiles(tileIndex);
    let marketBoost = 0;
    let marketCount = 0;
    let billboardCount = 0;
    
    // First, check for adjacent markets
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
            
            console.log(`Collecting: Market at tile ${adjTile} has ${marketBillboardCount} billboards in line. Boost: ${marketBoostValue}`);
            
            marketBoost += marketBoostValue; // Add the total market boost value
        }
    }
    
    // Add market boost to points per lime
    pointsPerLime += marketBoost;
    
    console.log(`Collecting: Basket at tile ${tileIndex} has ${marketCount} markets nearby. Total boost: ${marketBoost}. Points per lime: ${pointsPerLime}`);
    
    const limesToCollect = plant.limes;
    const pointsToAdd = limesToCollect * pointsPerLime;
    gameState.points += pointsToAdd;
    plant.limes = 0;
    
    // Show notification with detailed information
    let notificationText = `Collected ${formatNumber(limesToCollect)} limes for ${formatNumber(pointsToAdd)} points!`;
    if (marketBoost > 0) {
        if (billboardCount > 0) {
            notificationText += ` (${pointsPerLime} points each with market & billboard boosts)`;
        } else {
            notificationText += ` (${pointsPerLime} points each with market boost)`;
        }
    }
    
    showNotification(notificationText);
    
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
    
    // Get the plant type that's being removed
    const plantType = gameState.gardenGrid[tileIndex].type;
    
    // Refund the full price of the plant
    if (plantType && plantTypes[plantType]) {
        const refundAmount = plantTypes[plantType].price;
        gameState.points += refundAmount;
        
        // Show notification about the refund if it's not a free item
        if (refundAmount > 0) {
            showNotification(`Removed ${plantTypes[plantType].name} and refunded ${formatNumber(refundAmount)} points.`);
        }
    }
    
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
        playerPreferences.mutedMusic = !playerPreferences.mutedMusic;
        muteMusic.textContent = playerPreferences.mutedMusic ? 'Unmute Music' : 'Mute Music';
        playSFX('click');
        savePreferences();
    });
    
    muteSFX.addEventListener('click', () => {
        playerPreferences.mutedSFX = !playerPreferences.mutedSFX;
        muteSFX.textContent = playerPreferences.mutedSFX ? 'Unmute SFX' : 'Mute SFX';
        
        // Play a click sound if we're unmuting
        if (!playerPreferences.mutedSFX) {
            playSFX('click');
        }
        savePreferences();
    });
    
    // Re-implement delete save with a direct approach
    if (deleteSave) {
        // Remove any existing listeners (in case of duplicates)
        deleteSave.replaceWith(deleteSave.cloneNode(true));
        // Get the fresh reference
        const freshDeleteSave = document.getElementById('delete-save');
        
        freshDeleteSave.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete your save and start over? Your preferences (dark mode, sound settings) will be kept.')) {
                console.log('Deleting save...');
                localStorage.removeItem('gardenGameSave');
                playSFX('click');
                
                // Reset game state entirely using the default state
                gameState = {
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
                        market: false,
                        billboard: false
                    },
                    lastSave: Date.now(),
                    isDragging: false,
                    isRemoving: false
                };
                
                // Force full refresh
                window.location.reload();
            } else {
                playSFX('click');
            }
        });
    }
    
    // Theme toggle button
    themeToggle.addEventListener('click', () => {
        playerPreferences.darkMode = !playerPreferences.darkMode;
        applyTheme();
        playSFX('click');
        savePreferences();
    });
    
    // Image type toggle button
    const imageToggle = document.getElementById('image-toggle');
    if (imageToggle) {
        imageToggle.addEventListener('click', () => {
            playerPreferences.usePixelArt = !playerPreferences.usePixelArt;
            applyImageType();
            playSFX('click');
            savePreferences();
        });
        
        // Tooltip for image toggle
        imageToggle.addEventListener('mouseenter', () => {
            showTooltip(
                "Image Type",
                playerPreferences.usePixelArt ? 
                    "Currently using Pixel Art (PNG). Click to switch to SVG." : 
                    "Currently using SVG. Click to switch to Pixel Art (PNG).",
                null,
                imageToggle
            );
        });
        
        imageToggle.addEventListener('mouseleave', () => {
            hideTooltip();
        });
    }
    
    // Theme toggle tooltip
    themeToggle.addEventListener('mouseenter', () => {
        showTooltip(
            "Theme",
            playerPreferences.darkMode ? 
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
            • <b>Click an item</b> in the menu to select it<br>
            • <b>Click a garden tile</b> to place the selected item<br>
            • <b>Right-click</b> to remove an item<br>
            • <b>Shift + drag</b> (left click) to place multiple items<br>
            • <b>Hover over special items</b> to collect resources
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
        try {
            const loadedState = JSON.parse(savedGame);
            
            // Apply loaded state to game state
            gameState = loadedState;
            
            // Ensure we have all the necessary properties
            if (!gameState.gardenGrid) gameState.gardenGrid = Array(25).fill(null);
            if (!gameState.unlocked) {
                gameState.unlocked = {
                    limeBush: true,
                    limeTree: false,
                    pond: false,
                    basket: false,
                    market: false,
                    billboard: false
                };
            }
            
            // Make sure limeBush is always unlocked
            gameState.unlocked.limeBush = true;
            
            // Update lastSave
            gameState.lastSave = Date.now();
        } catch (e) {
            console.error("Error loading save:", e);
            gameState = JSON.parse(JSON.stringify(defaultGameState));
        }
    } else {
        // Start a new game using the default state
        gameState = JSON.parse(JSON.stringify(defaultGameState));
        gameState.lastSave = Date.now();
    }
}

// Load preferences
function loadPreferences() {
    const savedPreferences = localStorage.getItem('gardenGamePreferences');
    if (savedPreferences) {
        playerPreferences = JSON.parse(savedPreferences);
    }
}

// Save preferences
function savePreferences() {
    localStorage.setItem('gardenGamePreferences', JSON.stringify(playerPreferences));
}

// Create the seed menu
function createSeedMenu() {
    seedGrid.innerHTML = '';
    
    // Determine the next item to unlock for tooltip hint
    let nextItemToUnlock = null;
    let lowestUnlockPoints = Infinity;
    
    for (const plantId in plantTypes) {
        if (!gameState.unlocked[plantId]) {
            const unlockPoints = plantTypes[plantId].price;
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
                    `Required: ${formatNumber(plant.price)} points`,
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