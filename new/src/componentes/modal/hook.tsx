import { createRoot, type Root } from "react-dom/client";
import Modal from "./modal";
import type { IModalOptions } from "./modal.types";

const activeModals: { close: () => void }[] = [];

export const closeModal = () => {
 const lastModal = activeModals[activeModals.length - 1];
 lastModal?.close();
};

const showModal = <H, C, A>(options: IModalOptions<H, C, A>) => {
 if (typeof document === "undefined") {
  return { close: () => undefined };
 }

 const container = document.createElement("div");
 container.classList.add("hybrid-modal-host");
 document.body.appendChild(container);

 const root: Root = createRoot(container);
 let triggerCloseAnimation: (() => void) | null = null;
 let destroyed = false;

 const destroy = () => {
  if (destroyed) {
   return;
  }

  destroyed = true;

  const index = activeModals.findIndex(
   (modal) => modal.close === handleImperativeClose,
  );

  if (index !== -1) {
   activeModals.splice(index, 1);
  }

  options.onClose?.();
  root.unmount();

  if (document.body.contains(container)) {
   document.body.removeChild(container);
  }
 };

 const handleImperativeClose = () => {
  if (destroyed) {
   return;
  }

  if (triggerCloseAnimation) {
   triggerCloseAnimation();
   return;
  }

  destroy();
 };

 activeModals.push({ close: handleImperativeClose });

 root.render(
  <Modal
   options={options}
   onClose={destroy}
   registerCloseAnimation={(trigger) => {
    triggerCloseAnimation = trigger;
   }}
  />,
 );

 return { close: handleImperativeClose };
};

export default showModal;
