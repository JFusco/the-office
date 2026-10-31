import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from './icons';
export const cx=(...parts:(string|false|null|undefined)[])=>parts.filter(Boolean).join(' ');
/** Visible keyboard focus for every interactive element. */
export const focusRing='focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus';
const behavior='cursor-pointer transition-colors reduce-motion:transition-none disabled:cursor-wait disabled:opacity-50';
/** Shared hover/focus behavior: pointer, the 150ms color transition (off for reduced motion), focus ring and disabled state. */
export const interactive=`${behavior} ${focusRing}`;
/** Scene labels sit over the 3D room: their ring uses a darker focus color with 3:1 against the room surfaces. */
export const interactiveScene=`${behavior} focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus-scene`;
/** The same behavior on dark surfaces (the toast), with the inverse focus color. */
export const interactiveOnDark=`${behavior} focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus-inverse`;
/** Form control behavior shared by inputs, textareas and selects; callers add the role's border, surface and focus colors. */
export const fieldBehavior='border transition-colors reduce-motion:transition-none enabled:hover:border-field-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-4';
/** Native checkbox (system accent unless the caller adds one): hover darkens the control, focus uses the shared ring. */
export const checkbox=`size-4 shrink-0 cursor-pointer transition-[filter] reduce-motion:transition-none enabled:hover:brightness-90 disabled:cursor-wait disabled:opacity-50 ${focusRing}`;
/** Disclosure summary rows. */
export const summary=`cursor-pointer rounded-4 underline decoration-transparent underline-offset-2 transition-colors reduce-motion:transition-none hover:text-link hover:decoration-current ${focusRing}`;

const buttonVariants={
  primary:'bg-action text-action-ink shadow-button enabled:hover:bg-action-hover',
  secondary:'border border-secondary-line bg-secondary enabled:hover:border-control-hover-line enabled:hover:bg-secondary-hover',
};
type ButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{variant?:keyof typeof buttonVariants;full?:boolean};
/** Primary and secondary actions. Spacing around the button belongs to the caller. */
export const Button=forwardRef<HTMLButtonElement,ButtonProps>(function Button({variant='secondary',full=false,className,type='button',...props},ref){
  return <button ref={ref} type={type} className={cx('inline-flex items-center justify-center gap-2 rounded-7 px-4 py-3 text-11 font-emphasis',full&&'w-full',buttonVariants[variant],interactive,className)} {...props}/>;
});
export const IconButton=forwardRef<HTMLButtonElement,ButtonHTMLAttributes<HTMLButtonElement>&{'aria-label':string}>(function IconButton({className,type='button',...props},ref){
  return <button ref={ref} type={type} className={cx('inline-flex items-center justify-center rounded-7 p-1.5 text-icon enabled:hover:bg-icon-hover',interactive,className)} {...props}/>;
});

const tagTones:Record<string,string>={
  neutral:'border-tag-line bg-tag text-tag-ink',
  blocked:'border-tag-blocked-line bg-tag-blocked text-tag-blocked-ink',
  working:'border-tag-working-line bg-tag-working text-tag-working-ink',
  passed:'border-tag-passed-line bg-tag-passed text-tag-passed-ink',
  waiting:'border-tag-waiting-line bg-tag-waiting text-tag-waiting-ink',
};
/** Status text badge. Any status other than blocked/working/passed/waiting renders neutral; the text carries the meaning. */
export function Tag({tone='neutral',className,children}:{tone?:string;className?:string;children:ReactNode}){
  return <span className={cx('inline-flex items-center whitespace-nowrap rounded-5 border px-2 py-1 text-8 leading-snug',tagTones[tone]??tagTones.neutral,className)}>{children}</span>;
}

const dotTones:Record<string,string>={
  idle:'bg-status-idle',passed:'bg-status-idle',working:'bg-status-working ring-3 ring-status-working-halo',
  waiting:'bg-status-waiting',blocked:'bg-status-blocked',disconnected:'bg-status-disconnected',
};
/** Decorative status color. Pair it with visible or accessible status text. */
export function StatusDot({status,size='sm',className}:{status?:string;size?:'sm'|'lg';className?:string}){
  return <span aria-hidden="true" className={cx('inline-block shrink-0 rounded-full',size==='lg'?'size-2.75':'size-1.5',dotTones[status||'']??'bg-status-unknown',className)}/>;
}

/** Native select with an inset decorative chevron. Forced-colors mode restores the system control.
    Callers pass the role's border/surface colors; `focusClassName` keeps a role's own focus color. */
export function Select({className,wrapperClassName,iconClassName,focusClassName='focus-visible:outline-focus',children,...props}:SelectHTMLAttributes<HTMLSelectElement>&{wrapperClassName?:string;iconClassName?:string;focusClassName?:string}){
  return <span className={cx('relative inline-flex min-w-0',wrapperClassName)}>
    <select className={cx('w-full min-w-0 cursor-pointer appearance-none pr-9.5 forced-colors:appearance-auto',fieldBehavior,focusClassName,className)} {...props}>{children}</select>
    <ChevronDown size={16} className={cx('pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-select-chevron forced-colors:hidden',iconClassName)}/>
  </span>;
}

/** Link behavior without color, for links that keep a context color. */
export const linkBase=`inline-flex items-center gap-1.5 rounded-3 underline decoration-transparent hover:decoration-current ${interactive}`;
export const linkClass=`${linkBase} text-link`;
export function TextLink({className,...props}:AnchorHTMLAttributes<HTMLAnchorElement>){
  return <a className={cx(linkClass,className)} {...props}/>;
}

const noticeTones={warning:'border-notice-line bg-notice text-notice-ink',tour:'border-notice-tour-line bg-notice-tour text-notice-tour-ink'};
export function Notice({tone='warning',className,children,...props}:HTMLAttributes<HTMLDivElement>&{tone?:keyof typeof noticeTones}){
  return <div className={cx('flex items-start gap-2 rounded-7 border p-4 text-10 wrap-anywhere',noticeTones[tone],className)} {...props}>{children}</div>;
}
/** Leading icon class for Notice content. */
export const noticeIcon='mt-0.5 shrink-0';

/** Drawer and panel title (h2). */
export function PanelTitle({size='lg',className,children,...props}:HTMLAttributes<HTMLHeadingElement>&{size?:'lg'|'md'}){
  return <h2 className={cx('font-display font-heading tracking-heading leading-heading',size==='lg'?'text-29':'text-23',className)} {...props}>{children}</h2>;
}
/** Section heading inside a drawer (h3). Margins belong to the caller. */
export function SectionTitle({className,children,...props}:HTMLAttributes<HTMLHeadingElement>){
  return <h3 className={cx('flex items-center gap-2 text-13 font-heading',className)} {...props}>{children}</h3>;
}
export function Count({children}:{children:ReactNode}){
  return <span className="rounded-5 bg-count px-1.5 py-0.5 text-11">{children}</span>;
}
const cardTones={pipeline:'border-card-line bg-card',finding:'border-finding-line bg-finding'};
/** Drawer card: pipeline/queue cards, or the finding/evidence tone. */
export function Card({as:Element='div',tone='pipeline',className,children}:{as?:'div'|'article';tone?:keyof typeof cardTones;className?:string;children:ReactNode}){
  return <Element data-card className={cx('my-3 flex min-w-0 flex-col items-stretch gap-3 rounded-7 border p-4 wrap-anywhere',cardTones[tone],className)}>{children}</Element>;
}
/** Separated content block inside a drawer: 24px section rhythm. */
export const sectionClass='mt-6 border-t border-section-rule pt-6';
export function Section({className,children,...props}:HTMLAttributes<HTMLElement>){
  return <section className={cx(sectionClass,className)} {...props}>{children}</section>;
}
const panelIconTones={mail:'bg-panel-icon text-panel-icon-ink',azure:'bg-panel-icon-azure text-panel-icon-azure-ink',review:'bg-panel-icon-review text-panel-icon-review-ink'};
export function PanelIcon({tone='mail',children}:{tone?:keyof typeof panelIconTones;children:ReactNode}){
  return <div className={cx('mb-5 grid size-11.75 place-items-center rounded-13',panelIconTones[tone])}>{children}</div>;
}
/** Small uppercase label; callers add size and color. */
export const eyebrow='flex items-center gap-2 font-heading tracking-eyebrow';
/** Secondary drawer copy. */
export const mutedCopy='text-12 leading-body text-muted';
export const errorText='text-9 text-error wrap-anywhere';
/** Selectable card row (outbox items, queue items). */
export const cardButton=`my-2.5 flex w-full flex-col items-start gap-3 rounded-9 border p-4 text-left text-card-button-ink ${interactive}`;
export const cardButtonIdle='border-card-button-line bg-card-button hover:border-card-button-hover-line hover:bg-card-button-hover';
export const cardButtonSelected='border-card-button-selected-line bg-card-button-selected';
/** Envelope-style ticket card (desk ticket, project lane items). */
export const envelopeCard=`relative my-2.5 flex w-full flex-col gap-2 rounded-8 border border-envelope-line bg-linear-135/srgb from-envelope-from to-envelope-to p-4 text-left shadow-envelope hover:border-envelope-hover ${interactive}`;
/** Text inputs and textareas: a 3:1 boundary (WCAG 1.4.11), hover and focus. Callers add padding and surface. */
export const field=`w-full min-w-0 border-field-line ${fieldBehavior}`;
export const fieldFocus='focus-visible:outline-focus';
export const checkLabel='flex w-full items-start gap-2.5 leading-normal';
