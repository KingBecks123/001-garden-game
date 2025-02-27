// Game state
let gameState = {
    points: 0,
    selectedSeed: null,
    plants: [],
    gardenGrid: Array(25).fill(null),
    unlocked: {
        limeBush: true,
        limeTree: false,
        pond: false
    },
    lastSave: Date.now(),
    settings: {
        mutedMusic: false,
        mutedSFX: false
    }
};

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

// Initialize the game
function initGame() {
    loadGame();
    createGardenGrid();
    createSeedMenu();
    createUpgradeMenu();
    updateUI();
    setupEventListeners();
    
    // Start the game loop
    setInterval(gameLoop, 1000);
    
    // Save the game every 2 seconds
    setInterval(saveGame, 2000);
}

// Game loop - runs every second
function gameLoop() {
    calculatePointsPerSecond();
    updateUI();
    checkUnlocks();
}

// Calculate points earned per second
function calculatePointsPerSecond() {
    let pointsPerSecond = 0;
    
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
            }
            
            // Add this plant's contribution
            pointsPerSecond += plantPoints;
        }
    }
    
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
    
    // Only refresh the seed menu if something was unlocked
    if (unlockHappened) {
        createSeedMenu();
        
        // Show notification for newly unlocked plants
        newlyUnlocked.forEach(plantName => {
            showNotification(`New seed unlocked: ${plantName}!`);
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
            
            tile.appendChild(plantImg);
        }
        
        // Add event listeners for placing plants
        tile.addEventListener('click', () => handleTileClick(i));
        tile.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleTileRightClick(i);
        });
        
        // Hover events for showing information
        tile.addEventListener('mouseenter', () => {
            if (gameState.gardenGrid[i]) {
                const plant = gameState.gardenGrid[i];
                const plantType = plantTypes[plant.type];
                
                showTooltip(
                    plantType.name,
                    plantType.description,
                    null,
                    tile
                );
            }
        });
        
        tile.addEventListener('mouseleave', () => {
            hideTooltip();
        });
        
        gardenGrid.appendChild(tile);
    }
}

// Create the seed menu
function createSeedMenu() {
    seedGrid.innerHTML = '';
    
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
        
        // Hover events for showing information (only for unlocked seeds)
        if (isUnlocked) {
            seedItem.addEventListener('mouseenter', () => {
                showTooltip(
                    plant.name,
                    plant.description,
                    `Price: ${plant.price} points`,
                    seedItem
                );
            });
            
            seedItem.addEventListener('mouseleave', () => {
                hideTooltip();
            });
        }
        
        seedGrid.appendChild(seedItem);
    }
}

// Create the upgrade menu (placeholder for now)
function createUpgradeMenu() {
    upgradesGrid.innerHTML = '';
    // We'll implement this later
}

// Handle clicking on a garden tile
function handleTileClick(tileIndex) {
    // Check if we have a selected seed
    if (!gameState.selectedSeed) return;
    
    // Check if the tile is already occupied
    if (gameState.gardenGrid[tileIndex]) return;
    
    const selectedPlant = plantTypes[gameState.selectedSeed];
    
    // Check if we can afford the plant
    if (gameState.points < selectedPlant.price) return;
    
    // Place the plant
    gameState.points -= selectedPlant.price;
    gameState.gardenGrid[tileIndex] = {
        type: gameState.selectedSeed,
        plantedAt: Date.now()
    };
    
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
    pointsDisplay.textContent = Math.floor(gameState.points);
    
    // Update seed menu affordability
    createSeedMenu();
}

// Setup event listeners for settings
function setupEventListeners() {
    muteMusic.addEventListener('click', () => {
        gameState.settings.mutedMusic = !gameState.settings.mutedMusic;
        muteMusic.textContent = gameState.settings.mutedMusic ? 'Unmute Music' : 'Mute Music';
    });
    
    muteSFX.addEventListener('click', () => {
        gameState.settings.mutedSFX = !gameState.settings.mutedSFX;
        muteSFX.textContent = gameState.settings.mutedSFX ? 'Unmute SFX' : 'Mute SFX';
    });
    
    deleteSave.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete your save and start over?')) {
            localStorage.removeItem('gardenGameSave');
            location.reload();
        }
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

// Start the game when the page loads
window.addEventListener('load', initGame); 