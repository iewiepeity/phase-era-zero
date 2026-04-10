import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      {/* 標題區 */}
      <div className="mb-12 space-y-4">
        <p className="text-sm tracking-[0.3em] uppercase text-[#ff2e63] opacity-80">
          P.E. 02 年　賽德里斯
        </p>
        <h1
          className="text-5xl md:text-7xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          相變世紀
        </h1>
        <p
          className="text-2xl md:text-3xl tracking-widest text-[#c9d6df] opacity-70"
          style={{ fontFamily: "var(--font-noto-serif-tc), serif" }}
        >
          Zero
        </p>
        <p className="text-sm text-[#c9d6df] opacity-40 mt-6 tracking-wide">
          第二相體剛被世界發現　一個人失蹤了
        </p>
      </div>

      {/* 按鈕區 */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/chat"
          className="block w-full py-3 px-8 rounded border border-[#ff2e63] text-[#ff2e63] hover:bg-[#ff2e63] hover:text-[#0a0e1a] transition-colors duration-200 tracking-wider text-sm"
        >
          進入賽德里斯
        </Link>
        <Link
          href="/chat?guest=true"
          className="block w-full py-3 px-8 rounded border border-[#c9d6df]/30 text-[#c9d6df]/50 hover:border-[#c9d6df]/60 hover:text-[#c9d6df]/80 transition-colors duration-200 tracking-wider text-sm"
        >
          訪客試玩
        </Link>
      </div>

      {/* 底部小字 */}
      <p className="absolute bottom-8 text-xs text-[#c9d6df] opacity-20 tracking-widest">
        Phase 0　技術驗證中
      </p>
    </main>
  );
}
