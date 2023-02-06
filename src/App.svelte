<script>
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";
	import Portal from "svelte-portal";

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
</script>

<main
	class="mx-auto max-w-2xl h-full flex flex-col items-center justify-around p-4"
>
	<div class="flex items-center justify-between gap-4 w-full">
		<div>
			<h1 class="text-3xl md:text-4xl font-normal">Sudoku</h1>
			<small
				>By <a
					href="https://github.com/qhungg289"
					target="_blank"
					rel="noopener noreferrer"
					class="betterhover:hover:underline focus:underline">@qhungg289</a
				></small
			>
		</div>

		<div class="flex items-center gap-2">
			<button
				on:click={() => {
					isNewGameModalOpen = !isNewGameModalOpen;
				}}
				class="px-2 py-2 border-2 border-slate-200 dark:border-zinc-700 betterhover:hover:border-teal-400 enabled:active:bg-teal-400 enabled:active:border-teal-400 enabled:active:text-slate-100 dark:enabled:active:text-zinc-800 focus-visible:border-teal-400 rounded-full transition-colors"
				><svg
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
			</button>
			<Portal>
				{#if isNewGameModalOpen}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						transition:fade
						on:click={() => (isNewGameModalOpen = false)}
						class="h-full w-full absolute inset-0 flex items-center justify-center bg-slate-700/50 dark:bg-zinc-900/50 backdrop-blur"
					>
						<div
							on:click|stopPropagation
							class="bg-slate-100 dark:bg-zinc-800 rounded-lg overflow-hidden w-4/5 max-w-lg"
						>
							<div class="p-8">
								<h2 class="text-base md:text-lg text-center">
									Create a new game board?
								</h2>
							</div>

							<div class="flex items-center">
								<button
									on:click={() => (isNewGameModalOpen = false)}
									class="w-full px-6 py-2 font-bold rounded-bl-lg bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 active:bg-slate-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-700 transition-colors"
									>Cancel</button
								>
								<button
									on:click={() => {
										newGame({ holes: 50 });
										isNewGameModalOpen = false;
									}}
									class="w-full px-6 py-2 font-bold rounded-br-lg bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-100 dark:text-zinc-800 transition-colors"
									>Confirm</button
								>
							</div>
						</div>
					</div>
				{/if}
			</Portal>

			<button
				on:click={() => {
					isResetModalOpen = !isResetModalOpen;
				}}
				class="px-2 py-2 border-2 border-slate-200 dark:border-zinc-700 betterhover:hover:border-teal-400 enabled:active:bg-teal-400 enabled:active:border-teal-400 enabled:active:text-slate-100 dark:enabled:active:text-zinc-800 focus-visible:border-teal-400 rounded-full transition-colors"
				><svg
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
			</button>
			<Portal>
				{#if isResetModalOpen}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						transition:fade
						on:click={() => (isResetModalOpen = false)}
						class="h-full w-full absolute inset-0 flex items-center justify-center bg-slate-700/50 dark:bg-zinc-900/50 backdrop-blur"
					>
						<div
							on:click|stopPropagation
							class="bg-slate-100 dark:bg-zinc-800 rounded-lg overflow-hidden w-4/5 max-w-lg"
						>
							<div class="p-8">
								<h2 class="text-base md:text-lg text-center">
									This will reset the board to it original state. Are you sure?
								</h2>
							</div>

							<div class="flex items-center">
								<button
									on:click={() => (isResetModalOpen = false)}
									class="w-full px-6 py-2 font-bold rounded-bl-lg bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 active:bg-slate-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-700 transition-colors"
									>Cancel</button
								>
								<button
									on:click={() => {
										resetGame();
										isResetModalOpen = false;
									}}
									class="w-full px-6 py-2 font-bold rounded-br-lg bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-100 dark:text-zinc-800 transition-colors"
									>Confirm</button
								>
							</div>
						</div>
					</div>
				{/if}
			</Portal>

			<button
				on:click={revertToLastHistory}
				disabled={undoHistory.length == 0}
				class="px-2 py-2 border-2 border-slate-200 dark:border-zinc-700 betterhover:hover:border-teal-400 enabled:active:bg-teal-400 enabled:active:border-teal-400 enabled:active:text-slate-100 dark:enabled:active:text-zinc-800 disabled:hover:border-slate-200 dark:disabled:hover:border-zinc-700 disabled:text-slate-300 dark:disabled:text-zinc-600 disabled:cursor-not-allowed focus-visible:border-teal-400 rounded-full transition-colors"
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
			</button>
		</div>
	</div>

	<div
		class="flex flex-col md:flex-row items-center justify-evenly md:justify-between md:gap-16 w-full h-full"
	>
		<div class="flex flex-col items-center gap-1 relative">
			{#each mainBoard as row, i}
				<div class="flex items-center gap-1">
					{#each row as cell, j}
						{#if !removedVals.some((v) => v.rowIndex == i && v.colIndex == j)}
							<button
								class="w-9 h-9 text-lg focus:outline-none border-2 border-transparent font-black bg-slate-200 dark:bg-zinc-700 flex items-center justify-center transition-all"
								disabled
								class:rounded-tl-xl={i == 0 && j == 0}
								class:rounded-tr-xl={i == 0 && j == 8}
								class:rounded-bl-xl={i == 8 && j == 0}
								class:rounded-br-xl={i == 8 && j == 8}
								class:border-teal-400={selectedNumber == cell}
								>{cell > 0 ? cell : ""}</button
							>
						{:else if removedVals.find((v) => v.rowIndex == i && v.colIndex == j).isValid == true}
							<button
								class="w-9 h-9 text-lg focus:outline-none italic border-2 border-transparent betterhover:hover:bg-teal-400 betterhover:hover:text-slate-100 dark:betterhover:hover:text-zinc-800 bg-slate-200 dark:bg-zinc-700 flex items-center justify-center transition-all"
								class:rounded-tl-xl={i == 0 && j == 0}
								class:rounded-tr-xl={i == 0 && j == 8}
								class:rounded-bl-xl={i == 8 && j == 0}
								class:rounded-br-xl={i == 8 && j == 8}
								class:border-teal-400={selectedNumber == cell &&
									selectedNumber != 0}
								on:click={() => {
									writeNumberInCell({ rowIndex: i, colIndex: j });
									checkIsCellValid({ rowIndex: i, colIndex: j });
								}}
							>
								{cell > 0 ? cell : ""}
							</button>
						{:else if removedVals.find((v) => v.rowIndex == i && v.colIndex == j).isValid == false}
							<button
								class="w-9 h-9 text-lg focus:outline-none italic border-2 border-transparent betterhover:hover:bg-teal-400 betterhover:hover:text-slate-100 dark:betterhover:hover:text-zinc-800 bg-slate-200 dark:bg-zinc-700 text-rose-500 flex items-center justify-center transition-all"
								class:rounded-tl-xl={i == 0 && j == 0}
								class:rounded-tr-xl={i == 0 && j == 8}
								class:rounded-bl-xl={i == 8 && j == 0}
								class:rounded-br-xl={i == 8 && j == 8}
								class:border-teal-400={selectedNumber == cell &&
									selectedNumber != 0}
								on:click={() => {
									writeNumberInCell({ rowIndex: i, colIndex: j });
									checkIsCellValid({ rowIndex: i, colIndex: j });
								}}
							>
								{cell > 0 ? cell : ""}
							</button>
						{/if}
					{/each}
				</div>
			{/each}

			<div
				class="h-full w-1 bg-slate-300 dark:bg-zinc-500 absolute left-[7.25rem]"
			/>
			<div
				class="h-full w-1 bg-slate-300 dark:bg-zinc-500 absolute right-[7.25rem]"
			/>
			<div
				class="h-1 w-full bg-slate-300 dark:bg-zinc-500 absolute top-[7.25rem]"
			/>
			<div
				class="h-1 w-full bg-slate-300 dark:bg-zinc-500 absolute bottom-[7.25rem]"
			/>
		</div>

		<div
			class="grid grid-cols-5 md:grid-cols-3 gap-2 md:gap-4 w-fit mx-auto md:mx-0"
		>
			{#each { length: 9 } as _, i}
				<button
					class="w-14 md:w-16 h-14 md:h-16 rounded-full border-2 betterhover:hover:border-teal-400 active:bg-teal-400 active:text-slate-100 dark:active:text-zinc-800 flex items-center justify-center text-2xl md:text-3xl font-bold transition-colors"
					class:bg-teal-400={selectedNumber == i + 1}
					class:border-teal-400={selectedNumber == i + 1}
					class:border-slate-200={selectedNumber != i + 1}
					class:dark:border-zinc-700={selectedNumber != i + 1}
					class:text-slate-100={selectedNumber == i + 1}
					class:dark:text-zinc-800={selectedNumber == i + 1}
					on:click={() => setSelectedNumber(i + 1)}>{i + 1}</button
				>
			{/each}

			<button
				class="w-14 md:w-16 h-14 md:h-16 rounded-full border-2 betterhover:hover:border-teal-400 active:bg-teal-400 active:text-slate-100 dark:active:text-zinc-800 flex items-center justify-center text-2xl md:text-3xl font-bold transition-colors md:col-start-2"
				class:bg-teal-400={selectedNumber == 0}
				class:border-teal-400={selectedNumber == 0}
				class:border-slate-200={selectedNumber != 0}
				class:dark:border-zinc-700={selectedNumber != 0}
				class:text-slate-100={selectedNumber == 0}
				class:dark:text-zinc-800={selectedNumber == 0}
				on:click={() => setSelectedNumber(0)}
				><svg
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
			</button>
		</div>
	</div>

	<Portal>
		{#if isWon}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				transition:fade
				on:click={() => (isWon = false)}
				class="h-full w-full absolute inset-0 flex items-center justify-center bg-slate-700/50 dark:bg-zinc-900/50 backdrop-blur"
			>
				<div
					on:click|stopPropagation
					class="bg-slate-100 dark:bg-zinc-800 rounded-lg overflow-hidden w-4/5 max-w-lg"
				>
					<div class="p-8">
						<h2 class="text-base md:text-lg text-center">Completed 🎉</h2>
					</div>

					<div class="flex items-center">
						<button
							on:click={() => {
								isWon = false;
							}}
							class="w-full px-6 py-2 font-bold rounded-br-lg bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-100 dark:text-zinc-800 transition-colors"
							>Confirm</button
						>
					</div>
				</div>
			</div>
		{/if}
	</Portal>
</main>

<svelte:window on:keydown={handleKeyboardSelectNumber} />
