import type { OwnerSteps } from '../contracts/owner-steps';
import { mutedCopy } from '../ui';

/** What only the owner can do: why the Office is stopped, the steps with their exact commands, and what shows it worked. */
export function OutboxOwnerSteps({ ownerSteps }: { ownerSteps: OwnerSteps }) {
    return <div className="grid gap-3" data-outbox-owner-steps>
        <p className="font-semibold">Only you can do this</p>
        <p className="text-13 leading-relaxed wrap-anywhere">{ownerSteps.why}</p>
        <ol className="grid list-decimal gap-3 pl-5 text-13 leading-relaxed">{ownerSteps.steps.map((step, index) => <li key={index}>
            <span>{step.text}</span>
            {step.run ? <code className="mt-1.5 block rounded-6 border border-line bg-paper px-3 py-2 font-mono text-12 select-all wrap-anywhere">{step.run}</code> : null}
        </li>)}</ol>
        <p className={mutedCopy}><b>You'll know it worked when:</b> {ownerSteps.doneWhen}</p>
    </div>;
}
