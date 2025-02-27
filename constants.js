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

// Sound effects
const soundEffects = {
    click: new Audio('sfx/click.mp3'),
    remove: new Audio('sfx/remove.mp3'),
    basketFull: new Audio('sfx/basket_full.mp3')
};

// Default game state structure - used for new games and resets
const defaultGameState = {
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