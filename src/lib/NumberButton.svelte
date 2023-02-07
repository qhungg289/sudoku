<script>
	export let selectedNumber;
	export let displayNumber;

	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();
</script>

<button
	class="w-14 md:w-16 h-14 md:h-16 rounded-full border-2 betterhover:hover:border-teal-400 active:bg-teal-400 active:text-slate-100 dark:active:text-zinc-800 focus:outline-none focus-visible:border-teal-400 flex items-center justify-center text-2xl md:text-3xl font-bold transition-colors"
	class:bg-teal-400={selectedNumber == displayNumber}
	class:border-teal-400={selectedNumber == displayNumber}
	class:border-slate-200={selectedNumber != displayNumber}
	class:dark:border-zinc-700={selectedNumber != displayNumber}
	class:text-slate-100={selectedNumber == displayNumber}
	class:dark:text-zinc-800={selectedNumber == displayNumber}
	class:md:col-start-2={displayNumber == 0}
	on:click={() => dispatch("click")}
>
	<slot />
</button>
