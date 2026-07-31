import { ShieldCheck, Ban, Timer, Lock, FileWarning } from "lucide-react";

const SECURITY_NOTES = [
  { icon: ShieldCheck, text: "Setiap dokumen dilindungi watermark unik yang dapat dilacak ke pengguna yang mengaksesnya!!" },
  { icon: Ban, text: "Dokumen tidak dapat diunduh atau di-screenshot tanpa izin — layar akan menghitam otomatis jika terdeteksi" },
  { icon: Timer, text: "Dokumen di dalam folder terhapus otomatis berdasarkan periode waktu yang dipilih ketika membuat folder atau sub-folder" },
  { icon: Lock, text: "Akses folder & dokumen dibatasi sesuai peran pengguna" },
  { icon: Lock, text: "Auditor hanya diberikan akses untuk melihat dokumen ( tidak bisa mengunduhnya )" },
  { icon: FileWarning, text: "Hanya file PDF, JPG, dan PNG yang bisa diupload — Word & Excel diblokir demi keamanan karena berisiko membawa macro berbahaya dan gampang dimanipulasi tanpa jejak" },
];

function MarqueeContent({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {SECURITY_NOTES.map(({ icon: Icon, text }, index) => (
        <span
          key={index}
          className="flex items-center gap-2 whitespace-nowrap px-6 text-[12.5px] font-bold text-white"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-white" />
          {text}
          <span className="ml-6 text-white/40">•</span>
        </span>
      ))}
    </div>
  );
}

export function SecurityMarquee() {
  return (
    <div className="group relative flex h-9 w-full shrink-0 items-center overflow-hidden bg-[#ea9b0c]">
      <div className="flex w-max animate-marquee-scroll motion-reduce:animate-none group-hover:[animation-play-state:paused]">
        <MarqueeContent />
        <MarqueeContent ariaHidden />
      </div>
    </div>
  );
}
