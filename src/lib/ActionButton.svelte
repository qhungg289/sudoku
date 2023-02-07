<script>
	export let disabled = false;

	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();
</script>

<button
	{disabled}
	on:click={() => dispatch("click")}
	class="px-2 py-2 border-2 border-slate-200 focus:outline-none dark:border-zinc-700 betterhover:hover:border-teal-400 enabled:active:bg-teal-400 enabled:active:border-teal-400 enabled:active:text-slate-100 dark:enabled:active:text-zinc-800 disabled:hover:border-slate-200 dark:disabled:hover:border-zinc-700 disabled:text-slate-300 dark:disabled:text-zinc-600 disabled:cursor-not-allowed focus-visible:border-teal-400 rounded-full transition-colors"
>
	<slot />
</button>
