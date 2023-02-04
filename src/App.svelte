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
	let removedVals = [];
	let solvedBoard = [];
	let selectedNumber = 1;

	let isNewGameModalOpen = false;
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
				isValid: false,
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

	const newGame = ({ holes }) => {
		const [newRemovedVals, newMainBoard, newSolvedBoard] =
			newStartingBoard(holes);
		mainBoard = newMainBoard;
		removedVals = newRemovedVals;
		solvedBoard = newSolvedBoard;
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
		mainBoard[rowIndex][colIndex] = selectedNumber;

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
	};

	$: console.table(removedVals);

	onMount(() => {
		newGame({ holes: 50 });
	});
</script>

<main class="mx-auto h-full flex flex-col items-center justify-around p-4">
	<div class="flex items-center justify-between gap-4 w-full">
		<h1 class="text-3xl sm:text-4xl font-bold">SUDOKU</h1>

		<button
			on:click={() => {
				isNewGameModalOpen = !isNewGameModalOpen;
			}}
			class="px-6 py-3 bg-blue-400 hover:bg-blue-300 active:bg-blue-500 rounded-full font-bold text-slate-100 text-sm sm:text-base transition-colors"
			>NEW GAME</button
		>

		<Portal>
			{#if isNewGameModalOpen}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div
					transition:fade
					on:click={() => (isNewGameModalOpen = false)}
					class="h-full w-full absolute inset-0 flex items-center justify-center bg-slate-700/50"
				>
					<div
						on:click|stopPropagation
						class="bg-slate-100 rounded-lg overflow-hidden"
					>
						<div class="p-8">
							<h2 class="text-2xl font-bold">Create a new game board?</h2>
						</div>

						<div class="flex items-center">
							<button
								on:click={() => (isNewGameModalOpen = false)}
								class="w-full px-6 py-2 font-bold rounded-bl-lg bg-slate-200 hover:bg-slate-300 active:bg-slate-200 transition-colors"
								>Cancel</button
							>
							<button
								on:click={() => {
									newGame({ holes: 50 });
									isNewGameModalOpen = false;
								}}
								class="w-full px-6 py-2 font-bold rounded-br-lg bg-blue-400 hover:bg-blue-300 active:bg-blue-500 text-slate-100 transition-colors"
								>Confirm</button
							>
						</div>
					</div>
				</div>
			{/if}
		</Portal>
	</div>

	<div
		class="flex flex-col md:flex-row items-center justify-evenly md:gap-16 w-full md:w-fit h-full"
	>
		<div class="flex flex-col items-center gap-1 relative">
			{#each mainBoard as row, i}
				<div class="flex items-center gap-1">
					{#each row as cell, j}
						{#if !removedVals.some((v) => v.rowIndex == i && v.colIndex == j)}
							<button
								class="w-9 h-9 text-lg border-2 border-transparent font-bold bg-slate-200 rounded-md flex items-center justify-center transition-colors"
								disabled>{cell > 0 ? cell : ""}</button
							>
						{:else}
							<button
								class="w-9 h-9 text-lg border-2 border-dashed border-transparent hover:border-blue-400 bg-slate-200 rounded-md flex items-center justify-center transition-colors"
								on:click={() => {
									writeNumberInCell({ rowIndex: i, colIndex: j });
									checkIsCellValid({ rowIndex: i, colIndex: j });
								}}
								class:text-slate-500={removedVals.find(
									(v) => v.rowIndex == i && v.colIndex == j,
								).isValid}
								class:text-rose-500={removedVals.find(
									(v) => v.rowIndex == i && v.colIndex == j,
								).isValid == false}
							>
								{cell > 0 ? cell : ""}
							</button>
						{/if}
					{/each}
				</div>
			{/each}

			<div
				class="h-full w-1 rounded-full bg-slate-300 absolute left-[7.25rem]"
			/>
			<div
				class="h-full w-1 rounded-full bg-slate-300 absolute right-[7.25rem]"
			/>
			<div
				class="h-1 w-full rounded-full bg-slate-300 absolute top-[7.25rem]"
			/>
			<div
				class="h-1 w-full rounded-full bg-slate-300 absolute bottom-[7.25rem]"
			/>
		</div>

		<div class="grid grid-cols-5 md:grid-cols-3 gap-2 w-fit mx-auto">
			{#each { length: 9 } as _, i}
				<button
					class="w-14 h-14 rounded-full border-2 hover:border-blue-400 flex items-center justify-center text-xl font-bold transition-colors"
					class:bg-blue-400={selectedNumber == i + 1}
					class:border-blue-400={selectedNumber == i + 1}
					class:border-slate-200={selectedNumber != i + 1}
					class:text-slate-100={selectedNumber == i + 1}
					on:click={() => setSelectedNumber(i + 1)}>{i + 1}</button
				>
			{/each}

			<button
				class="w-14 h-14 rounded-full border-2 hover:border-blue-400 flex items-center justify-center text-xl font-bold transition-colors md:col-start-2"
				class:bg-blue-400={selectedNumber == 0}
				class:border-blue-400={selectedNumber == 0}
				class:border-slate-200={selectedNumber != 0}
				class:text-slate-100={selectedNumber == 0}
				on:click={() => setSelectedNumber(0)}>X</button
			>
		</div>
	</div>

	<Portal>
		{#if isWon}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				transition:fade
				on:click={() => (isWon = false)}
				class="h-full w-full absolute inset-0 flex items-center justify-center bg-slate-700/50"
			>
				<div
					on:click|stopPropagation
					class="bg-slate-100 rounded-lg overflow-hidden"
				>
					<div class="p-8">
						<h2 class="text-2xl font-bold">Completed 🎉</h2>
					</div>

					<div class="flex items-center">
						<button
							on:click={() => {
								isWon = false;
							}}
							class="w-full px-6 py-2 font-bold rounded-br-lg bg-blue-400 hover:bg-blue-300 active:bg-blue-500 text-slate-100 transition-colors"
							>Confirm</button
						>
					</div>
				</div>
			</div>
		{/if}
	</Portal>
</main>

<svelte:window on:keydown={handleKeyboardSelectNumber} />
