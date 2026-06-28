import React from "react";
import { cn } from "@sglara/cn";
import Alert from "../alert";
import { createInstanceId } from "../../utils/object";
import {
 FORM_ALERT_REGION_API,
 type ApiServiceNotification,
 type IElementWithFormAlertRegionAPI,
 type IFormAlertRegionAPI,
 type IFormAlertRegionProps,
} from "./propTypes.form";

function notificationStatusToAlertVariant(status: ApiServiceNotification["status"]) {
 if (status === "success") {
  return "success";
 }

 if (status === "error") {
  return "error";
 }

 if (status === "warning") {
  return "warning";
 }

 if (status === "info") {
  return "info";
 }

 return "neutral";
}

function getNotificationKey(notification: ApiServiceNotification, index: number): string {
 return notification.id ?? `${notification.status}-${index}`;
}

export const FormAlertRegion = React.forwardRef<HTMLDivElement, IFormAlertRegionProps>(
 ({ className, maxItems = 3, clearBeforeShow = true, ...props }, ref) => {
  const internalRef = React.useRef<HTMLDivElement>(null);
  const instanceIdRef = React.useRef(createInstanceId());
  const isMountedRef = React.useRef(false);
  const timersRef = React.useRef<Map<ApiServiceNotification, number>>(new Map());
  const [notifications, setNotifications] = React.useState<ApiServiceNotification[]>([]);

  const setRefs = React.useCallback((node: HTMLDivElement | null) => {
   internalRef.current = node;

   if (typeof ref === "function") {
    ref(node);
    return;
   }

   if (ref) {
    ref.current = node;
   }
  }, [ref]);

  const clearTimer = React.useCallback((notification: ApiServiceNotification) => {
   const timer = timersRef.current.get(notification);

   if (timer === undefined) {
    return;
   }

   window.clearTimeout(timer);
   timersRef.current.delete(notification);
  }, []);

  const clearTimers = React.useCallback(() => {
   timersRef.current.forEach((timer) => window.clearTimeout(timer));
   timersRef.current.clear();
  }, []);

  const removeNotification = React.useCallback((notification: ApiServiceNotification) => {
   clearTimer(notification);
   setNotifications((current) => current.filter((item) => item !== notification));
  }, [clearTimer]);

  const clear = React.useCallback(() => {
   clearTimers();
   setNotifications([]);
  }, [clearTimers]);

  const show = React.useCallback((nextNotifications: ApiServiceNotification[]) => {
   const visibleNotifications = nextNotifications
    .filter((notification) => notification.channels?.includes("alert"))
    .slice(0, maxItems);

   if (visibleNotifications.length === 0) {
    return;
   }

   if (clearBeforeShow) {
    clearTimers();
   }

   setNotifications((current) => {
    const merged = clearBeforeShow
     ? visibleNotifications
     : [...current, ...visibleNotifications];

    return merged.slice(Math.max(0, merged.length - maxItems));
   });

   visibleNotifications.forEach((notification) => {
    if (!notification.duration || notification.duration === Infinity) {
     return;
    }

    const timer = window.setTimeout(() => {
     timersRef.current.delete(notification);
     setNotifications((current) => current.filter((item) => item !== notification));
    }, notification.duration);

    timersRef.current.set(notification, timer);
   });
  }, [clearBeforeShow, clearTimers, maxItems]);

  React.useEffect(() => {
   isMountedRef.current = true;
   const element = internalRef.current;

   if (!element) {
    return () => {
     isMountedRef.current = false;
     clearTimers();
    };
   }

   const api: IFormAlertRegionAPI = {
    show,
    clear,
    instanceId: instanceIdRef.current,
    get isMounted() {
     return isMountedRef.current;
    },
   };

   const apiElement = element as IElementWithFormAlertRegionAPI;
   apiElement[FORM_ALERT_REGION_API] = api;

   element.dispatchEvent(new CustomEvent("form-alert-region:registered", {
    bubbles: true,
    detail: { instanceId: instanceIdRef.current },
   }));

   return () => {
    isMountedRef.current = false;
    clearTimers();

    if (apiElement[FORM_ALERT_REGION_API]?.instanceId === instanceIdRef.current) {
     delete apiElement[FORM_ALERT_REGION_API];
    }
   };
  }, [clear, clearTimers, show]);

  if (notifications.length === 0) {
   return (
    <div
     {...props}
     ref={setRefs}
     data-form-alert-region=""
     className={cn("hidden", className)}
    />
   );
  }

  return (
   <div
    {...props}
    ref={setRefs}
    data-form-alert-region=""
    className={cn("flex flex-col gap-3", className)}
   >
    {notifications.map((notification, index) => (
     <Alert
      key={getNotificationKey(notification, index)}
      variant={notificationStatusToAlertVariant(notification.status)}
      title={notification.title}
      onClose={notification.dismissible === false ? undefined : () => removeNotification(notification)}
     >
      {notification.message}
     </Alert>
    ))}
   </div>
  );
 },
);

FormAlertRegion.displayName = "FormAlertRegion";
