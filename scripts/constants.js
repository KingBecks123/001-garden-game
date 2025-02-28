const itemTypes = {
    limeBush: {
        id: 'limeBush',
        name: 'Lime Bush',
        description: 'Earn 1 point / second.',
        flavorText: 'Limes are the foundation of an empire, their juices the ichor of Power herself',
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
        description: 'Trees are big bushes which earn 3 points / second.',
        flavorText: 'They say limes grow on trees. Experiment with this theory',
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
        flavorText: 'Water flows from ground to lime, from lime to sky, from sky to ground. Pretty cool',
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
        flavorText: 'Don\'t put all your limes in one basket, UNLESS that basket has been strategically placed next to multiple trees',
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
        description: 'Increases the points per lime of adjacent baskets by 1.',
        flavorText: 'I guess we\'re selling limes now',
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
        description: 'When placed in the same row or column as a market, increases that market\'s basket boost by 1.',
        flavorText: 'Advertisements, can\'t have a peaceful garden without \'em! Right?',
        price: 20000,
        basePointsPerSecond: 0,
        imagePNG: 'images/PNGs/billboard.png',
        imageSVG: 'images/SVGs/billboard.svg',
        get image() {
            return playerPreferences.usePixelArt ? this.imagePNG : this.imageSVG;
        }
    }
};

const upgradeTypes = {
    // To be added later
};

const soundEffects = {
    click: new Audio('sfx/click.mp3'),
    remove: new Audio('sfx/remove.mp3'),
    basketFull: new Audio('sfx/basket_full.mp3')
};

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