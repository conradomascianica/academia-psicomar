import { LinkButton } from '@/components/ui/Button';
export function TerapiaBotones({tamano='md',sobreOscuro=false}:{tamano?:'sm'|'md'|'lg';sobreOscuro?:boolean}){return <LinkButton href="/terapia#solicitud" tamano={tamano} className={sobreOscuro?'bg-white text-mar-800 hover:bg-bruma':''}>Solicitar admisión</LinkButton>;}
