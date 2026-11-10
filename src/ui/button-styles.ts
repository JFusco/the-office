/** One action-control geometry and interaction palette for buttons and button links. */
const base = 'inline-flex items-center gap-control-gap rounded-control border px-control-inline py-control-block text-button font-emphasis aria-[current=page]:border-control-hover-line aria-[current=page]:bg-roster-hover [&>svg]:size-control-icon [&>svg]:shrink-0';
const variants = {
    primary: 'border-transparent bg-action text-action-ink shadow-button not-disabled:hover:bg-action-hover',
    secondary: 'border-secondary-line bg-secondary text-ink not-disabled:hover:border-control-hover-line not-disabled:hover:bg-secondary-hover',
};
export type ButtonVariant = keyof typeof variants;
export type ButtonLayout = 'action' | 'row';
export function buttonClasses(variant: ButtonVariant = 'secondary', layout: ButtonLayout = 'action') {
    return `${base} ${layout === 'row' ? 'min-h-control-height justify-between whitespace-normal text-left' : 'h-control-height justify-center whitespace-nowrap'} ${variants[variant]}`;
}
