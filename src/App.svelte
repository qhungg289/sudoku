<script>
	import { onMount } from "svelte";
	import { scale, fade } from "svelte/transition";
	import Portal from "svelte-portal";
	import Logo from "./lib/Logo.svelte";
	import ActionButton from "./lib/ActionButton.svelte";
	import Modal from "./lib/Modal.svelte";
	import NumberButton from "./lib/NumberButton.svelte";

	const BLANK_BOARD = [
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
	];

	const numbersArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];

	let counter = 0;
	let mainBoard = [];
	let mainBoardCopy = [];
	let undoHistory = [];
	let removedVals = [];
	let solvedBoard = [];
	let selectedNumber = 1;

	let isNewGameModalOpen = false;
	let isResetModalOpen = false;
	let isWon = false;

	const shuffle = (array) => {
		let newArray = [...array];
		for (let i = newArray.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
		}
		return newArray;
	};

	const rowSafe = (puzzleArray, emptyCell, num) => {
		return puzzleArray[emptyCell.rowIndex].indexOf(num) == -1;
	};

	const colSafe = (puzzleArray, emptyCell, num) => {
		return !puzzleArray.some((row) => row[emptyCell.colIndex] == num);
	};

	const boxSafe = (puzzleArray, emptyCell, num) => {
		const boxStartRow = emptyCell.rowIndex - (emptyCell.rowIndex % 3);
		const boxStartCol = emptyCell.colIndex - (emptyCell.colIndex % 3);
		let safe = true;

		for (const boxRow of [0, 1, 2]) {
			for (const boxCol of [0, 1, 2]) {
				if (puzzleArray[boxStartRow + boxRow][boxStartCol + boxCol] == num) {
					safe = false;
				}
			}
		}
		return safe;
	};

	const safeToPlace = (puzzleArray, emptyCell, num) => {
		return (
			rowSafe(puzzleArray, emptyCell, num) &&
			colSafe(puzzleArray, emptyCell, num) &&
			boxSafe(puzzleArray, emptyCell, num)
		);
	};

	const nextEmptyCell = (puzzleArray) => {
		const emptyCell = { rowIndex: "", colIndex: "" };

		puzzleArray.forEach((row, rowIndex) => {
			if (emptyCell.colIndex !== "") return;
			let firstZero = row.find((col) => col === 0);
			if (firstZero === undefined) return;
			emptyCell.rowIndex = rowIndex;
			emptyCell.colIndex = row.indexOf(firstZero);
		});

		if (emptyCell.colIndex !== "") return emptyCell;
		return false;
	};

	const fillPuzzle = (startingBoard) => {
		const emptyCell = nextEmptyCell(startingBoard);
		if (!emptyCell) return startingBoard;

		for (const num of shuffle(numbersArray)) {
			counter++;
			if (counter > 20_000_000) throw new Error("Recursion Timeout");
			if (safeToPlace(startingBoard, emptyCell, num)) {
				startingBoard[emptyCell.rowIndex][emptyCell.colIndex] = num;
				if (fillPuzzle(startingBoard)) return startingBoard;
				startingBoard[emptyCell.rowIndex][emptyCell.colIndex] = 0;
			}
		}
		return false;
	};

	const newSolvedBoard = (_) => {
		const newBoard = BLANK_BOARD.map((row) => row.slice());
		fillPuzzle(newBoard);
		return newBoard;
	};

	const pokeHoles = (startingBoard, holes) => {
		const removedVals = [];

		while (removedVals.length < holes) {
			const val = Math.floor(Math.random() * 81);
			const randomRowIndex = Math.floor(val / 9);
			const randomColIndex = val % 9;

			if (!startingBoard[randomRowIndex]) continue;
			if (startingBoard[randomRowIndex][randomColIndex] == 0) continue;

			removedVals.push({
				rowIndex: randomRowIndex,
				colIndex: randomColIndex,
				val: startingBoard[randomRowIndex][randomColIndex],
				isValid: true,
			});
			startingBoard[randomRowIndex][randomColIndex] = 0;
			const proposedBoard = startingBoard.map((row) => row.slice());

			if (!fillPuzzle(proposedBoard)) {
				startingBoard[randomRowIndex][randomColIndex] = removedVals.pop().val;
			}
		}
		return [removedVals, startingBoard];
	};

	const newStartingBoard = (holes) => {
		try {
			counter = 0;
			let solvedBoard = newSolvedBoard();

			let [removedVals, startingBoard] = pokeHoles(
				solvedBoard.map((row) => row.slice()),
				holes,
			);

			return [removedVals, startingBoard, solvedBoard];
		} catch (error) {
			return newStartingBoard(holes);
		}
	};

	const saveGameState = () => {
		localStorage.setItem("removedVals", JSON.stringify(removedVals));
		localStorage.setItem("solvedBoard", JSON.stringify(solvedBoard));
		localStorage.setItem("undoHistory", JSON.stringify(undoHistory));
		localStorage.setItem("mainBoardCopy", JSON.stringify(mainBoardCopy));
		localStorage.setItem("mainBoard", JSON.stringify(mainBoard));
	};

	const restoreGameState = () => {
		removedVals = JSON.parse(localStorage.getItem("removedVals"));
		solvedBoard = JSON.parse(localStorage.getItem("solvedBoard"));
		undoHistory = JSON.parse(localStorage.getItem("undoHistory"));
		mainBoardCopy = JSON.parse(localStorage.getItem("mainBoardCopy"));
		mainBoard = JSON.parse(localStorage.getItem("mainBoard"));
	};

	const newGame = ({ holes }) => {
		const [newRemovedVals, newMainBoard, newSolvedBoard] =
			newStartingBoard(holes);
		mainBoard = newMainBoard;
		removedVals = newRemovedVals;
		solvedBoard = newSolvedBoard;

		mainBoardCopy = mainBoard.map((row) => row.slice());
		undoHistory = [];

		saveGameState();
	};

	const resetGame = () => {
		mainBoard = mainBoardCopy.map((row) => row.slice());
		undoHistory = [];

		saveGameState();
	};

	const addToHistory = () => {
		undoHistory = [...undoHistory, mainBoard.map((row) => row.slice())];
	};

	const revertToLastHistory = () => {
		mainBoard = undoHistory[undoHistory.length - 1].map((row) => row.slice());
		undoHistory = [...undoHistory.slice(0, -1)];

		saveGameState();
	};

	const setSelectedNumber = (newNumber) => {
		selectedNumber = newNumber;
	};

	const handleKeyboardSelectNumber = (e) => {
		switch (e.key) {
			case "1":
				selectedNumber = 1;
				break;
			case "2":
				selectedNumber = 2;
				break;
			case "3":
				selectedNumber = 3;
				break;
			case "4":
				selectedNumber = 4;
				break;
			case "5":
				selectedNumber = 5;
				break;
			case "6":
				selectedNumber = 6;
				break;
			case "7":
				selectedNumber = 7;
				break;
			case "8":
				selectedNumber = 8;
				break;
			case "9":
				selectedNumber = 9;
				break;
			case "0":
				selectedNumber = 0;
				break;
			case "Delete":
				selectedNumber = 0;
				break;
			case "Backspace":
				selectedNumber = 0;
				break;
		}
	};

	const checkWinStatus = () => {
		isWon = JSON.stringify(mainBoard) == JSON.stringify(solvedBoard);
	};

	const writeNumberInCell = ({ rowIndex, colIndex }) => {
		addToHistory();

		mainBoard[rowIndex][colIndex] = selectedNumber;

		saveGameState();

		checkWinStatus();
	};

	const checkIsCellValid = ({ rowIndex, colIndex }) => {
		const cellValue = mainBoard[rowIndex][colIndex];

		removedVals = removedVals.map((v) => {
			if (
				v.rowIndex == rowIndex &&
				v.colIndex == colIndex &&
				v.val == cellValue
			) {
				v.isValid = true;
				return v;
			}

			if (
				v.rowIndex == rowIndex &&
				v.colIndex == colIndex &&
				v.val != cellValue
			) {
				v.isValid = false;
				return v;
			}

			return v;
		});

		saveGameState();
	};

	onMount(() => {
		if (localStorage.getItem("mainBoard")) {
			restoreGameState();
		} else {
			newGame({ holes: 50 });
		}
	});

	const checkValidOnBoardChange = (node, { cell, rowIndex, colIndex }) => {
		return {
			update({ cell, rowIndex, colIndex }) {
				checkIsCellValid({ rowIndex, colIndex });
			},
		};
	};
</script>

<main
	class="mx-auto max-w-2xl lg:max-w-3xl h-full flex flex-col items-center justify-around p-4"
>
	<div class="flex items-center justify-between gap-4 w-full">
		<Logo />

		<div class="flex items-center gap-2">
			<ActionButton
				on:click={() => {
					isNewGameModalOpen = !isNewGameModalOpen;
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="w-5 sm:w-6 h-5 sm:h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 4.5v15m7.5-7.5h-15"
					/>
				</svg>
			</ActionButton>
			<Portal target="#app">
				{#if isNewGameModalOpen}
					<Modal
						cancelable
						on:clickoutside={() => (isNewGameModalOpen = false)}
						on:cancel={() => (isNewGameModalOpen = false)}
						on:confirm={() => {
							newGame({ holes: 50 });
							isNewGameModalOpen = false;
						}}
					>
						<span slot="content">Create a new game board?</span>
					</Modal>
				{/if}
			</Portal>

			<ActionButton
				on:click={() => {
					isResetModalOpen = !isResetModalOpen;
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="w-5 sm:w-6 h-5 sm:h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
					/>
				</svg>
			</ActionButton>
			<Portal target="#app">
				{#if isResetModalOpen}
					<Modal
						cancelable
						on:clickoutside={() => (isResetModalOpen = false)}
						on:cancel={() => (isResetModalOpen = false)}
						on:confirm={() => {
							resetGame();
							isResetModalOpen = false;
						}}
					>
						<span slot="content">
							This will reset the board to it original state. Are you sure?
						</span>
					</Modal>
				{/if}
			</Portal>

			<ActionButton
				on:click={revertToLastHistory}
				disabled={undoHistory.length == 0}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="w-5 sm:w-6 h-5 sm:h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 15l-6 6m0 0l-6-6m6 6V9a6 6 0 0112 0v3"
					/>
				</svg>
			</ActionButton>
		</div>
	</div>

	<div
		class="flex flex-col md:flex-row items-center justify-evenly md:justify-between md:gap-16 w-full h-full"
	>
		<div
			class="flex flex-col items-center gap-1 relative rounded-xl border-4 border-slate-300 dark:border-zinc-500"
		>
			{#each mainBoard as row, i}
				<div class="flex items-center gap-1">
					{#each row as cell, j}
						{#if !removedVals.some((v) => v.rowIndex == i && v.colIndex == j)}
							<button
								class="w-9 lg:w-10 h-9 lg:h-10 text-lg focus:outline-teal-400 border-2 border-transparent font-black bg-slate-200 dark:bg-zinc-700 flex items-center justify-center transition-all"
								disabled
								class:rounded-tl-lg={i == 0 && j == 0}
								class:rounded-tr-lg={i == 0 && j == 8}
								class:rounded-bl-lg={i == 8 && j == 0}
								class:rounded-br-lg={i == 8 && j == 8}
								class:border-teal-400={selectedNumber == cell}
								>{cell > 0 ? cell : ""}</button
							>
						{:else}
							<button
								class="w-9 lg:w-10 h-9 lg:h-10 text-lg focus:outline-teal-400 border-2 border-transparent betterhover:hover:bg-teal-400 betterhover:hover:text-slate-100 dark:betterhover:hover:text-zinc-800 bg-slate-200 dark:bg-zinc-700 flex items-center justify-center transition-all"
								class:text-rose-500={removedVals.find(
									(v) => v.rowIndex == i && v.colIndex == j,
								).isValid == false}
								class:rounded-tl-lg={i == 0 && j == 0}
								class:rounded-tr-lg={i == 0 && j == 8}
								class:rounded-bl-lg={i == 8 && j == 0}
								class:rounded-br-lg={i == 8 && j == 8}
								class:border-teal-400={selectedNumber == cell &&
									selectedNumber != 0}
								on:click={() => {
									writeNumberInCell({ rowIndex: i, colIndex: j });
								}}
								use:checkValidOnBoardChange={{ cell, rowIndex: i, colIndex: j }}
							>
								{#key cell}
									<span class="absolute" transition:scale|local>
										{cell > 0 ? cell : ""}
									</span>
								{/key}
							</button>
						{/if}
					{/each}
				</div>
			{/each}

			<div
				class="h-full w-1 bg-slate-300 dark:bg-zinc-500 absolute left-[7.25rem] lg:left-[8rem]"
			/>
			<div
				class="h-full w-1 bg-slate-300 dark:bg-zinc-500 absolute right-[7.25rem] lg:right-[8rem]"
			/>
			<div
				class="h-1 w-full bg-slate-300 dark:bg-zinc-500 absolute top-[7.25rem] lg:top-[8rem]"
			/>
			<div
				class="h-1 w-full bg-slate-300 dark:bg-zinc-500 absolute bottom-[7.25rem] lg:bottom-[8rem]"
			/>
		</div>

		<div
			class="grid grid-cols-5 md:grid-cols-3 gap-2 md:gap-4 w-fit mx-auto md:mx-0"
		>
			{#each { length: 9 } as _, i}
				<NumberButton
					{selectedNumber}
					displayNumber={i + 1}
					on:click={() => setSelectedNumber(i + 1)}
				>
					{i + 1}
				</NumberButton>
			{/each}

			<NumberButton
				{selectedNumber}
				displayNumber={0}
				on:click={() => setSelectedNumber(0)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z"
					/>
				</svg>
			</NumberButton>
		</div>
	</div>

	<Portal target="#app">
		{#if isWon}
			<Modal
				on:clickoutside={() => (isWon = false)}
				on:confirm={() => (isWon = false)}
			>
				<span slot="content">Completed 🎉</span>
			</Modal>
		{/if}
	</Portal>
</main>

<svelte:window on:keydown={handleKeyboardSelectNumber} />
