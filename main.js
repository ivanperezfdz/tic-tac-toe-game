const showToast = (message, table, backgroundColor = '#333') => {
	const toast = document.createElement('div');
	toast.textContent = message;

	const { top, left, width, height } = table.getBoundingClientRect();

	((elem, styles) => Object.assign(elem.style, styles))(toast, {
		position: 'absolute',
		top: `${top + height / 2 - 20}px`,
		left: `${left + width / 2}px`,
		transform: 'translate(-50%, -50%)',
		backgroundColor,
		color: '#fff',
		padding: '10px 20px',
		borderRadius: '5px',
		zIndex: '1000',
		opacity: '0',
		transition: 'opacity 0.5s'
	});

	table.parentNode.appendChild(toast);

	requestAnimationFrame(() => {
		toast.style.opacity = '1';
		setTimeout(() => {
			toast.style.opacity = '0';
			toast.addEventListener('transitionend', () => toast.remove());
		}, 3000);
	});
}

// Constantes
const DEFAULT_OPTIONS = {
	DEFAULT_SIZE: 3,
	PLAYER_X: 'X',
	PLAYER_O: 'O',
	COLORS: {
		BTN_PRIMARY: '#29ddb9',
		PRIMARY: '#173259'
	}
};

const GAME_MODES = {
	NORMAL: 'normal',
	AI: 'ai'
}

const IMG_SOURCES = {
	O: 'http://cdn.iahorro.com/internal-resources/it-technical-test/o.png',
	O2: 'http://cdn.iahorro.com/internal-resources/it-technical-test/o2.png',
	X: 'http://cdn.iahorro.com/internal-resources/it-technical-test/x.png',
	X2: 'http://cdn.iahorro.com/internal-resources/it-technical-test/x2.png'
}

export class TicTacToe extends HTMLElement {

	// Observador de size

	static get observedAttributes() {
		return ['size'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'size') {
			this.size = Math.max(parseInt(newValue), DEFAULT_OPTIONS.DEFAULT_SIZE);
			this.reset();
		}
	}

	constructor() {
		super();
		this._shadowRoot = this.attachShadow({ mode: 'open' });
		this.size = Math.max(DEFAULT_OPTIONS.DEFAULT_SIZE, parseInt(this.getAttribute('size')));
		this.gameMode = GAME_MODES.NORMAL;
		this.wins = { X: 0, O: 0 };
		this.inverted = false;
		this.initializeGameAttributes();
		this.initUI();
	}

	// LÓGICA

	initializeGameAttributes = () => {
		this.board = Array.from({ length: this.size }, () => Array(this.size).fill(null));
		this.currentPlayer = DEFAULT_OPTIONS.PLAYER_X;
		this.moveCount = 0;
		this.winner = null;
	}

	switchPlayer = () => {
		this.currentPlayer = this.currentPlayer === DEFAULT_OPTIONS.PLAYER_X ? DEFAULT_OPTIONS.PLAYER_O : DEFAULT_OPTIONS.PLAYER_X;
		this._shadowRoot.querySelector(".turn-wrapper img").src = IMG_SOURCES[`${this.currentPlayer}${this.inverted ? '2' : ''}`];
	}

	// Movimiento IA básica
	aiMove = () => {
		const availableCells = this.board.flatMap((row, i) => row.map((cell, j) => cell ? false : [i, j])).filter(Boolean);
		const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];

		if (randomCell) {
			const [row, col] = randomCell;
			this.placeMove(row, col);
		}
	}

	placeMove = (row, col) => {
		this.board[row][col] = this.currentPlayer;
		const table = this._shadowRoot.querySelector(".game-table")
		this.populateUI(table, row, col);	// Actualizar tablero

		if (this.checkWinner(row, col)) {
			this.winner = this.currentPlayer;
			this._shadowRoot.querySelector(`.points-player-${this.currentPlayer}`).textContent = ` - ${++this.wins[this.currentPlayer]}`
			showToast(`${this.winner} gana!`, table, DEFAULT_OPTIONS.COLORS.BTN_PRIMARY);
		} else if (this.checkTie()) {
			showToast("¡Empate!", table, DEFAULT_OPTIONS.COLORS.PRIMARY);
		} else {
			this.switchPlayer();
			if (this.gameMode === GAME_MODES.AI && this.currentPlayer === DEFAULT_OPTIONS.PLAYER_O) {
				this.aiMove();
			}
		}
	}

	checkWinner = (row, col) => {
		return this.isLineComplete(this.board[row]) ||	// Fila actual
			this.isLineComplete(this.board.map(r => r[col])) ||	// Columna actual
			(row === col && this.isLineComplete(this.board.map((r, i) => r[i]))) || // Diagonal principal
			(row + col === this.size - 1 && this.isLineComplete(this.board.map((r, i) => r[this.size - 1 - i]))); // Diagonal secundaria
	}

	isLineComplete = (line) => {
		return line.every(cell => cell === this.currentPlayer);
	}

	checkTie = () => {
		return this.moveCount === this.size * this.size;
	}

	reset = () => {
		this.initializeGameAttributes();
		this.populateUI(this._shadowRoot.querySelector(".game-table"));
	}

	// INTERFAZ

	getTemplate = () => {
		return `
        <div class="wrapper">
            <div class="turn-wrapper">
                <p class="turn-text">Turno de: </p>
                <img class="icon img-turn" src="${IMG_SOURCES[`${this.currentPlayer}${this.inverted ? '2' : ''}`]}">
            </div>

            <table class="game-table"></table>

            <div class="bottom-wrapper">
                <button class="secondary">Cambiar color</button>
                <div class="points-wrapper">
                    <p class="points-text">Puntuación</p>
                    <div class="points-player-wrapper">
                        <span class="points-player-wrapper-single">
                            <img class="icon img-turn turn-x" src="${IMG_SOURCES[`X${this.inverted ? '2' : ''}`]}">
                            <p class="points-player-X"> - ${this.wins.X}</p>
                        </span>
                        <span class="points-player-wrapper-single">
                            <img class="icon img-turn turn-o" src="${IMG_SOURCES[`O${this.inverted ? '2' : ''}`]}">
                            <p class="points-player-O"> - ${this.wins.O}</p>
                        </span>
                    </div>
                </div>
								<div class="new-game-wrapper">
									<input type="number" min="3" placeholder="Tamaño de la tabla" value="${this.size}">
									<button class="new-game-button">Nuevo juego</button>
								</div>
                <button class="game-mode-toggle">Jugar contra máquina</button>
            </div>
        </div>
    `;
	}

	initUI = () => {
		// Añadir estilos compilados del SCSS
		this._shadowRoot.innerHTML = `
            <style>
							.wrapper .turn-wrapper {
								display: flex;
								align-items: center;
								justify-content: center;
								gap: 10px;
							}
							.wrapper .turn-wrapper img {
								height: 24px;
								width: 24px;
							}
							.wrapper table {
								border-collapse: separate;
								border-spacing: 8px;
								margin: 0 auto;
							}
							.wrapper table td {
								box-shadow: 0 2px 4px 0 rgba(121, 122, 122, 0.4);
								border-radius: 2px;
								width: 109px;
								height: 109px;
								text-align: center;
								vertical-align: middle;
								background-color: #fff;
							}
							.wrapper table td .img-played {
								height: 56px;
								width: 56px;
							}
							.wrapper table td.X-selected {
								background-color: #e5fffa;
							}
							.wrapper table td.X-selected.X-selected-secondary {
								background-color: #faf3db;
							}
							.wrapper table td.O-selected {
								background-color: #fff3f2;
							}
							.wrapper table td.O-selected.O-selected-secondary {
								background-color: #edf0f5;
							}
							.wrapper table button {
								cursor: pointer;
								margin: 10px;
								padding: 10px;
								font-size: 1em;
								background-color: #4caf50;
								/* Green */
								color: white;
								border: none;
								cursor: pointer;
								width: 20%;
								opacity: 0.9;
							}
							.wrapper table button:hover {
								opacity: 1;
							}
							.wrapper .bottom-wrapper {
								display: flex;
								flex-direction: column;
							}
							.wrapper .bottom-wrapper button {
								cursor: pointer;
								font-family: "Montserrat";
								height: 48px;
								border: none;
								border-radius: 2px;
								background-color: #29ddb9;
								color: #fff;
								font-size: 18px;
								font-weight: 600;
								padding: 13px;
								margin-top: 20px;
							}
							.wrapper .bottom-wrapper button.secondary {
								margin-left: auto;
								display: flex;
								justify-content: center;
								align-items: center;
								border: 1px solid #29ddb9;
								background-color: transparent;
								color: #29ddb9;
								height: 32px;
								width: 120px;
								font-size: 12px;
							}
							.wrapper .bottom-wrapper .points-wrapper {
								display: flex;
								flex-direction: column;
								justify-content: center;
								align-items: center;
							}
							.wrapper .bottom-wrapper .points-wrapper .points-text {
								font-size: 20px;
								font-weight: 700;
							}
							.wrapper .bottom-wrapper .points-wrapper .points-player-wrapper {
								display: flex;
								justify-content: space-around;
								width: 50%;
							}
							.wrapper .bottom-wrapper .points-wrapper .points-player-wrapper .points-player-wrapper-single {
								display: flex;
								align-items: center;
							}
							.wrapper .bottom-wrapper .points-wrapper .points-player-wrapper .points-player-wrapper-single img {
								height: 32px;
								width: 32px;
							}
							.wrapper .bottom-wrapper .points-wrapper .points-player-wrapper .points-player-wrapper-single p {
								margin-left: 4px;
								font-size: 24px;
							}
							.wrapper .bottom-wrapper .new-game-wrapper {
								display: flex;
								justify-content: space-between;
								gap: 5px;
							}
							.wrapper .bottom-wrapper .new-game-wrapper input {
								margin-top: 20px;
								height: 48px;
							}
            </style>
        `;

		this._shadowRoot.innerHTML += this.getTemplate();

		const table = this._shadowRoot.querySelector(".game-table");
		table.addEventListener('click', this.handleCellClick);

		const changeColorButton = this._shadowRoot.querySelector("button.secondary");
		changeColorButton.addEventListener('click', this.handleToggleColor);

		const newSizeInput = this._shadowRoot.querySelector("input");
		const newGameButton = this._shadowRoot.querySelector(".new-game-button");
		newGameButton.addEventListener('click', () => this.handleNewSize(newSizeInput.value));

		const gameModeToggleButton = this._shadowRoot.querySelector(".game-mode-toggle");
		gameModeToggleButton.addEventListener('click', this.handleToggleGameMode);
	}

	// Manejadores de eventos

	handleCellClick = (e) => {
		if (this.winner) return;

		const cell = e.target;
		if (cell.tagName === 'TD') {
			const row = cell.parentElement.rowIndex;
			const col = cell.cellIndex;

			if (!this.board[row][col]) {
				this.moveCount++;
				this.placeMove(row, col);
			}
		}
	}

	handleNewSize = (size) => {
		this.setAttribute('size', Math.max(DEFAULT_OPTIONS.DEFAULT_SIZE, size));
	}

	handleToggleGameMode = () => {
		const gameModeToggle = this._shadowRoot.querySelector(".game-mode-toggle");
		const gameTable = this._shadowRoot.querySelector(".game-table");

		if (this.gameMode === GAME_MODES.NORMAL) {
			this.gameMode = GAME_MODES.AI;
			gameModeToggle.textContent = "Jugar modo normal";
			showToast("Modo vs Máquina activado", gameTable);
		} else {
			this.gameMode = GAME_MODES.NORMAL;
			gameModeToggle.textContent = "Jugar contra máquina";
			showToast("Modo vs Jugador activado", gameTable);
		}

		this.reset();
	}

	handleToggleColor = () => {
		this.inverted = !this.inverted;
		this.invertUI(this._shadowRoot.querySelector(".game-table"));
	}

	createButton = (text, clickHandler) => {
		const button = document.createElement("button");
		button.textContent = text;
		button.addEventListener('click', clickHandler);
		return button;
	}

	invertUI = (table) => {
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				if (this.board[i][j]) {
					const td = table.rows[i].cells[j]
					td.querySelector("img").src = IMG_SOURCES[`${this.board[i][j]}${this.inverted ? '2' : ''}`];
					td.className = `${this.board[i][j]}-selected ${this.inverted ? this.board[i][j] + '-selected-secondary' : ''}`;
				}
			}
		}
		this._shadowRoot.querySelector(".turn-x").src = IMG_SOURCES[`${DEFAULT_OPTIONS.PLAYER_X}${this.inverted ? '2' : ''}`];
		this._shadowRoot.querySelector(".turn-o").src = IMG_SOURCES[`${DEFAULT_OPTIONS.PLAYER_O}${this.inverted ? '2' : ''}`];
		this._shadowRoot.querySelector(".turn-wrapper img").src = IMG_SOURCES[`${this.currentPlayer}${this.inverted ? '2' : ''}`];
	}

	// Actualizar la interfaz
	populateUI = (table, rowSelected = null, colSelected = null) => {

		// Movimiento
		if (rowSelected !== null && colSelected !== null) {
			const td = table.rows[rowSelected].cells[colSelected];
			const img = document.createElement("img");
			img.src = IMG_SOURCES[`${this.currentPlayer}${this.inverted ? '2' : ''}`];
			img.className = "img-played";
			td.appendChild(img);
			td.className = `${this.currentPlayer}-selected ${this.inverted ? this.currentPlayer + '-selected-secondary' : ''}`;
			return;
		}

		// Nuevo juego
		const rows = [];
		for (let i = 0; i < this.size; i++) {
			const row = document.createElement("tr");
			for (let j = 0; j < this.size; j++) {
				const cell = document.createElement("td");
				cell.textContent = '';
				row.appendChild(cell);
			}

			rows.push(row);
		}

		table.innerHTML = '';
		table.append(...rows);
	}
}

customElements.define('tic-tac-toe', TicTacToe);
