// Game state
let players = [];
let rounds = [];
let currentBids = {};
let currentScored = {};
let cumulativeExtraHands = {};
let currentDealerIndex = 0;
let maxCards = '';
let gameStarted = false;

const SUITS = [
    { name: 'Spades', symbol: '♠️' },
    { name: 'Diamonds', symbol: '♦️' },
    { name: 'Clubs', symbol: '♣️' },
    { name: 'Hearts', symbol: '♥️' }
];

// DOM Elements
const setupForm = document.getElementById('setupForm');
const gameInterface = document.getElementById('gameInterface');
const maxCardsInput = document.getElementById('maxCards');
const newPlayerInput = document.getElementById('newPlayer');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const startGameBtn = document.getElementById('startGameBtn');
const resetBtn = document.getElementById('resetBtn');
const playersList = document.getElementById('playersList');
const submitRoundBtn = document.getElementById('submitRoundBtn');
const scoreHistory = document.getElementById('scoreHistory');
const winnerModal = document.getElementById('winnerModal');

// Helper Functions
const calculateTotalRounds = () => maxCards ? (parseInt(maxCards) * 2) - 1 : 0;

const getCardsForRound = (roundIndex) => {
    const max = parseInt(maxCards);
    if (roundIndex < max) {
        return roundIndex + 1;
    } else if (roundIndex === max - 1) {
        return max;
    } else {
        return max - (roundIndex - (max - 1));
    }
};

const getCurrentSuit = () => SUITS[rounds.length % SUITS.length];

const getCurrentDealer = () => players[currentDealerIndex];

const getTotalScore = (player) => {
    return rounds.reduce((total, round) => total + (round[player] || 0), 0);
};

const updateGameInfo = () => {
    document.getElementById('currentRound').textContent = `${rounds.length + 1} of ${calculateTotalRounds()}`;
    document.getElementById('cardsDealt').textContent = getCardsForRound(rounds.length);
    const currentSuit = getCurrentSuit();
    document.getElementById('trumpSuit').textContent = `${currentSuit.symbol} ${currentSuit.name}`;
    document.getElementById('currentDealer').textContent = getCurrentDealer();
};

const calculateScore = (player, originalBid, scoredBid) => {
    const bid = parseInt(originalBid) || 0;
    const scored = parseInt(scoredBid) || 0;
    const currentExtraHands = parseInt(cumulativeExtraHands[player]) || 0;

    if (scored < bid) {
        return {
            score: -bid * 10,
            extraHands: currentExtraHands
        };
    }
	
	//Rupesh
	if (scored == 0 && bid == 0) {
        return {
            score: 10,
            extraHands: currentExtraHands
        };
    }

    const extraHands = Math.max(0, scored - bid);
    const newTotalExtraHands = currentExtraHands + extraHands;
    const penaltyCount = Math.floor(newTotalExtraHands / 10);
    const remainingExtraHands = newTotalExtraHands % 10;
    
    return {
        score: (bid * 10) + extraHands - (penaltyCount * 100),
        extraHands: remainingExtraHands
    };
};

const determineWinner = () => {
    let maxScore = -Infinity;
    let winningPlayer = null;
    
    players.forEach(player => {
        const totalScore = getTotalScore(player);
        if (totalScore > maxScore) {
            maxScore = totalScore;
            winningPlayer = player;
        }
    });
    
    return { player: winningPlayer, score: maxScore };
};

const showWinnerModal = (winner, score) => {
    document.getElementById('winnerName').textContent = `${winner} Wins!`;
    document.getElementById('winnerScore').textContent = `Total Score: ${score}`;
    winnerModal.style.display = 'block';
};

const closeWinnerModal = () => {
    winnerModal.style.display = 'none';
};

const updateScoreHistory = () => {
    if (rounds.length === 0) {
        scoreHistory.style.display = 'none';
        return;
    }

    scoreHistory.style.display = 'block';
    const playerColumns = document.getElementById('playerColumns');
    //playerColumns.innerHTML = players.map(player => `<th>${player}</th>`).join('');
	
	pcols = players.map(player => `<th>${player}</th>`).join('');
	playerColumns.innerHTML = '<tr><th>Round</th><th>Cards</th><th>Trump</th><th>Dealer</th>' +  pcols + '</tr>';

    const tbody = document.getElementById('scoreTableBody');
    tbody.innerHTML = rounds.map((round, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${getCardsForRound(index)}</td>
            <td>${SUITS[index % SUITS.length].symbol}</td>
            <td>${players[index % players.length]}</td>
            ${players.map(player => `<td>${round[player] || 0}</td>`).join('')}
        </tr>
    `).join('') + `
        <tr class="total-row">
            <td>Total</td>
            <td></td>
            <td></td>
            <td></td>
            ${players.map(player => `<td>${getTotalScore(player)}</td>`).join('')}
        </tr>
    `;
};

// Event Handlers
const resetGame = () => {
    players = [];
    rounds = [];
    currentBids = {};
    currentScored = {};
    cumulativeExtraHands = {};
    currentDealerIndex = 0;
    maxCards = '';
    gameStarted = false;
    
    setupForm.style.display = 'block';
    gameInterface.style.display = 'none';
    resetBtn.style.display = 'none';
    scoreHistory.style.display = 'none';
    maxCardsInput.value = '';
    newPlayerInput.value = '';
    playersList.innerHTML = '';
    updateStartButtonState();
};

const addPlayer = () => {
    const playerName = newPlayerInput.value.trim();
    if (playerName && !players.includes(playerName)) {
        players.push(playerName);
        cumulativeExtraHands[playerName] = 0;
        newPlayerInput.value = '';
        updatePlayersList();
        updateStartButtonState();
    }
};

const removePlayer = (playerToRemove) => {
    players = players.filter(player => player !== playerToRemove);
    delete cumulativeExtraHands[playerToRemove];
    updatePlayersList();
    updateStartButtonState();
};

const updatePlayersList = () => {
    playersList.innerHTML = players.map(player => `
        <div class="player-tag">
            ${player}
            <button class="remove-player" onclick="removePlayer('${player}')">✕</button>
        </div>
    `).join('');
};

const updateStartButtonState = () => {
    const maxCardsValue = maxCardsInput.value.trim();
    startGameBtn.disabled = !maxCardsValue || players.length < 2;
};

const updatePlayersGrid = () => {
    const playersGrid = document.getElementById('playersGrid');
    playersGrid.innerHTML = players.map(player => `
        <div class="player-card">
            <h3>${player}</h3>
            <div class="bid-inputs">
                <input type="number" min="0" placeholder="Bid" 
                    onchange="handleBidChange('${player}', this.value)" 
                    value="${currentBids[player] || ''}"
                />
                <input type="number" min="0" placeholder="Scored" 
                    onchange="handleScoredChange('${player}', this.value)"
                    value="${currentScored[player] || ''}"
                />
            </div>
            <div class="score-info">
                <div>Total Score: ${getTotalScore(player)}</div>
                <div>Accumulated Extra Hands: ${cumulativeExtraHands[player] || 0}</div>
            </div>
        </div>
    `).join('');
};

const handleBidChange = (player, value) => {
    currentBids[player] = value === '' ? null : parseInt(value);
    checkSubmitButtonState();
};

const handleScoredChange = (player, value) => {
    currentScored[player] = value === '' ? null : parseInt(value);
    checkSubmitButtonState();
};

const check_bid_valid = () => {
	const total_current_bid = Object.values(currentBids).reduce((acc, val) => acc + val, 0);
	const total_scored_bid = Object.values(currentScored).reduce((acc, val) => acc + val, 0);
}

const checkSubmitButtonState = () => {
    submitRoundBtn.disabled = !players.every(player => 
        currentBids[player] !== null && 
        currentBids[player] !== undefined && 
        currentScored[player] !== null && 
        currentScored[player] !== undefined
    );
};

const startNewGame = () => {
    maxCards = maxCardsInput.value;
    if (!maxCards || players.length < 2) return;
    
    gameStarted = true;
    setupForm.style.display = 'none';
    gameInterface.style.display = 'block';
    resetBtn.style.display = 'block';
    updateGameInfo();
    updatePlayersGrid();
};

const submitRound = () => {
    if (!gameStarted) return;
    
    const allBidsValid = players.every(player => 
        currentBids[player] !== null && 
        currentBids[player] !== undefined && 
        currentScored[player] !== null && 
        currentScored[player] !== undefined
    );

    if (!allBidsValid) return;

    const roundScores = {};

    players.forEach(player => {
        const result = calculateScore(
            player,
            currentBids[player],
            currentScored[player]
        );
        
        roundScores[player] = result.score;
        cumulativeExtraHands[player] = result.extraHands;
    });

    rounds.push(roundScores);
    currentBids = {};
    currentScored = {};
    currentDealerIndex = (currentDealerIndex + 1) % players.length;

    if (rounds.length === calculateTotalRounds()) {
        const { player, score } = determineWinner();
        showWinnerModal(player, score);
    } else {
        updateGameInfo();
        updatePlayersGrid();
    }
    
    updateScoreHistory();
};

// Event Listeners
window.addEventListener('load', () => {
    addPlayerBtn.addEventListener('click', addPlayer);
    startGameBtn.addEventListener('click', startNewGame);
    resetBtn.addEventListener('click', resetGame);
    submitRoundBtn.addEventListener('click', submitRound);
    maxCardsInput.addEventListener('input', updateStartButtonState);
    newPlayerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
});