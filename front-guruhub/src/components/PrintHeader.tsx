"use client";

import { useAuthStore } from "@/store/auth.store";
import { useSchoolSettings } from "@/queries/schools.query";

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  metadata?: Array<{ label: string; value: string }>;
  orientation?: "portrait" | "landscape";
}

export function PrintHeader({ title, subtitle, metadata, orientation = "portrait" }: PrintHeaderProps) {
  const { currentUser } = useAuthStore();
  const { data: school } = useSchoolSettings();

  const foundation = school?.foundationName || "YAYASAN HANG TUAH";
  const regional = school?.regionalName || "PENGURUS CABANG SURABAYA";
  const name = school?.name || currentUser?.schoolName || "SMP HANG TUAH 5 SIDOARJO";
  const accreditation = school?.accreditation ? `Terakreditasi “ ${school.accreditation} “` : 'Terakreditasi “ A “';
  const address = school?.address || "PERUM TNI AL Blok B. 16 / 18 TELP. (031) 8060725, SIDOARJO 61721";
  const email = school?.email ? `Email : ${school.email}` : "Email : smpht5sda@gmail.com";
  const website = school?.website ? `website : ${school.website}` : "website : www.smphangtuah5sidoarjo.sch.id";
  const logo = school?.logoUrl || school?.kopSuratUrl || "/logo-hangtuah.png";

  const pageSizeStyle = orientation === "landscape" ? "330mm 210mm" : "210mm 330mm";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${orientation === "landscape" ? "landscape" : "portrait"};
            margin: 8mm 10mm;
          }
        }
      `}} />
      <div className="hidden print:block w-full mb-4 font-sans text-black">
        <div className="relative w-full text-center mb-2">
          {logo && (
            <img
              src={logo}
              alt="Logo Sekolah"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[70px] h-[70px] object-contain"
            />
          )}
          <div className="px-[75px]">
            <div className="font-bold text-[11pt] uppercase tracking-[0.5px] p-0 m-0" style={{ lineHeight: "1.05", margin: 0, padding: 0 }}>
              {foundation}
            </div>
            <div className="font-bold text-[11pt] uppercase p-0" style={{ lineHeight: "1.05", marginTop: "1px", marginBottom: 0, padding: 0 }}>
              {regional}
            </div>
            <div className="font-black text-[15pt] uppercase tracking-[1.5px] p-0" style={{ lineHeight: "1.05", marginTop: "1px", marginBottom: "1px", padding: 0 }}>
              {name}
            </div>
            <div className="font-bold text-[10.5pt] p-0 m-0" style={{ lineHeight: "1.05", margin: 0, padding: 0 }}>
              {accreditation}
            </div>
            <div className="font-bold text-[8.5pt] p-0" style={{ lineHeight: "1.05", marginTop: "1px", marginBottom: 0, padding: 0 }}>
              {address}
            </div>
            <div className="font-bold text-[8.5pt] text-[#002060] p-0 m-0" style={{ lineHeight: "1.05", margin: 0, padding: 0 }}>
              {email}, {website}
            </div>
          </div>
        </div>
        <div className="border-t-[3px] border-black border-b-[1px] h-[2px] mb-3.5 clear-both" />

        {/* Report Info */}
        <div className="text-center mb-4">
          <h2 className="text-base font-bold uppercase underline tracking-wider">{title}</h2>
          {subtitle && <p className="text-xs font-semibold uppercase mt-1">{subtitle}</p>}
        </div>

        {/* Metadata */}
        {metadata && metadata.length > 0 && (
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[10pt] mb-4">
            {metadata.map((item, idx) => (
              <div key={idx} className="flex">
                <span className="w-36 font-semibold text-black">{item.label}</span>
                <span className="mr-2 text-black">:</span>
                <span className="font-medium text-black">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
