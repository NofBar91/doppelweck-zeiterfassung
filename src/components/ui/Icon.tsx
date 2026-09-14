import type { SVGProps } from "react";
const paths = {
  clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></>,
  team: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/></>,
  list: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6m-6 5h6"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  bread: <><path d="M4 19c-2-1-3-4-2-7 1-5 6-8 10-6 4-2 9 1 10 6 1 3 0 6-2 7Z"/><path d="m7 9-2 4m8-5-2 5m8-4-2 4"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  truck: <><path d="M3 6h11v12H3zM14 10h4l3 4v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>,
  sun: <><path d="M3 18h18M5 14a7 7 0 0 1 14 0M12 2v3M3 6l2 2m16-2-2 2"/></>,
};
export default function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
