import React from "react";

export type HelperVariant = "info" | "warning" | "error" | "success" | "neutral";

export interface IHelperTextApi {
 setMessage: (message: React.ReactNode) => void;
 setStatus: (status: HelperVariant) => void;
 set: (message: React.ReactNode, status?: HelperVariant) => void;
 clear: () => void;
}

export type HelperControllerProps = {
 id?: string;
 attach: (helper: IHelperTextApi) => void;
 initialMessage?: React.ReactNode;
 initialStatus?: HelperVariant;
 className?: string;
};
