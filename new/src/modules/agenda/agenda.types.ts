export const AGENDA_CLAIMS = {
 view: { claimType: "recurso.agenda", claimValue: "visualizar" },
 create: { claimType: "recurso.agenda", claimValue: "criar" },
 update: { claimType: "recurso.agenda", claimValue: "editar" },
 delete: { claimType: "recurso.agenda", claimValue: "excluir" },
 invite: { claimType: "recurso.agenda", claimValue: "convidar" },
 respond: { claimType: "recurso.agenda", claimValue: "responder" },
} as const;

export type CalendarEventStatus = "scheduled" | "confirmed" | "cancelled" | "completed";

export type CalendarEvent = {
 id: string;
 title: string;
 description: string | null;
 startsAt: string;
 endsAt: string;
 allDay: boolean;
 status: CalendarEventStatus;
 location: string | null;
 ownerId: string;
 isPublic: boolean;
 createdAt?: string;
 updatedAt?: string;
};

export type CalendarEventInput = {
 title: string;
 description?: string | null;
 startsAt: string;
 endsAt: string;
 allDay: boolean;
 status: CalendarEventStatus;
 location?: string | null;
 isPublic: boolean;
};

export type CalendarEventFilters = {
 search?: string;
 startsFrom?: string;
 startsTo?: string;
 status?: CalendarEventStatus | "all";
 page?: number;
 size?: number;
};

export type CalendarEventList = {
 items: CalendarEvent[];
 total: number;
 page: number;
 size: number;
};

export type CalendarEventInviteInput = {
 userIds: string[];
 message?: string | null;
};

export type CalendarEventResponse = "accepted" | "declined" | "tentative";

export type CalendarEventRespondInput = {
 response: CalendarEventResponse;
 comment?: string | null;
};
