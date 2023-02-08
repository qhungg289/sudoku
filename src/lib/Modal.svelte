<script>
	export let cancelable = false;
	export let confirmable = false;

	import { fade } from "svelte/transition";
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	transition:fade
	on:click={() => dispatch("clickoutside")}
	class="h-full w-full absolute inset-0 flex items-center justify-center bg-slate-700/50 dark:bg-zinc-900/50 backdrop-blur"
>
	<div
		on:click|stopPropagation
		class="bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg overflow-hidden w-4/5 max-w-lg"
	>
		<div class="p-8">
			<div class="text-base md:text-lg text-center">
				<slot name="content" />
			</div>
		</div>

		<div class="flex items-center">
			{#if cancelable}
				<button
					on:click={() => dispatch("cancel")}
					class="w-full px-6 py-2 font-bold rounded-bl-md bg-slate-200 dark:bg-zinc-700 hover:opacity-80 active:opacity-100 transition-all"
					>Cancel</button
				>
			{/if}

			{#if confirmable}
				<button
					on:click={() => dispatch("confirm")}
					class="w-full px-6 py-2 font-bold rounded-br-md bg-gradient-to-r from-teal-400 to-sky-400 hover:opacity-80 active:opacity-100 text-slate-100 dark:text-zinc-800 transition-all"
					>Confirm</button
				>
			{/if}
		</div>
	</div>
</div>
