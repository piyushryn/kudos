import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-7">
      <h1 className="text-[clamp(1.35rem,2.5vw,1.65rem)] font-semibold leading-tight tracking-tight text-slate-900">
        {title}
      </h1>
      {description != null && description !== "" ? (
        <div className="mt-2 max-w-[52ch] text-[0.95rem] text-slate-500">{description}</div>
      ) : null}
    </header>
  );
}
