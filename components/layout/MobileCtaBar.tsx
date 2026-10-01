import Link from "next/link";
import { TerapiaPopover } from "@/components/TerapiaPopover";
import { IconoFormacion } from "@/components/ui/iconos";

/** Barra fija inferior en mobile con los dos caminos principales. */
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-mar-100 bg-white/95 px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <TerapiaPopover
          className="flex-1 [&>button]:w-full"
          alineacion="centro"
          haciaArriba
        />
        <Link
          href="/academia"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-mar-300 px-4 py-2.5 text-sm font-medium text-mar-800"
        >
          <IconoFormacion width={18} height={18} />
          Academia
        </Link>
      </div>
    </div>
  );
}
