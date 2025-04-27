// src/store/dialog-store.ts
import { create } from "zustand";

export type DialogType = "auditor" | "client" | "folder" | "document" | null;

interface DialogState {
  isOpen: boolean;
  dialogType: DialogType;
  isLoading: boolean;
  openDialog: (type: DialogType) => void;
  closeDialog: () => void;
  setLoading: (loading: boolean) => void;
}

export const useDashboardDialog = create<DialogState>((set) => ({
  isOpen: false,
  dialogType: null,
  isLoading: false,
  openDialog: (type) => set({ isOpen: true, dialogType: type }),
  closeDialog: () => set({ isOpen: false, dialogType: null, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
