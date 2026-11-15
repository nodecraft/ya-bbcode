// Env knobs so the CI smoke run and longer local runs share one suite.
function positiveIntFromEnv(name: string, fallback: number): number {
	const raw = process.env[name];
	if (!raw) {
		return fallback;
	}
	const value = Number.parseInt(raw, 10);
	if (!Number.isSafeInteger(value) || value <= 0) {
		throw new TypeError(`${name} must be a positive integer, got: ${raw}`);
	}
	return value;
}

const runs = positiveIntFromEnv('FUZZ_RUNS', 1000);
// A random seed per run explores new inputs; logging it lets a failure be replayed exactly.
const seed = positiveIntFromEnv('FUZZ_SEED', Date.now() % 2_147_483_647);

console.info(`[fuzz] seed=${seed} runs=${runs} (replay with FUZZ_SEED=${seed})`);

export const fuzzParams = { seed, numRuns: runs };
