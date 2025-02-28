// Plant definitions
const plantTypes = {
    limeBush: {
        id: 'limeBush',
        name: 'Lime Bush',
        description: 'Earn 1 point / second from falling limmes :)',
        price: 0,
        basePointsPerSecond: 1,
        imagePNG: 'images/PNGs/lime-bush.png',
        imageSVG: 'images/SVGs/lime-bush.svg',
        get image() {
            return playerPreferences.usePixelArt ? this.imagePNG : this.imageSVG;
        }
    },
    limeTree: {
        id: 'limeTree',
        name: 'Lime Tree',
        description: 'Earns 3 points / second. Trees are just big bushes.',
        price: 100,
        basePointsPerSecond: 3,
        imagePNG: 'images/PNGs/lime-tree.png',
        imageSVG: 'images/SVGs/lime-tree.svg',
        get image() {
            return playerPreferences.usePixelArt ? this.imagePNG : this.imageSVG;
        }
    },
    pond: {
        id: 'pond',
        name: 'Pond',
        description: 'When placed next to a lime plant, that plant produces +1 point / second. Hydrate your plants!',
        price: 1000,
        basePointsPerSecond: 0,
        imagePNG: 'images/PNGs/pond.png',
        imageSVG: 'images/SVGs/pond.svg',
        get image() {
            return playerPreferences.usePixelArt ? this.imagePNG : this.imageSVG;
        }
    },
    basket: {
        id: 'basket',
        name: 'Basket',
        description: 'Collects 1 lime / second for each adjacent tree. Hover over to collect all limes. Each lime gives +5 points. Maximum of 100 limes.',
        price: 5000,
        basePointsPerSecond: 0,
        maxLimes: 100,
        imagePNG: 'images/PNGs/basket.png',
        imageSVG: 'images/SVGs/basket.svg',
        get image() {
            return playerPreferences.usePixelArt ? this.imagePNG : this.imageSVG;
        }
    },
    market: {
        id: 'market',
        name: 'Market',
        description: 'Increases the points per lime of adjacent baskets by 1. Markets are just big baskets.',
        price: 10000,
        basePointsPerSecond: 0,
        imagePNG: 'images/PNGs/market.png',
        imageSVG: 'images/SVGs/market.svg',
        get image() {
            return playerPreferences.usePixelArt ? this.imagePNG : this.imageSVG;
        }
    },
    billboard: {
        id: 'billboard',
        name: 'Billboard',
        description: 'When placed in the same row or column as a market, increases that market\'s basket boost by 1. Capitalism is just big markets.',
        price: 20000,
        basePointsPerSecond: 0,
        imagePNG: 'images/PNGs/billboard.png',
        imageSVG: 'images/SVGs/billboard.svg',
        get image() {
            return playerPreferences.usePixelArt ? this.imagePNG : this.imageSVG;
        }
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
        market: false,
        billboard: false
    },
    lastSave: Date.now(),
    isDragging: false,
    isRemoving: false
}; 