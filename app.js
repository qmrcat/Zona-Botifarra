// ==================== CONFIGURACIÓ DEL JOC ====================
        const SUITS = ['oros', 'copes', 'espases', 'bastos'];
        const SUIT_ICONS = {
            'oros': '🪙',
            'copes': '🏆',
            'espases': '⚔️',
            'bastos': '🌿'
        };
        const SUIT_NAMES = {
            'oros': 'Oros',
            'copes': 'Copes',
            'espases': 'Espases',
            'bastos': 'Bastos',
            'botifarra': 'Botifarra'
        };

        // Valors de les cartes (de més a menys valor)
        const CARD_ORDER = [9, 1, 12, 11, 10, 8, 7, 6, 5, 4, 3, 2];
        const CARD_POINTS = {
            9: 5,   // Manilla
            1: 4,   // As
            12: 3,  // Rei
            11: 2,  // Cavall
            10: 1,  // Sota
            8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0
        };
        const CARD_NAMES = {
            1: 'As', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
            9: 'Manilla', 10: 'Sota', 11: 'Cavall', 12: 'Rei'
        };
        const CARD_NAMES_MINI = {
            1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
            9: 'M', 10: 'S', 11: 'C', 12: 'R'
        };

        // Jugadors: south (humà), west, north (company), east
        const PLAYERS = ['south', 'north', 'west', 'east'];
        
        // Llista de noms per als bots (pots afegir-ne o modificar-los)
        const BOT_NAMES = [
            'Jordi', 'Montse', 'Pere', 'Marta', 'Joan', 'Núria',
            'Oriol', 'Carla', 'Marc', 'Laia', 'Pau', 'Anna',
            'Quim', 'Rosa', 'Sergi', 'Teresa', 'Arnau', 'Gemma',
            'Ferran', 'Sílvia', 'Ramon', 'Mercè', 'Xavier', 'Eulàlia',
            'Bernat', 'Mariona', 'Enric', 'Clàudia', 'Martí', 'Berta',
            'Oupman', 'Pol', 'Roger', 'Alex', 'Francesc', 'Mercè', 'Jaume',
            'Xavier', 'Isa','Laura','Isaac','Didac', 'Miquel', 'Cristina',
            'Amalric ', 'Berenguer', 'Ermessenda', 'Constança', 'Hug', 'Guerau',
            'Sibil·la', 'Lluc', 'Agnès', 'Adelaida', 
        ];
        
        // Noms dels jugadors (es modifica dinàmicament)
        let PLAYER_NAMES = {
            'south': 'Tu',
            'north': 'Company',
            'west': 'Oponent 1',
            'east': 'Oponent 2'
        };
        
        // Funció per assignar noms aleatoris als bots
        function assignRandomBotNames() {
            // Filtrar noms que coincideixin amb el del jugador humà (ignorant majúscules/minúscules)
            const humanName = PLAYER_NAMES.south.toLowerCase().trim();
            const availableNames = BOT_NAMES.filter(name => name.toLowerCase().trim() !== humanName);
            
            // Barrejar els noms disponibles
            const shuffledNames = [...availableNames].sort(() => Math.random() - 0.5);
            
            PLAYER_NAMES.north = shuffledNames[0];
            PLAYER_NAMES.west = shuffledNames[1];
            PLAYER_NAMES.east = shuffledNames[2];
        }

        // ==================== ESTAT DEL JOC ====================
        let handsHistory = [];
        
        let gameState = {
            hands: { south: [], north: [], west: [], east: [] },
            scores: { ns: 0, ew: 0 },  // north-south vs east-west
            dealer: 'south',
            currentPlayer: 'east',  // El primer a jugar és a la dreta del que reparteix
            trump: null,
            isBotifarra: false,
            multiplier: 1,
            currentTrick: [],
            trickLeadSuit: null,
            tricksWon: { ns: [], ew: [] },
            tricksWonBy: { south: [], north: [], west: [], east: [] },  // Bases guanyades per jugador
            lastTrickBy: { south: null, north: null, west: null, east: null },  // Última basa de cada jugador
            trumpChooser: null,
            trumpDelegated: false,
            phase: 'dealing',  // dealing, trump-selection, contro, playing, scoring
            controPhase: null,  // null, 'contro', 'recontro', 'santvicenc'
            controTeam: null,
            waitingForContro: false,
            trickHistory: [],  // Historial de tirades de la mà actual
        };

        // ==================== UTILITATS ====================
        function shuffle(array) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        function getTeam(player) {
            return (player === 'south' || player === 'north') ? 'ns' : 'ew';
        }

        function getPartner(player) {
            const partners = { 'south': 'north', 'north': 'south', 'east': 'west', 'west': 'east' };
            return partners[player];
        }

        function getNextPlayer(player) {
            // Sentit antihorari: south -> east -> north -> west -> south
            const order = ['south', 'east', 'north', 'west'];
            const idx = order.indexOf(player);
            return order[(idx + 1) % 4];
        }

        function getCardStrength(card) {
            return CARD_ORDER.indexOf(card.value);
        }

        function compareCards(card1, card2, leadSuit, trump) {
            // Retorna true si card1 guanya a card2
            const isTrump1 = trump && card1.suit === trump;
            const isTrump2 = trump && card2.suit === trump;
            
            if (isTrump1 && !isTrump2) return true;
            if (!isTrump1 && isTrump2) return false;
            
            // Ambdues són triomf o cap ho és
            if (isTrump1 && isTrump2) {
                return getCardStrength(card1) < getCardStrength(card2);
            }
            
            // Cap és triomf
            const isLead1 = card1.suit === leadSuit;
            const isLead2 = card2.suit === leadSuit;
            
            if (isLead1 && !isLead2) return true;
            if (!isLead1 && isLead2) return false;
            
            // Ambdues són del pal de sortida o cap ho és
            if (isLead1 && isLead2) {
                return getCardStrength(card1) < getCardStrength(card2);
            }
            
            return false;  // Si cap és del pal de sortida, la primera guanya
        }

        function findWinningCard(trick, leadSuit, trump) {
            let winner = trick[0];
            for (let i = 1; i < trick.length; i++) {
                if (compareCards(trick[i], winner, leadSuit, trump)) {
                    winner = trick[i];
                }
            }
            return winner;
        }

        function calculateTrickPoints(trick) {
            let points = 1;  // 1 punt per basa
            for (const card of trick) {
                points += CARD_POINTS[card.value];
            }
            return points;
        }

        // ==================== INTERFÍCIE ====================
        function log(message, important = false) {
            const logDiv = document.getElementById('game-log');
            const entry = document.createElement('div');
            entry.className = 'log-entry' + (important ? ' important' : '');
            entry.textContent = message;
            logDiv.insertBefore(entry, logDiv.firstChild);
            if (logDiv.children.length > 50) {
                logDiv.removeChild(logDiv.lastChild);
            }
        }

        function showMessage(title, text, duration = 2000) {
            const msgArea = document.getElementById('message-area');
            document.getElementById('message-title').textContent = title;
            document.getElementById('message-text').textContent = text;
            msgArea.style.display = 'block';
            
            if (duration > 0) {
                setTimeout(() => {
                    msgArea.style.display = 'none';
                }, duration);
            }
        }

        function hideMessage() {
            document.getElementById('message-area').style.display = 'none';
        }

        function updateScoreboard() {
            document.getElementById('score-ns').textContent = gameState.scores.ns;
            document.getElementById('score-ew').textContent = gameState.scores.ew;
        }

        function updateTrumpDisplay() {
            const suitEl = document.getElementById('trump-suit');
            const nameEl = document.getElementById('trump-name');
            
            if (gameState.trump) {
                suitEl.textContent = SUIT_ICONS[gameState.trump];
                nameEl.textContent = SUIT_NAMES[gameState.trump];
            } else if (gameState.isBotifarra) {
                suitEl.textContent = '🎉';
                nameEl.textContent = 'Botifarra';
            } else {
                suitEl.textContent = '-';
                nameEl.textContent = '-';
            }
        }

        function updateMultiplierDisplay() {
            document.getElementById('multiplier-value').textContent = '×' + gameState.multiplier;
        }

        function updatePlayerActive() {
            PLAYERS.forEach(p => {
                const nameEl = document.getElementById(`name-${p}`);
                nameEl.classList.remove('active');
                nameEl.classList.remove('dealer');
            });
            
            if (gameState.currentPlayer) {
                document.getElementById(`name-${gameState.currentPlayer}`).classList.add('active');
            }
            document.getElementById(`name-${gameState.dealer}`).classList.add('dealer');
        }

        function createCardElement(card, faceUp = true) {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            
            if (faceUp) {
                cardEl.classList.add(card.suit);
                cardEl.innerHTML = `
                    <span class="suit">${SUIT_ICONS[card.suit]}</span>
                    <span class="value">${CARD_NAMES[card.value]}</span>
                `;
                cardEl.dataset.suit = card.suit;
                cardEl.dataset.value = card.value;
            } else {
                cardEl.classList.add('card-back');
            }
            
            return cardEl;
        }

        function renderHands() {
            PLAYERS.forEach(player => {
                const handEl = document.getElementById(`hand-${player}`);
                handEl.innerHTML = '';
                
                const hand = gameState.hands[player];
                const isHuman = player === 'south';
                
                // Ordenar cartes per pal i valor
                const sortedHand = [...hand].sort((a, b) => {
                    if (a.suit !== b.suit) {
                        return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
                    }
                    return getCardStrength(a) - getCardStrength(b);
                });
                
                sortedHand.forEach(card => {
                    const cardEl = createCardElement(card, isHuman);
                    if (isHuman && gameState.phase === 'playing' && gameState.currentPlayer === 'south') {
                        const playable = isCardPlayable(card);
                        if (playable) {
                            cardEl.classList.add('playable');
                            cardEl.addEventListener('click', () => playCard(player, card));
                        }
                    }
                    handEl.appendChild(cardEl);
                });
            });
        }

        function renderPlayArea() {
            PLAYERS.forEach(player => {
                const container = document.getElementById(`played-${player}`);
                container.innerHTML = '';
                
                const playedCard = gameState.currentTrick.find(t => t.player === player);
                if (playedCard) {
                    const cardEl = createCardElement(playedCard);
                    container.appendChild(cardEl);
                }
            });
        }


        function renderWonPiles() {
            PLAYERS.forEach(player => {
                const tricks = gameState.tricksWonBy[player];
                
                // Actualitzar comptador al nom del jugador (per mòbil)
                updatePlayerTricksCount(player, tricks.length);


            });
        }

        function updatePlayerTricksCount(player, count) {
            const nameEl = document.getElementById(`name-${player}`);
            let countEl = nameEl.querySelector('.tricks-count');
            
            if (count === 0) {
                if (countEl) countEl.remove();
                return;
            }
            
            if (!countEl) {
                countEl = document.createElement('span');
                countEl.className = 'tricks-count';
                nameEl.appendChild(countEl);
            }
            
            countEl.textContent = count + (count === 1 ? ' basa' : ' bases');
            
            // Afegir event listener per veure última basa
            countEl.style.cursor = 'pointer';
            countEl.style.paddingLeft = '10px';
            countEl.onclick = (e) => {
                e.stopPropagation();
                showLastTrick(player);
            };
        }

        
        function showLastTrick(player) {
            const lastTrick = gameState.lastTrickBy[player];
            if (!lastTrick) return;
            
            const modal = document.getElementById('last-trick-modal');
            const cardsContainer = document.getElementById('last-trick-cards');
            cardsContainer.innerHTML = '';
            
            // Trobar el guanyador de la basa
            const winningCard = findWinningCard(lastTrick.cards, lastTrick.leadSuit, gameState.trump);
            
            lastTrick.cards.forEach(trickCard => {
                const container = document.createElement('div');
                container.className = 'last-trick-card-container';
                
                const cardEl = createCardElement(trickCard);
                container.appendChild(cardEl);
                
                const label = document.createElement('div');
                label.className = 'player-label';
                
                const isWinner = trickCard.suit === winningCard.suit && trickCard.value === winningCard.value;
                if (isWinner) {
                    label.classList.add('winner');
                    label.textContent = PLAYER_NAMES[trickCard.player] + ' ★';
                } else {
                    label.textContent = PLAYER_NAMES[trickCard.player];
                }
                
                container.appendChild(label);
                cardsContainer.appendChild(container);
            });
            
            modal.style.display = 'flex';
        }

        // ==================== LÒGICA DEL JOC ====================
        function createDeck() {
            const deck = [];
            SUITS.forEach(suit => {
                for (let value = 1; value <= 12; value++) {
                    deck.push({ suit, value });
                }
            });
            return deck;
        }

        function dealCards() {
            const deck = shuffle(createDeck());
            
            // Repartir 12 cartes a cada jugador
            let cardIndex = 0;
            // Començar pel jugador a la dreta del que reparteix
            // let dealTo = getNextPlayer(getNextPlayer(getNextPlayer(gameState.dealer)));
            let dealTo = getNextPlayer(gameState.dealer);
            
            for (let round = 0; round < 3; round++) {  // 3 rondes de 4 cartes
                for (let p = 0; p < 4; p++) {
                    for (let c = 0; c < 4; c++) {
                        gameState.hands[dealTo].push(deck[cardIndex++]);
                    }
                    dealTo = getNextPlayer(dealTo);
                }
            }
            
            log(`${PLAYER_NAMES[gameState.dealer]} reparteix les cartes`);
        }

        function isCardPlayable(card) {
            if (gameState.phase !== 'playing') return false;
            if (gameState.currentTrick.length === 0) return true;  // Primera carta
            
            const hand = gameState.hands['south'];
            const leadSuit = gameState.trickLeadSuit;
            const hasLeadSuit = hand.some(c => c.suit === leadSuit);
            
            // Si tenim el pal de sortida, hem de jugar-lo
            if (hasLeadSuit && card.suit !== leadSuit) return false;
            
            // Comprovar si hem de matar
            const partnerPlayed = gameState.currentTrick.find(t => t.player === 'north');
            const winningCard = findWinningCard(gameState.currentTrick, leadSuit, gameState.trump);
            const partnerIsWinning = partnerPlayed && 
                winningCard.suit === partnerPlayed.suit && 
                winningCard.value === partnerPlayed.value;
            
            if (partnerIsWinning) {
                // La basa va del company, no cal matar
                return true;
            }
            
            // La basa no va del company, hem de matar si podem
            if (hasLeadSuit) {
                // Tenim el pal de sortida
                const canBeat = hand.filter(c => c.suit === leadSuit)
                    .some(c => compareCards(c, winningCard, leadSuit, gameState.trump));
                if (canBeat) {
                    // Hem de jugar una carta que mati
                    return card.suit === leadSuit && 
                           compareCards(card, winningCard, leadSuit, gameState.trump);
                }
                return card.suit === leadSuit;
            } else {
                // No tenim el pal de sortida
                const canBeatWithTrump = gameState.trump && 
                    hand.some(c => c.suit === gameState.trump && 
                        compareCards(c, winningCard, leadSuit, gameState.trump));
                
                if (canBeatWithTrump) {
                    // Hem de jugar triomf que mati
                    if (card.suit !== gameState.trump) return false;
                    return compareCards(card, winningCard, leadSuit, gameState.trump);
                }
                // No podem matar, podem jugar qualsevol
                return true;
            }
        }

        function getPlayableCards(player) {
            const hand = gameState.hands[player];
            if (gameState.currentTrick.length === 0) return [...hand];
            
            const leadSuit = gameState.trickLeadSuit;
            const hasLeadSuit = hand.some(c => c.suit === leadSuit);
            
            // Trobar la carta guanyadora actual
            const winningCard = findWinningCard(gameState.currentTrick, leadSuit, gameState.trump);
            const partner = getPartner(player);
            const partnerPlayed = gameState.currentTrick.find(t => t.player === partner);
            const partnerIsWinning = partnerPlayed && 
                winningCard.suit === partnerPlayed.suit && 
                winningCard.value === partnerPlayed.value;
            
            if (partnerIsWinning) {
                // La basa va del company
                if (hasLeadSuit) {
                    return hand.filter(c => c.suit === leadSuit);
                }
                return [...hand];
            }
            
            // La basa no va del company
            if (hasLeadSuit) {
                const cardsOfLeadSuit = hand.filter(c => c.suit === leadSuit);
                const beatingCards = cardsOfLeadSuit.filter(c => 
                    compareCards(c, winningCard, leadSuit, gameState.trump));
                return beatingCards.length > 0 ? beatingCards : cardsOfLeadSuit;
            }
            
            // No tenim el pal de sortida
            if (gameState.trump) {
                const trumpCards = hand.filter(c => c.suit === gameState.trump);
                const beatingTrumps = trumpCards.filter(c => 
                    compareCards(c, winningCard, leadSuit, gameState.trump));
                if (beatingTrumps.length > 0) return beatingTrumps;
            }
            
            return [...hand];
        }

        // ==================== IA DELS BOTS ====================
        function evaluateHand(hand, trump) {
            let strength = 0;
            const suitCounts = {};
            const suitStrength = {};
            
            SUITS.forEach(s => {
                suitCounts[s] = 0;
                suitStrength[s] = 0;
            });
            
            hand.forEach(card => {
                suitCounts[card.suit]++;
                const cardStrength = CARD_ORDER.length - getCardStrength(card);
                suitStrength[card.suit] += cardStrength;
                strength += cardStrength;
                
                // Bonus per cartes de valor
                strength += CARD_POINTS[card.value] * 2;
                
                // Bonus per triomf
                if (trump && card.suit === trump) {
                    strength += cardStrength * 0.5;
                }
            });
            
            return { strength, suitCounts, suitStrength };
        }

        function botChooseTrump(player) {
            const hand = gameState.hands[player];
            const eval_ = evaluateHand(hand, null);
            
            // Trobar el millor pal
            let bestSuit = null;
            let bestScore = -1;
            
            SUITS.forEach(suit => {
                const count = eval_.suitCounts[suit];
                const strength = eval_.suitStrength[suit];
                // Preferim pals amb moltes cartes i fortes
                const score = count * 10 + strength;
                if (score > bestScore) {
                    bestScore = score;
                    bestSuit = suit;
                }
            });
            
            // Decidir si fer botifarra (si la mà és molt equilibrada i forta)
            const avgStrength = eval_.strength / 12;
            const variance = SUITS.reduce((acc, s) => {
                return acc + Math.pow(eval_.suitCounts[s] - 3, 2);
            }, 0);
            
            if (variance < 2 && avgStrength > 5) {
                // Mà equilibrada i forta, considerar botifarra
                if (Math.random() < 0.3) {
                    return 'botifarra';
                }
            }
            
            return bestSuit;
        }

        function botDecideContro(player) {
            const hand = gameState.hands[player];
            const trump = gameState.trump;
            const eval_ = evaluateHand(hand, trump);
            
            // Comptar triomfs
            let trumpCount = 0;
            let trumpStrength = 0;
            if (trump) {
                hand.forEach(card => {
                    if (card.suit === trump) {
                        trumpCount++;
                        trumpStrength += CARD_ORDER.length - getCardStrength(card);
                    }
                });
            }
            
            // Decidir basat en la força de la mà
            const threshold = gameState.isBotifarra ? 55 : 45;
            
            if (gameState.controPhase === null) {
                // Decidir contro
                // Si tenim pocs triomfs i mà feble, contrar
                if (trump && trumpCount <= 2 && eval_.strength > threshold) {
                    return Math.random() < 0.6;
                }
                if (gameState.isBotifarra && eval_.strength > 60) {
                    return Math.random() < 0.5;
                }
            } else if (gameState.controPhase === 'contro') {
                // Decidir recontro
                if (trump && trumpCount >= 4 && trumpStrength > 15) {
                    return Math.random() < 0.7;
                }
                if (gameState.isBotifarra && eval_.strength > 70) {
                    return Math.random() < 0.4;
                }
            } else if (gameState.controPhase === 'recontro' && !gameState.isBotifarra) {
                // Decidir Sant Vicenç
                if (eval_.strength > 75) {
                    return Math.random() < 0.3;
                }
            }
            
            return false;
        }

        function botPlayCard(player) {
            const playable = getPlayableCards(player);
            if (playable.length === 1) return playable[0];
            
            const hand = gameState.hands[player];
            const trump = gameState.trump;
            const partner = getPartner(player);
            
            // Primera carta de la basa
            if (gameState.currentTrick.length === 0) {
                return botPlayLeadCard(player, playable);
            }
            
            // No és la primera carta
            const leadSuit = gameState.trickLeadSuit;
            const winningCard = findWinningCard(gameState.currentTrick, leadSuit, trump);
            const partnerPlayed = gameState.currentTrick.find(t => t.player === partner);
            const partnerIsWinning = partnerPlayed && 
                winningCard.suit === partnerPlayed.suit && 
                winningCard.value === partnerPlayed.value;
            
            if (partnerIsWinning) {
                // La basa va del company, jugar la carta més baixa possible
                return playable.sort((a, b) => getCardStrength(b) - getCardStrength(a))[0];
            }
            
            // Hem d'intentar guanyar
            const beatingCards = playable.filter(c => 
                compareCards(c, winningCard, leadSuit, trump));
            
            if (beatingCards.length > 0) {
                // Jugar la carta més baixa que guanyi
                if (gameState.currentTrick.length === 3) {
                    // Últim a jugar, guanyar amb la mínima
                    return beatingCards.sort((a, b) => getCardStrength(b) - getCardStrength(a))[0];
                } else {
                    // No som últims, jugar més fort si hi ha punts
                    const trickPoints = calculateTrickPoints(gameState.currentTrick);
                    if (trickPoints > 5) {
                        // Molts punts, assegurar
                        return beatingCards.sort((a, b) => getCardStrength(a) - getCardStrength(b))[0];
                    }
                    return beatingCards.sort((a, b) => getCardStrength(b) - getCardStrength(a))[0];
                }
            }
            
            // No podem guanyar, descartar la pitjor carta
            // Preferim descartar cartes sense punts de pals curts
            const suitCounts = {};
            hand.forEach(c => {
                suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
            });
            
            return playable.sort((a, b) => {
                // Primer per punts (menys punts millor)
                const pointsDiff = CARD_POINTS[a.value] - CARD_POINTS[b.value];
                if (pointsDiff !== 0) return pointsDiff;
                
                // Després per longitud de pal (menys cartes millor per crear curt)
                const suitDiff = (suitCounts[a.suit] || 0) - (suitCounts[b.suit] || 0);
                if (suitDiff !== 0) return suitDiff;
                
                // Finalment per força (més feble millor)
                return getCardStrength(b) - getCardStrength(a);
            })[0];
        }

        function botPlayLeadCard(player, playable) {
            const hand = gameState.hands[player];
            const trump = gameState.trump;
            
            // Comptar cartes per pal
            const suitCounts = {};
            const suitHighCards = {};
            hand.forEach(c => {
                suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
                if (getCardStrength(c) < 3) {  // Manilla, As o Rei
                    suitHighCards[c.suit] = (suitHighCards[c.suit] || 0) + 1;
                }
            });
            
            // Estratègia: sortir pel pal més llarg amb cartes altes
            // o pel triomf si en tenim molts
            
            let bestCard = null;
            let bestScore = -1;
            
            playable.forEach(card => {
                let score = 0;
                const count = suitCounts[card.suit] || 0;
                const highCards = suitHighCards[card.suit] || 0;
                const strength = CARD_ORDER.length - getCardStrength(card);
                
                // Bonus per sortir amb carta alta de pal llarg
                if (strength >= 10 && count >= 3) {
                    score += 20;
                }
                
                // Bonus per triomf si en tenim molts
                if (trump && card.suit === trump && count >= 4) {
                    score += 15;
                }
                
                // Penalització per sortir amb carta alta de pal curt
                if (count <= 2 && strength >= 8) {
                    score -= 10;
                }
                
                // Preferir cartes amb punts si són segures
                if (strength >= 10) {
                    score += CARD_POINTS[card.value];
                }
                
                score += strength;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestCard = card;
                }
            });
            
            return bestCard || playable[0];
        }

        // ==================== FLUX DEL JOC ====================
        async function startGame() {
            // Obtenir el nom del jugador humà
            const playerNameInput = document.getElementById('player-name-input');
            const playerName = playerNameInput.value.trim() || 'Tu';
            PLAYER_NAMES.south = playerName;
            
            // Assignar noms aleatoris als bots
            assignRandomBotNames();
            
            // Actualitzar els noms a la interfície
            updatePlayerNames();
            
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('game-container').style.display = 'block';
            
            // Determinar primer repartidor aleatòriament
            gameState.dealer = PLAYERS[Math.floor(Math.random() * 4)];
            
            await startNewHand();
        }
        
        function updatePlayerNames() {
            document.getElementById('name-south').childNodes[0].textContent = PLAYER_NAMES.south;
            document.getElementById('name-north').childNodes[0].textContent = PLAYER_NAMES.north + ' (Company)';
            document.getElementById('name-west').childNodes[0].textContent = PLAYER_NAMES.west;
            document.getElementById('name-east').childNodes[0].textContent = PLAYER_NAMES.east;
            
            // Actualitzar també el marcador
            const teamNS = PLAYER_NAMES.south + ' i ' + PLAYER_NAMES.north;
            const teamEW = PLAYER_NAMES.east + ' i ' + PLAYER_NAMES.west;
            document.querySelector('#scoreboard .score-team:first-child .score-team-name').textContent = teamNS;
            document.querySelector('#scoreboard .score-team:last-child .score-team-name').textContent = teamEW;
        }

        async function startNewHand() {
            // Reset estat de la mà
            gameState.hands = { south: [], north: [], west: [], east: [] };
            gameState.trump = null;
            gameState.isBotifarra = false;
            gameState.multiplier = 1;
            gameState.currentTrick = [];
            gameState.trickLeadSuit = null;
            gameState.tricksWon = { ns: [], ew: [] };
            gameState.tricksWonBy = { south: [], north: [], west: [], east: [] };
            gameState.lastTrickBy = { south: null, north: null, west: null, east: null };
            gameState.trumpDelegated = false;
            gameState.controPhase = null;
            gameState.controTeam = null;
            gameState.phase = 'dealing';
            gameState.trickHistory = [];
            
            updateTrumpDisplay();
            updateMultiplierDisplay();
            renderPlayArea();
            renderWonPiles();

            // Netejar comptadors de bases dels noms
            PLAYERS.forEach(player => {
                const countEl = document.getElementById(`name-${player}`).querySelector('.tricks-count');
                if (countEl) countEl.remove();
            });
            
            dealCards();
            renderHands();
            
            // Qui escull triomf és qui ha repartit
            gameState.trumpChooser = gameState.dealer;
            gameState.phase = 'trump-selection';
            
            await delay(500);
            await trumpSelectionPhase();
        }


        async function trumpSelectionPhase() {
            const chooser = gameState.trumpChooser;
            
            if (chooser === 'south') {
                // Mostrar panell de selecció
                document.getElementById('trump-selection').style.display = 'flex';
                document.getElementById('btn-delegar').style.display = 
                    gameState.trumpDelegated ? 'none' : 'block';
            } else {
                // Bot escull
                await delay(1000);
                
                if (!gameState.trumpDelegated && Math.random() < 0.3) {
                    // Bot delega al company
                    log(`${PLAYER_NAMES[chooser]} passa al company`);
                    gameState.trumpDelegated = true;
                    gameState.trumpChooser = getPartner(chooser);
                    await trumpSelectionPhase();
                    return;
                }
                
                const choice = botChooseTrump(chooser);
                
                // Gestionar la selecció directament per evitar problemes amb el panell
                if (choice === 'botifarra') {
                    gameState.isBotifarra = true;
                    gameState.trump = null;
                    gameState.multiplier = 2;
                    log(`${PLAYER_NAMES[chooser]} fa BOTIFARRA!`, true);
                } else {
                    gameState.trump = choice;
                    log(`${PLAYER_NAMES[chooser]} fa ${SUIT_NAMES[choice]}`);
                }
                
                updateTrumpDisplay();
                updateMultiplierDisplay();
                
                // Fase de contro
                await controPhase();
            }
        }

        async function selectTrump(choice, player) {
            document.getElementById('trump-selection').style.display = 'none';
            
            if (choice === 'delegar') {
                log(`${PLAYER_NAMES[player]} passa al company`);
                gameState.trumpDelegated = true;
                gameState.trumpChooser = getPartner(player);
                await trumpSelectionPhase();
                return;
            }
            
            if (choice === 'botifarra') {
                gameState.isBotifarra = true;
                gameState.trump = null;
                gameState.multiplier = 2;
                log(`${PLAYER_NAMES[player]} fa BOTIFARRA!`, true);
            } else {
                gameState.trump = choice;
                log(`${PLAYER_NAMES[player]} fa ${SUIT_NAMES[choice]}`);
            }
            
            updateTrumpDisplay();
            updateMultiplierDisplay();
            
            // Fase de contro
            await controPhase();
        }

        async function controPhase() {
            const trumpTeam = getTeam(gameState.trumpChooser);
            const otherTeam = trumpTeam === 'ns' ? 'ew' : 'ns';
            
            // L'equip contrari pot contrar
            gameState.phase = 'contro';
            const controplayers = otherTeam === 'ns' ? ['south', 'north'] : ['east', 'west'];
            
            for (const player of controplayers) {
                if (player === 'south') {
                    // Preguntar a l'humà
                    document.getElementById('contro-title').textContent = 'Vols contrar?';
                    document.getElementById('btn-contro-yes').textContent = 'CONTRO';
                    const decision = await askHumanContro();
                    if (decision) {
                        gameState.controPhase = 'contro';
                        gameState.multiplier *= 2;
                        gameState.controTeam = otherTeam;
                        log(`${PLAYER_NAMES[player]} CONTRA!`, true);
                        updateMultiplierDisplay();
                        await recontroPhase();
                        return;
                    }
                } else {
                    await delay(800);
                    if (botDecideContro(player)) {
                        gameState.controPhase = 'contro';
                        gameState.multiplier *= 2;
                        gameState.controTeam = otherTeam;
                        log(`${PLAYER_NAMES[player]} CONTRA!`, true);
                        updateMultiplierDisplay();
                        await recontroPhase();
                        return;
                    }
                }
            }
            
            // Ningú ha contrat
            log('Cap contro');
            await startPlaying();
        }

        async function recontroPhase() {
            const trumpTeam = getTeam(gameState.trumpChooser);
            const recontroPlayers = trumpTeam === 'ns' ? ['south', 'north'] : ['east', 'west'];
            
            for (const player of recontroPlayers) {
                if (player === 'south') {
                    document.getElementById('contro-title').textContent = 'Vols recontrar?';
                    document.getElementById('btn-contro-yes').textContent = 'RECONTRO';
                    const decision = await askHumanContro();
                    if (decision) {
                        gameState.controPhase = 'recontro';
                        gameState.multiplier *= 2;
                        log(`${PLAYER_NAMES[player]} RECONTRA!`, true);
                        updateMultiplierDisplay();
                        if (!gameState.isBotifarra) {
                            await santVicencPhase();
                        } else {
                            await startPlaying();
                        }
                        return;
                    }
                } else {
                    await delay(800);
                    if (botDecideContro(player)) {
                        gameState.controPhase = 'recontro';
                        gameState.multiplier *= 2;
                        log(`${PLAYER_NAMES[player]} RECONTRA!`, true);
                        updateMultiplierDisplay();
                        if (!gameState.isBotifarra) {
                            await santVicencPhase();
                        } else {
                            await startPlaying();
                        }
                        return;
                    }
                }
            }
            
            log('Cap recontro');
            await startPlaying();
        }

         async function santVicencPhase() {
            const otherTeam = gameState.controTeam;
            const svPlayers = otherTeam === 'ns' ? ['south', 'north'] : ['east', 'west'];
            
            for (const player of svPlayers) {
                if (player === 'south') {
                    document.getElementById('contro-title').textContent = 'Vols fer Sant Vicenç?';
                    document.getElementById('btn-contro-yes').textContent = 'SANT VICENÇ';
                    const decision = await askHumanContro();
                    if (decision) {
                        gameState.controPhase = 'santvicenc';
                        gameState.multiplier = 8;
                        log(`${PLAYER_NAMES[player]} fa SANT VICENÇ!`, true);
                        updateMultiplierDisplay();
                        await startPlaying();
                        return;
                    }
                } else {
                    await delay(800);
                    if (botDecideContro(player)) {
                        gameState.controPhase = 'santvicenc';
                        gameState.multiplier = 8;
                        log(`${PLAYER_NAMES[player]} fa SANT VICENÇ!`, true);
                        updateMultiplierDisplay();
                        await startPlaying();
                        return;
                    }
                }
            }
            
            log('Cap Sant Vicenç');
            await startPlaying();
        }

        function askHumanContro() {
            return new Promise(resolve => {
                document.getElementById('contro-panel').style.display = 'flex';
                
                const yesBtn = document.getElementById('btn-contro-yes');
                const noBtn = document.getElementById('btn-contro-no');
                
                const yesHandler = () => {
                    cleanup();
                    resolve(true);
                };
                
                const noHandler = () => {
                    cleanup();
                    resolve(false);
                };
                
                const cleanup = () => {
                    document.getElementById('contro-panel').style.display = 'none';
                    yesBtn.removeEventListener('click', yesHandler);
                    noBtn.removeEventListener('click', noHandler);
                };
                
                yesBtn.addEventListener('click', yesHandler);
                noBtn.addEventListener('click', noHandler);
            });
        }


        async function startPlaying() {
            gameState.phase = 'playing';
            // El primer a jugar és a la dreta del que ha repartit (sentit antihorari)
            // south -> east -> north -> west -> south
            // Si dealer és south, el primer és east (un salt)
            // Si dealer és east, el primer és north
            // etc.
            gameState.currentPlayer = getNextPlayer(gameState.dealer);
            
            updatePlayerActive();
            renderHands();
            
            await playTricks();
        }

        async function playTricks() {
            while (gameState.hands.south.length > 0) {
                // Si només queda una carta a cada jugador, jugar-les automàticament
                if (gameState.hands.south.length === 1) {
                    await playLastCardsAutomatically();
                    break;
                }
                await playOneTrick();
            }
            
            await endHand();
        }

        async function playLastCardsAutomatically() {
            gameState.currentTrick = [];
            gameState.trickLeadSuit = null;
            
            // showMessage('Última basa', 'Es juguen les cartes automàticament', 1500);
            // await delay(500);
            
            // Jugar les cartes en ordre, començant pel jugador actual
            let player = gameState.currentPlayer;
            for (let i = 0; i < 4; i++) {
                const card = gameState.hands[player][0]; // L'única carta que queda
                await delay(400);
                await playCard(player, card);
                player = getNextPlayer(player);
            }
            
            // Determinar guanyador de la basa
            const winningCard = findWinningCard(gameState.currentTrick, gameState.trickLeadSuit, gameState.trump);
            const winnerEntry = gameState.currentTrick.find(t => 
                t.suit === winningCard.suit && t.value === winningCard.value);
            const winner = winnerEntry.player;
            const winningTeam = getTeam(winner);
            
            const points = calculateTrickPoints(gameState.currentTrick);
            gameState.tricksWon[winningTeam].push(...gameState.currentTrick);
            
            // Guardar la basa per al jugador guanyador
            gameState.tricksWonBy[winner].push(gameState.currentTrick);
            gameState.lastTrickBy[winner] = {
                cards: [...gameState.currentTrick],
                leadSuit: gameState.trickLeadSuit
            };
            
            log(`${PLAYER_NAMES[winner]} guanya l'última basa (${points} punts)`);

            // Guardar la tirada a l'historial
            gameState.trickHistory.push({
                cards: [...gameState.currentTrick],
                leadPlayer: gameState.currentTrick[0].player,
                winner: winner
            });
            
            await delay(1000);
            
            // Netejar zona de joc i actualitzar piles
            gameState.currentTrick = [];
            renderPlayArea();
            renderWonPiles();
        }

        async function playOneTrick() {
            gameState.currentTrick = [];
            gameState.trickLeadSuit = null;
            
            for (let i = 0; i < 4; i++) {
                updatePlayerActive();
                renderHands();
                
                if (gameState.currentPlayer === 'south') {
                    // Esperar que l'humà jugui
                    await waitForHumanPlay();
                } else {
                    // Bot juga
                    await delay(600);
                    const card = botPlayCard(gameState.currentPlayer);
                    await playCard(gameState.currentPlayer, card);
                }
            }
            
            // Determinar guanyador de la basa
            const winningCard = findWinningCard(gameState.currentTrick, gameState.trickLeadSuit, gameState.trump);
            const winnerEntry = gameState.currentTrick.find(t => 
                t.suit === winningCard.suit && t.value === winningCard.value);
            const winner = winnerEntry.player;
            const winningTeam = getTeam(winner);
            
            const points = calculateTrickPoints(gameState.currentTrick);
            gameState.tricksWon[winningTeam].push(...gameState.currentTrick);
            
            // Guardar la basa per al jugador guanyador
            gameState.tricksWonBy[winner].push(gameState.currentTrick);
            gameState.lastTrickBy[winner] = {
                cards: [...gameState.currentTrick],
                leadSuit: gameState.trickLeadSuit
            };
            
            log(`${PLAYER_NAMES[winner]} guanya la basa (${points} punts)`);

            // Guardar la tirada a l'historial
            gameState.trickHistory.push({
                cards: [...gameState.currentTrick],
                leadPlayer: gameState.currentTrick[0].player,
                winner: winner
            });
            
            await delay(1000);
            
            // Netejar zona de joc i actualitzar piles
            gameState.currentTrick = [];
            renderPlayArea();
            renderWonPiles();
            
            // El guanyador comença la següent
            gameState.currentPlayer = winner;
        }

        function waitForHumanPlay() {
            return new Promise(resolve => {
                const checkPlay = setInterval(() => {
                    // La funció playCard resoldrà això
                    if (gameState.currentPlayer !== 'south' || 
                        gameState.currentTrick.length > 0 && 
                        gameState.currentTrick[gameState.currentTrick.length - 1].player === 'south') {
                        clearInterval(checkPlay);
                        resolve();
                    }
                }, 100);
            });
        }

        async function playCard(player, card) {
            // Treure carta de la mà
            const hand = gameState.hands[player];
            const idx = hand.findIndex(c => c.suit === card.suit && c.value === card.value);
            if (idx === -1) return;
            hand.splice(idx, 1);
            
            // Primera carta estableix el pal de sortida
            if (gameState.currentTrick.length === 0) {
                gameState.trickLeadSuit = card.suit;
            }
            
            // Afegir a la basa actual
            gameState.currentTrick.push({
                player,
                suit: card.suit,
                value: card.value
            });
            
            log(`${PLAYER_NAMES[player]} juga ${CARD_NAMES[card.value]} de ${SUIT_NAMES[card.suit]}`);
            
            renderHands();
            renderPlayArea();
            
            // Passar al següent jugador
            gameState.currentPlayer = getNextPlayer(player);
        }

        async function endHand() {
            gameState.phase = 'scoring';
            
            // Calcular punts de figures
            let nsCardPoints = 0;
            let ewCardPoints = 0;
            
            gameState.tricksWon.ns.forEach(card => {
                nsCardPoints += CARD_POINTS[card.value];
            });
            
            gameState.tricksWon.ew.forEach(card => {
                ewCardPoints += CARD_POINTS[card.value];
            });
            
            // Comptar bases
            const nsTricks = gameState.tricksWon.ns.length / 4;
            const ewTricks = gameState.tricksWon.ew.length / 4;
            
            // Punts totals (figures + bases)
            const nsPoints = nsCardPoints + nsTricks;
            const ewPoints = ewCardPoints + ewTricks;
            
            // L'equip guanyador és el que passa de 36
            let winningTeam = nsPoints > 36 ? 'ns' : 'ew';
            let pointsWon = winningTeam === 'ns' ? nsPoints - 36 : ewPoints - 36;
            pointsWon *= gameState.multiplier;
            
            // Guardar historial de la mà
            handsHistory.push({
                handNumber: handsHistory.length + 1,
                trump: gameState.trump ? SUIT_NAMES[gameState.trump] : 'Botifarra',
                trumpIcon: gameState.trump ? SUIT_ICONS[gameState.trump] : '🎉',
                multiplier: gameState.multiplier,
                ns: {
                    tricks: nsTricks,
                    cardPoints: nsCardPoints,
                    totalPoints: nsPoints
                },
                ew: {
                    tricks: ewTricks,
                    cardPoints: ewCardPoints,
                    totalPoints: ewPoints
                },
                winner: winningTeam,
                pointsWon: pointsWon,
                trickHistory: [...gameState.trickHistory]
            });
            
            if (winningTeam === 'ns') {
                gameState.scores.ns += pointsWon;
            } else {
                gameState.scores.ew += pointsWon;
            }
            
            updateScoreboard();
            
            const teamName = winningTeam === 'ns' 
                ? PLAYER_NAMES.south + ' i ' + PLAYER_NAMES.north 
                : PLAYER_NAMES.east + ' i ' + PLAYER_NAMES.west;
            showMessage(
                `${teamName} guanyen!`,
                `+${pointsWon} punts (${winningTeam === 'ns' ? nsPoints : ewPoints} a ${winningTeam === 'ns' ? ewPoints : nsPoints})`,
                3000
            );
            
            log(`Mà acabada: NS ${nsPoints} - EW ${ewPoints}`, true);
            log(`${teamName}: +${pointsWon} punts`, true);
            
            await delay(3000);
            
            // Comprovar fi de partida
            if (gameState.scores.ns > 100 || gameState.scores.ew > 100) {
                endGame();
                return;
            }
            
            // Següent mà
            gameState.dealer = getNextPlayer(gameState.dealer);
            await startNewHand();
        }

 
        function endGame() {
            // Resetjar els toggles a l'estat minimitzat
            document.getElementById('hands-history-content').style.display = 'none';
            document.getElementById('toggle-hands-history').textContent = '▼ Mostrar';
            document.getElementById('tricks-history-content').style.display = 'none';
            document.getElementById('toggle-tricks-history').textContent = '▼ Mostrar';

            const isHumanWinner = gameState.scores.ns > 100;
            
            document.getElementById('winner-text').textContent = 
                isHumanWinner ? '🎉 Victòria! 🎉' : 'Has perdut...';
            document.getElementById('final-score').textContent = 
                isHumanWinner ? 'Enhorabona, heu guanyat la partida!' : 'Els rivals han guanyat la partida';
            
            // Actualitzar noms dels equips al marcador final
            const teamNS = PLAYER_NAMES.south + ' i ' + PLAYER_NAMES.north;
            const teamEW = PLAYER_NAMES.east + ' i ' + PLAYER_NAMES.west;
            document.querySelector('.final-team:first-child .final-team-name').textContent = teamNS;
            document.querySelector('.final-team:last-child .final-team-name').textContent = teamEW;
            
            // Actualitzar noms a la capçalera de la taula d'historial
            const headerCells = document.querySelectorAll('.hands-history-table thead tr:first-child th');
            headerCells[3].textContent = teamNS;
            headerCells[4].textContent = teamEW;
            
            // Actualitzar marcador final
            document.getElementById('final-score-ns').textContent = gameState.scores.ns;
            document.getElementById('final-score-ew').textContent = gameState.scores.ew;
            
            // Ressaltar equip guanyador
            document.getElementById('final-score-ns').classList.toggle('winner', isHumanWinner);
            document.getElementById('final-score-ew').classList.toggle('winner', !isHumanWinner);
            
            // Generar taula d'historial
            const tbody = document.getElementById('hands-history-body');
            tbody.innerHTML = '';
            
            handsHistory.forEach(hand => {
                const row = document.createElement('tr');
                row.className = hand.winner === 'ns' ? 'winner-ns' : 'winner-ew';
                
                row.innerHTML = `
                    <td>${hand.handNumber}</td>
                    <td class="trump-cell">${hand.trumpIcon}</td>
                    <td>×${hand.multiplier}</td>
                    <td>${hand.ns.tricks}</td>
                    <td>${hand.ns.cardPoints}</td>
                    <td>${hand.ns.totalPoints}</td>
                    <td>${hand.ew.tricks}</td>
                    <td>${hand.ew.cardPoints}</td>
                    <td>${hand.ew.totalPoints}</td>
                    <td class="points-won">${hand.winner === 'ns' ? '+' : ''}${hand.winner === 'ns' ? hand.pointsWon : ''} ${hand.winner === 'ew' ? '+' + hand.pointsWon : ''}</td>
                `;
                
                tbody.appendChild(row);
            });


            // Generar taula de tirades per cada mà
            // const tricksContainer = document.getElementById('tricks-history-container');
            const tricksContainer = document.getElementById('tricks-history-content');
            tricksContainer.innerHTML = '';

            handsHistory.forEach((hand, handIndex) => {
                const handSection = document.createElement('div');
                handSection.className = 'hand-tricks-section';
                
                const handTitle = document.createElement('h4');
                handTitle.textContent = `Mà ${hand.handNumber} - ${hand.trumpIcon} ${hand.trump}`;
                handSection.appendChild(handTitle);
                
                const table = document.createElement('table');
                table.className = 'tricks-history-table';
                
                // Capçalera
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Tirada</th>
                        <th>${PLAYER_NAMES.north}</th>
                        <th>${PLAYER_NAMES.west}</th>
                        <th>${PLAYER_NAMES.south}</th>
                        <th>${PLAYER_NAMES.east}</th>
                    </tr>
                `;
                table.appendChild(thead);
                
                // Cos de la taula
                const tbody = document.createElement('tbody');
                const ordinals = ['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a', '12a'];
                
                hand.trickHistory.forEach((trick, trickIndex) => {
                    const row = document.createElement('tr');
                    
                    // Columna del número de tirada
                    let rowHTML = `<td>${ordinals[trickIndex]}</td>`;
                    
                    // Columnes per cada jugador (en ordre: north, west, south, east)
                    ['north', 'west', 'south', 'east'].forEach(player => {
                        const card = trick.cards.find(c => c.player === player);
                        if (card) {
                            const isLeader = trick.leadPlayer === player;
                            const cardName = CARD_NAMES_MINI[card.value];
                            const suitIcon = SUIT_ICONS[card.suit];
                            const leaderMark = isLeader ? ' ✋' : '';
                            const winnerClass = trick.winner === player ? 'trick-winner' : '';
                            rowHTML += `<td class="${winnerClass}">${cardName} ${suitIcon}${leaderMark}</td>`;
                        } else {
                            rowHTML += `<td>-</td>`;
                        }
                    });
                    
                    row.innerHTML = rowHTML;
                    tbody.appendChild(row);
                });
                
                table.appendChild(tbody);
                handSection.appendChild(table);
                tricksContainer.appendChild(handSection);
            });            

            
            document.getElementById('game-over').style.display = 'flex';
        }        

        function resetGame() {
            gameState.scores = { ns: 0, ew: 0 };
            gameState.multiplier = 1;
            handsHistory = [];
            
            // Assignar nous noms aleatoris als bots
            // assignRandomBotNames();
            // updatePlayerNames();
            
            document.getElementById('game-over').style.display = 'none';
            document.getElementById('game-log').innerHTML = '';
            updateScoreboard();
            updateMultiplierDisplay();
            startNewHand();
        }

        function goToMainMenu() {
            gameState.scores = { ns: 0, ew: 0 };
            gameState.multiplier = 1;
            handsHistory = [];
            document.getElementById('game-over').style.display = 'none';
            document.getElementById('game-container').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
            document.getElementById('game-log').innerHTML = '';
            // Netejar el camp de nom per si es vol canviar
            document.getElementById('player-name-input').value = '';
        }

        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // ==================== EVENT LISTENERS ====================
        document.getElementById('start-button').addEventListener('click', startGame);
        document.getElementById('btn-new-game').addEventListener('click', resetGame);
        document.getElementById('btn-main-menu').addEventListener('click', goToMainMenu);
        document.getElementById('info-toggle').addEventListener('click', () => {
            window.location.href = '/Zona-Botifarra/infografia.html'; // Substitueix amb la URL desitjada
        });
        // Toggle historial de mans
        document.getElementById('toggle-hands-history').addEventListener('click', function() {
            const content = document.getElementById('hands-history-content');
            const btn = this;
            if (content.style.display === 'none') {
                content.style.display = 'block';
                btn.textContent = '▲ Amagar';
            } else {
                content.style.display = 'none';
                btn.textContent = '▼ Mostrar';
            }
        });

        // Toggle historial de tirades
        document.getElementById('toggle-tricks-history').addEventListener('click', function() {
            const content = document.getElementById('tricks-history-content');
            const btn = this;
            if (content.style.display === 'none') {
                content.style.display = 'block';
                btn.textContent = '▲ Amagar';
            } else {
                content.style.display = 'none';
                btn.textContent = '▼ Mostrar';
            }
        });

        // Toggle del log
        const logToggle = document.getElementById('log-toggle');
        const gameLog = document.getElementById('game-log');
        let logVisible = true;

        logToggle.addEventListener('click', () => {
            logVisible = !logVisible;
            if (logVisible) {
                gameLog.classList.remove('hidden');
                logToggle.textContent = '📋 Amagar log';
            } else {
                gameLog.classList.add('hidden');
                logToggle.textContent = '📋 Mostrar log';
            }
        });

        // Amagar log per defecte en pantalles petites
        function checkScreenSize() {
            if (window.innerWidth <= 900) {
                if (logVisible) {
                    logVisible = false;
                    gameLog.classList.add('hidden');
                    logToggle.textContent = '📋 Mostrar log';
                }
            }
        }

        window.addEventListener('resize', checkScreenSize);
        checkScreenSize();

        // Botons de triomf
        document.querySelectorAll('.trump-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const trump = btn.dataset.trump;
                selectTrump(trump, 'south');
            });
        });


        // Tancar modal d'última basa
        document.getElementById('last-trick-modal').addEventListener('click', () => {
            document.getElementById('last-trick-modal').style.display = 'none';
        });

        // Tecles ràpides
        document.addEventListener('keydown', e => {
            if (e.key === 'Enter' && document.getElementById('start-screen').style.display !== 'none') {
                startGame();
            }
        });