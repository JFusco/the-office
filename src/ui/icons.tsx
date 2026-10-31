import { forwardRef } from 'react';
import {
  AlertCircle as AlertCircleIcon, ArrowRight as ArrowRightIcon, ArrowUpRight as ArrowUpRightIcon, Bell as BellIcon, Box as BoxIcon,
  Camera as CameraIcon, Check as CheckIcon, CheckCircle2 as CheckCircle2Icon, ChevronDown as ChevronDownIcon, ChevronRight as ChevronRightIcon,
  CircleHelp as CircleHelpIcon, Clock3 as Clock3Icon, ExternalLink as ExternalLinkIcon, FileText as FileTextIcon, GitPullRequest as GitPullRequestIcon,
  HeartPulse as HeartPulseIcon, Inbox as InboxIcon, LoaderCircle as LoaderCircleIcon, Maximize2 as Maximize2Icon, MessageCircle as MessageCircleIcon,
  Minus as MinusIcon, Pause as PauseIcon, Play as PlayIcon, Plus as PlusIcon, RefreshCw as RefreshCwIcon, RotateCcw as RotateCcwIcon,
  Send as SendIcon, Settings2 as Settings2Icon, X as XIcon, type LucideIcon, type LucideProps,
} from 'lucide-react';
// lucide-react 0.468 exposes icons to assistive technology by default. Every icon here is
// decorative: the surrounding control text or aria-label carries the accessible name.
function decorative(Icon:LucideIcon):LucideIcon{
  const Decorative=forwardRef<SVGSVGElement,LucideProps>((props,ref)=><Icon ref={ref} aria-hidden="true" focusable="false" {...props}/>);
  Decorative.displayName=Icon.displayName;
  return Decorative as LucideIcon;
}
export const AlertCircle=decorative(AlertCircleIcon),ArrowRight=decorative(ArrowRightIcon),ArrowUpRight=decorative(ArrowUpRightIcon),Bell=decorative(BellIcon),Box=decorative(BoxIcon);
export const Camera=decorative(CameraIcon),Check=decorative(CheckIcon),CheckCircle2=decorative(CheckCircle2Icon),ChevronDown=decorative(ChevronDownIcon),ChevronRight=decorative(ChevronRightIcon);
export const CircleHelp=decorative(CircleHelpIcon),Clock3=decorative(Clock3Icon),ExternalLink=decorative(ExternalLinkIcon),FileText=decorative(FileTextIcon),GitPullRequest=decorative(GitPullRequestIcon);
export const HeartPulse=decorative(HeartPulseIcon),Inbox=decorative(InboxIcon),LoaderCircle=decorative(LoaderCircleIcon),Maximize2=decorative(Maximize2Icon),MessageCircle=decorative(MessageCircleIcon);
export const Minus=decorative(MinusIcon),Pause=decorative(PauseIcon),Play=decorative(PlayIcon),Plus=decorative(PlusIcon),RefreshCw=decorative(RefreshCwIcon),RotateCcw=decorative(RotateCcwIcon);
export const Send=decorative(SendIcon),Settings2=decorative(Settings2Icon),X=decorative(XIcon);
