import React from "react";
import { Model } from "../state/model.ts";

export const FSContext = React.createContext<FS | undefined>(undefined);

export const ModelContext = React.createContext<Model | null>(null);

export type TileBuilderUpsellContextValue = {
  openRenderDownloadUpsell: () => void;
};

/** Tile builder: open Pro upsell when Render/Download is used at Med/High resolution. */
export const TileBuilderUpsellContext = React.createContext<TileBuilderUpsellContextValue | null>(null);

