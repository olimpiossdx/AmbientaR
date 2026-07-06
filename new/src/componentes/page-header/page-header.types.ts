import type React from "react";

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
 eyebrow?: React.ReactNode;
 title: React.ReactNode;
 description?: React.ReactNode;
 actions?: React.ReactNode;
}
