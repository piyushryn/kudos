import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="pageHeader">
      <h1 className="pageTitle">{title}</h1>
      {description != null && description !== "" ? (
        <div className="pageDescription">{description}</div>
      ) : null}
    </header>
  );
}
