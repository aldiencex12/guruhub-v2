"use client";

import { useAuthStore } from "@/store/auth.store";

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  metadata?: Array<{ label: string; value: string }>;
}

export function PrintHeader({ title, subtitle, metadata }: PrintHeaderProps) {
  const { currentUser } = useAuthStore();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 330.2mm 215.9mm; /* F4 / Folio Landscape */
            margin: 12mm 15mm 15mm 15mm;
          }
        }
      `}} />
      <div className="hidden print:block w-full mb-6 font-sans">
        <div className="flex items-center justify-between border-b-[4px] border-black pb-1.5">
          {/* Left Logo (Yayasan Hang Tuah) */}
          <div className="w-24 h-24 shrink-0 flex items-center justify-center">
            <img src="/logo-hangtuah.png" alt="Logo Yayasan Hang Tuah" className="h-24 w-24 object-contain" />
          </div>

          {/* School details */}
          <div className="flex-1 text-center px-4 text-black">
            <h2 className="text-[15px] font-bold tracking-wide uppercase leading-tight">YAYASAN HANG TUAH PENGURUS</h2>
            <h2 className="text-[15px] font-bold tracking-wide uppercase leading-tight">DAERAH SURABAYA</h2>
            <h1 className="text-2xl font-black uppercase tracking-[0.12em] mt-1 mb-0.5 leading-none">
              SMP HANG TUAH 5 SIDOARJO
            </h1>
            <p className="text-sm font-semibold tracking-wide leading-tight">
              Terakreditasi &ldquo; A &rdquo;
            </p>
            <p className="text-xs font-bold mt-1 leading-tight">
              Perum TNI AL Blok B. 16 / 18 TELP. (031) 8060725, Sidoarjo 61721
            </p>
            <p className="text-[11px] font-bold text-[#003399] mt-0.5 leading-tight">
              Email : smpht5sda@gmail.com, website : www.smphangtuah5sidoarjo.sch.id
            </p>
          </div>

          {/* Right Spacer to center center-content */}
          <div className="w-24 shrink-0" />
        </div>
        {/* Double line separator */}
        <div className="border-b-[1px] border-black mt-[2px] mb-6" />

      {/* Report Info */}
      <div className="text-center mb-6">
        <h2 className="text-base font-bold uppercase underline tracking-wider">{title}</h2>
        {subtitle && <p className="text-xs font-semibold uppercase mt-1">{subtitle}</p>}
      </div>

      {/* Metadata */}
      {metadata && metadata.length > 0 && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs mb-4 pb-2 border-b border-gray-200">
          {metadata.map((item, idx) => (
            <div key={idx} className="flex">
              <span className="w-28 font-semibold text-gray-700">{item.label}</span>
              <span className="mr-2">:</span>
              <span className="font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
