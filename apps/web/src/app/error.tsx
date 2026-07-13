'use client';

import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(circle_at_50%_0%,#F5F6FA_0%,#E9EBF2_60%,#E2E4ED_100%)]">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-[0_8px_30px_rgb(15,23,42,0.06)] p-9 animate-[fadeIn_0.4s_ease-out]">
          {/* Icon: broken connection, không dùng icon mặc định của antd */}
          <div className="mb-6 flex justify-center">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#E2E4ED" strokeWidth="2" />
              <path
                d="M20 26 L28 26 L24 34 L32 34"
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M36 30 L44 30"
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="1 6"
              />
              <circle cx="44" cy="30" r="2.5" fill="#DC2626">
                <animate
                  attributeName="opacity"
                  values="1;0.3;1"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>

          <h1 className="text-center text-xl font-semibold text-slate-900 tracking-tight">
            Đã có lỗi xảy ra
          </h1>
          <p className="mt-1.5 text-center text-sm text-slate-500">
            Một phần của trang không tải được như mong đợi.
          </p>

          {error?.message && (
            <div className="mt-5 rounded-lg bg-slate-900 px-4 py-3">
              <p className="font-mono text-[12.5px] leading-relaxed text-red-300 break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-1.5 font-mono text-[11px] text-slate-500">
                  mã lỗi: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="mt-7 flex gap-3">
            <Button className="flex-1" onClick={() => reset()}>
              Thử lại
            </Button>
            <Button type="primary" className="flex-1" onClick={() => router.push('/')}>
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
