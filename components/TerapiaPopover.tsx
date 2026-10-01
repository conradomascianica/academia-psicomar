import { LinkButton } from '@/components/ui/Button';
/** Compatibility component: all former therapist selectors now start admission. */
export function TerapiaPopover({className,etiqueta='Solicitar admisión'}:{className?:string;etiqueta?:string;alineacion?:'izquierda'|'derecha'|'centro';haciaArriba?:boolean}){return <LinkButton href="/terapia#solicitud" className={className}>{etiqueta}</LinkButton>;}
