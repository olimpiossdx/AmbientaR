// hook/use-checkbox.ts
import React from "react";
import { atualizarMestre } from "../utils/object";

/**
 * Representa um grupo de checkboxes controlados por um mestre.
 */
interface MasterGroup {
  /** Checkbox mestre com name iniciando por "master-". */
  master: HTMLInputElement;
  /** Checkboxes controlados pelo mestre. Mantido incrementalmente pelo observer. */
  checkboxes: Set<HTMLInputElement>;
  /** Seletor CSS usado como fallback e no scan inicial. */
  selector: string;
  /** Tipo de grupo: indexado (itens.0.selecionado) ou grupo (categorias). */
  type: "indexed" | "group";
  /** Nome base do grupo (ex.: "categorias" ou "itens.selecionado"). */
  baseName: string;
}

interface UseCheckboxMasterOptions {
  /** Referência para o elemento <form>. */
  formRef: React.RefObject<HTMLFormElement | null>;
}

interface CheckboxMasterAPI {
  /** Configura listeners, observer especializado e primeiro scan do formulário. */
  setup: (form: HTMLFormElement) => void;
  /** Remove observer/listeners e limpa o estado interno. */
  cleanup: () => void;
  /** Recalcula todos os grupos a partir do DOM. Fallback seguro. */
  refresh: (form: HTMLFormElement) => void;
  /** Chamado após reset do formulário para refletir defaultChecked. */
  onReset: () => void;
  /** Handler delegado para mudanças nos checkboxes controlados. */
  handleCheckboxChange: (event: Event) => void;
  /** Escaneia o formulário em busca de novos mestres. */
  scanForMasters: (form: HTMLFormElement) => void;
}

function isCheckboxElement(element: Element | null): element is HTMLInputElement {
  return element instanceof HTMLInputElement && element.type === "checkbox" && Boolean(element.name);
}

function collectCheckboxesFromNode(node: Node): HTMLInputElement[] {
  if (!(node instanceof HTMLElement)) {
    return [];
  }

  const checkboxes: HTMLInputElement[] = [];

  if (isCheckboxElement(node)) {
    checkboxes.push(node);
  }

  node.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name]').forEach((element) => {
    if (isCheckboxElement(element)) {
      checkboxes.push(element);
    }
  });

  return checkboxes;
}

function escapeCssValue(value: string): string {
  const css = globalThis.CSS as { escape?: (value: string) => string } | undefined;

  if (typeof css?.escape === "function") {
    return css.escape(value);
  }

  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function analyzeMasterName(masterName: string): Pick<MasterGroup, "selector" | "type" | "baseName"> {
  const groupName = masterName.replace(/^master-/, "");

  if (groupName.includes(".")) {
    const parts = groupName.split(".");
    const prefix = parts[0];
    const suffix = parts.slice(1).join(".");

    return {
      selector: `input[type="checkbox"][name^="${escapeCssValue(prefix)}."][name$="${escapeCssValue(suffix)}"]`,
      type: "indexed",
      baseName: groupName,
    };
  }

  return {
    selector: `input[type="checkbox"][name="${escapeCssValue(groupName)}"]`,
    type: "group",
    baseName: groupName,
  };
}

function isMasterCheckbox(checkbox: HTMLInputElement): boolean {
  return checkbox.name.startsWith("master-");
}

/**
 * Hook interno que gerencia automaticamente checkboxes mestres.
 *
 * Convenção:
 * - Checkboxes com `name` iniciando por "master-" são tratados como mestres.
 * - O sufixo após "master-" identifica o grupo controlado:
 *   - "categorias" controla checkboxes com `name="categorias"`.
 *   - "itens.selecionado" controla `itens.0.selecionado`, `itens.1.selecionado`, etc.
 *
 * Performance:
 * - O scan inicial monta os grupos.
 * - Um MutationObserver especializado acompanha apenas checkboxes adicionados/removidos.
 * - O clique no mestre usa `group.checkboxes`, com fallback para `refreshGroup` se houver nó desconectado.
 * - Os eventos `change` individuais dos slaves continuam sendo disparados para preservar handlers de tela.
 */
export function useCheckboxMaster({ formRef }: UseCheckboxMasterOptions): CheckboxMasterAPI {
  const masterGroupsRef = React.useRef<Map<HTMLInputElement, MasterGroup>>(new Map());
  const checkboxToMasterRef = React.useRef<WeakMap<HTMLInputElement, HTMLInputElement>>(new WeakMap());
  const setupFormRef = React.useRef<HTMLFormElement | null>(null);
  const observerRef = React.useRef<MutationObserver | null>(null);
  const resetTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMasterBatchUpdatingRef = React.useRef(false);

  const handleCheckboxChange = React.useCallback((event: Event) => {
    const target = event.target;
  
    if (!(target instanceof Element) || !isCheckboxElement(target)) {
      return;
    }
  
    const checkbox = target;
  
    const master = checkboxToMasterRef.current.get(checkbox);
    if (!master) {
      return;
    }
  
    const group = masterGroupsRef.current.get(master);
    if (!group || isMasterBatchUpdatingRef.current) {
      return;
    }
  
    atualizarMestre(master, group.checkboxes);
  }, []);

  const refreshGroup = React.useCallback((group: MasterGroup, form: HTMLFormElement) => {
    const currentCheckboxes = Array.from(form.querySelectorAll<HTMLInputElement>(group.selector)).filter(
      (checkbox) => checkbox !== group.master && isCheckboxElement(checkbox),
    );

    group.checkboxes.forEach((checkbox) => {
      if (!currentCheckboxes.includes(checkbox)) {
        checkbox.removeEventListener("change", handleCheckboxChange);
        checkboxToMasterRef.current.delete(checkbox);
      }
    });

    currentCheckboxes.forEach((checkbox) => {
      if (!group.checkboxes.has(checkbox)) {
        checkbox.addEventListener("change", handleCheckboxChange);
      }

      checkboxToMasterRef.current.set(checkbox, group.master);
    });

    group.checkboxes = new Set(currentCheckboxes);

    atualizarMestre(group.master, group.checkboxes);
  }, [handleCheckboxChange]);

  const handleMasterClick = React.useCallback((event: Event) => {
    const master = event.currentTarget as HTMLInputElement;
    const group = masterGroupsRef.current.get(master);

    if (!group) {
      return;
    }

    const form = master.closest("form");
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    let currentCheckboxes = Array.from(group.checkboxes).filter((checkbox) => checkbox.isConnected);

    if (currentCheckboxes.length !== group.checkboxes.size) {
      refreshGroup(group, form);
      currentCheckboxes = Array.from(group.checkboxes).filter((checkbox) => checkbox.isConnected);
    }

    const newChecked = master.checked;

    if (currentCheckboxes.length === 0) {
      master.checked = false;
      master.indeterminate = false;
      return;
    }

    isMasterBatchUpdatingRef.current = true;

    try {
      currentCheckboxes.forEach((checkbox) => {
        checkbox.checked = newChecked;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      });
    } finally {
      isMasterBatchUpdatingRef.current = false;
    }

    master.checked = newChecked;
    master.indeterminate = false;
  }, [refreshGroup]);

  const unregisterCheckbox = React.useCallback((checkbox: HTMLInputElement) => {
    if (isMasterCheckbox(checkbox)) {
      const group = masterGroupsRef.current.get(checkbox);

      if (!group) {
        return;
      }

      checkbox.removeEventListener("click", handleMasterClick);

      group.checkboxes.forEach((slave) => {
        slave.removeEventListener("change", handleCheckboxChange);
        checkboxToMasterRef.current.delete(slave);
      });

      masterGroupsRef.current.delete(checkbox);
      return;
    }

    const master = checkboxToMasterRef.current.get(checkbox);
    if (!master) {
      return;
    }

    const group = masterGroupsRef.current.get(master);
    checkboxToMasterRef.current.delete(checkbox);

    if (!group) {
      return;
    }

    checkbox.removeEventListener("change", handleCheckboxChange);
    group.checkboxes.delete(checkbox);
    atualizarMestre(master, group.checkboxes);
  }, [handleCheckboxChange, handleMasterClick]);

  const registerSlave = React.useCallback((checkbox: HTMLInputElement) => {
    masterGroupsRef.current.forEach((group, master) => {
      if (!checkbox.matches(group.selector)) {
        return;
      }

      if (!group.checkboxes.has(checkbox)) {
        checkbox.addEventListener("change", handleCheckboxChange);
      }

      group.checkboxes.add(checkbox);
      checkboxToMasterRef.current.set(checkbox, master);
      atualizarMestre(master, group.checkboxes);
    });
  }, [handleCheckboxChange]);

  const registerMaster = React.useCallback((master: HTMLInputElement, form: HTMLFormElement) => {
    const existingGroup = masterGroupsRef.current.get(master);

    if (existingGroup) {
      refreshGroup(existingGroup, form);
      return;
    }

    const analysis = analyzeMasterName(master.name);
    const group: MasterGroup = {
      master,
      checkboxes: new Set(),
      selector: analysis.selector,
      type: analysis.type,
      baseName: analysis.baseName,
    };

    masterGroupsRef.current.set(master, group);
    master.addEventListener("click", handleMasterClick);
    refreshGroup(group, form);

    if (group.checkboxes.size === 0) {
      console.warn(`Nenhum checkbox encontrado para o grupo "${group.baseName}"`);
      master.checked = false;
      master.indeterminate = false;
    }
  }, [handleMasterClick, refreshGroup]);

  const registerCheckbox = React.useCallback((checkbox: HTMLInputElement, form: HTMLFormElement) => {
    if (isMasterCheckbox(checkbox)) {
      registerMaster(checkbox, form);
      return;
    }

    registerSlave(checkbox);
  }, [registerMaster, registerSlave]);

  const scanForMasters = React.useCallback((form: HTMLFormElement) => {
    const masters = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name^="master-"]'));

    masters.forEach((master) => registerMaster(master, form));
  }, [registerMaster]);

  const refresh = React.useCallback((form: HTMLFormElement) => {
    masterGroupsRef.current.forEach((group, master) => {
      if (!form.contains(master)) {
        unregisterCheckbox(master);
        return;
      }

      refreshGroup(group, form);
    });

    scanForMasters(form);
  }, [refreshGroup, scanForMasters, unregisterCheckbox]);

  const setupObserver = React.useCallback((form: HTMLFormElement) => {
    observerRef.current?.disconnect();

    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          collectCheckboxesFromNode(node).forEach(unregisterCheckbox);
        });

        mutation.addedNodes.forEach((node) => {
          collectCheckboxesFromNode(node).forEach((checkbox) => {
            registerCheckbox(checkbox, form);
          });
        });
      });
    });

    observerRef.current.observe(form, { childList: true, subtree: true });
  }, [registerCheckbox, unregisterCheckbox]);

  const cleanup = React.useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    setupFormRef.current = null;

    if (resetTimeoutRef.current !== null) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    masterGroupsRef.current.forEach((group, master) => {
      master.removeEventListener("click", handleMasterClick);
      group.checkboxes.forEach((checkbox) => {
        checkbox.removeEventListener("change", handleCheckboxChange);
        checkboxToMasterRef.current.delete(checkbox);
      });
    });

    masterGroupsRef.current.clear();
    checkboxToMasterRef.current = new WeakMap();
    isMasterBatchUpdatingRef.current = false;
  }, [handleCheckboxChange, handleMasterClick]);

  const setup = React.useCallback((form: HTMLFormElement) => {
    cleanup();

    setupFormRef.current = form;

    scanForMasters(form);
    setupObserver(form);
  }, [cleanup, handleCheckboxChange, scanForMasters, setupObserver]);

  const onReset = React.useCallback(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    if (resetTimeoutRef.current !== null) {
      clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = setTimeout(() => {
      resetTimeoutRef.current = null;
      refresh(form);
    }, 0);
  }, [formRef, refresh]);

  return {
    setup,
    cleanup,
    refresh,
    onReset,
    handleCheckboxChange,
    scanForMasters,
  };
}
