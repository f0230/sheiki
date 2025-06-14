import { create } from 'zustand';

export const useCartVisual = create((set) => ({
    visualItems: [],
    pushVisualItem: (imgUrl) =>
        set((state) => ({
            visualItems: [...state.visualItems, { id: Date.now(), imgUrl }],
        })),
}));
