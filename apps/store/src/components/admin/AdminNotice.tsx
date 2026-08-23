type AdminNoticeProps = {
  error?: string | string[];
  notice?: string | string[];
};

export function AdminNotice({ error, notice }: AdminNoticeProps) {
  const errorText = Array.isArray(error) ? error[0] : error;
  const noticeText = Array.isArray(notice) ? notice[0] : notice;

  if (!errorText && !noticeText) {
    return null;
  }

  return (
    <div
      className={
        errorText
          ? "rounded-[var(--radius-md)] border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
          : "rounded-[var(--radius-md)] border border-success/30 bg-success-bg px-4 py-3 text-sm font-medium text-success"
      }
      role={errorText ? "alert" : "status"}
    >
      {errorText ?? noticeText}
    </div>
  );
}
