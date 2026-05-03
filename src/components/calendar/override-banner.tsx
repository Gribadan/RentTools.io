"use client";

import { useI18n } from "@/lib/i18n/context";

export function OverrideBanner() {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-[#da3633]/30 bg-[#da3633]/5 p-3 flex items-center gap-3">
      <svg className="h-5 w-5 text-[#ef4444] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-[#e8e8ec]">{t("calendar.overrideMode")}</p>
        <p className="text-xs text-[#a0a0a8]">{t("calendar.overrideDesc")}</p>
      </div>
    </div>
  );
}
