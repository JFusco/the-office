/**
 * Entry of the deployment controller. It runs from the pinned release tree, started by
 * `pnpm office deploy`. The data root must be given before any Office module is loaded: this file
 * imports nothing, so a missing data root can never fall back to the release directory's own.
 */
if (!process.env.OFFICE_DATA_ROOT) {
    console.error('The deployment controller needs OFFICE_DATA_ROOT; start it with pnpm office deploy');
    process.exit(2);
}
const { runController } = await import('./controller-runtime');
process.exitCode = await runController(process.argv.slice(2));
export {};
