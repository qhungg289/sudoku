<script>
	import { onMount } from "svelte";

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
	let removedVals;
	let solvedBoard;
	let selectedNumber = 1;

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

	const writeNumberInCell = ({ rowIndex, colIndex }) => {
		mainBoard[rowIndex][colIndex] = selectedNumber;

		return removedVals.some(
			(v) =>
				v.rowIndex == rowIndex &&
				v.colIndex == colIndex &&
				v.val == selectedNumber,
		);
	};

	$: console.table(mainBoard);
	$: console.log({ selectedNumber });

	onMount(() => {
		newGame({ holes: 50 });
	});
</script>

<main class="mx-auto h-full flex flex-col items-center justify-around p-4">
	<div
		class="flex flex-col sm:flex-row items-center justify-between gap-4 w-full"
	>
		<h1 class="text-3xl sm:text-4xl font-bold">SUDOKU</h1>

		<button
			on:click={() => newGame({ holes: 50 })}
			class="px-6 py-3 bg-blue-400 hover:bg-blue-300 active:bg-blue-500 rounded-full font-bold text-slate-100 transition-colors"
			>NEW GAME</button
		>
	</div>

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
							class="w-9 h-9 text-lg border-2 border-transparent hover:border-blue-400 text-slate-500 bg-slate-200 rounded-md flex items-center justify-center transition-colors"
							on:click={() => {
								console.log({ row: i, col: j });
								console.log(writeNumberInCell({ rowIndex: i, colIndex: j }));
							}}>{cell > 0 ? cell : ""}</button
						>
					{/if}
				{/each}
			</div>
		{/each}

		<div class="h-full w-1 rounded-full bg-slate-300 absolute left-[7.25rem]" />
		<div
			class="h-full w-1 rounded-full bg-slate-300 absolute right-[7.25rem]"
		/>
		<div class="h-1 w-full rounded-full bg-slate-300 absolute top-[7.25rem]" />
		<div
			class="h-1 w-full rounded-full bg-slate-300 absolute bottom-[7.25rem]"
		/>
	</div>

	<div class="grid grid-cols-5 gap-2 w-fit mx-auto">
		{#each { length: 9 } as _, i}
			<button
				class="w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-colors"
				class:bg-blue-400={selectedNumber == i + 1}
				class:border-blue-400={selectedNumber == i + 1}
				class:border-slate-200={selectedNumber != i + 1}
				class:text-slate-100={selectedNumber == i + 1}
				on:click={() => setSelectedNumber(i + 1)}>{i + 1}</button
			>
		{/each}

		<button
			class="w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-colors"
			class:bg-blue-400={selectedNumber == 0}
			class:border-blue-400={selectedNumber == 0}
			class:border-slate-200={selectedNumber != 0}
			class:text-slate-100={selectedNumber == 0}
			on:click={() => setSelectedNumber(0)}>X</button
		>
	</div>
</main>
