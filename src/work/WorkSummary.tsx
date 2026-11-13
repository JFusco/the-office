import { withoutIdentifiers } from '../office/without-identifiers';
import { shortSummary } from './work-summary';
import { cx, summary as summaryClass } from '../ui';
export function WorkSummary({detail:recorded,flush=false,className,textClassName}:{detail:string;flush?:boolean;className?:string;textClassName?:string}){
 const detail=withoutIdentifiers(recorded),summary=shortSummary(detail);
 return <div data-work-summary className={className}><p className={cx('leading-body',textClassName)}>{summary}</p>{detail&&summary!==detail?<details className={cx('text-12',flush?'mt-3':'mt-2 mb-3.5')}><summary className={cx(summaryClass,'text-muted')}>Evidence & session details</summary><p className={cx('leading-body whitespace-pre-wrap wrap-anywhere',flush&&'mt-3')}>{detail}</p></details>:null}</div>;
}
