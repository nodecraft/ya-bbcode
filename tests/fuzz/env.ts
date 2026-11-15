// Env knobs so the CI smoke run and longer local runs share one suite.
function intFromEnv(name: string, fallback: number, min: number): number {
	const raw = process.env[name];
	if (!raw) {
		return fallback;
	}
	const value = Number.parseInt(raw, 10);
	if (!Number.isSafeInteger(value) || value < min) {
		throw new TypeError(`${name} must be an integer >= ${min}, got: ${raw}`);
	}
	return value;
}

const runs = intFromEnv('FUZZ_RUNS', 1000, 1);
// A random seed per run explores new inputs; logging it lets a failure be replayed exactly, including a seed of 0.
const seed = intFromEnv('FUZZ_SEED', Date.now() % 2_147_483_647, 0);

console.info(`[fuzz] seed=${seed} runs=${runs} (replay with FUZZ_SEED=${seed})`);

export const fuzzParams = { seed, numRuns: runs };
