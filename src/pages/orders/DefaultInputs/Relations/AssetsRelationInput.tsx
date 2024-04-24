import React, { useEffect, useState } from 'react';
import { DefaultProps } from '../types';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button, ScrollArea } from '@/components';
import { adminApiQuery } from '@/common/client';
import { ResolverInputTypes } from '@/zeus';
import { AssetType, assetsSelector } from '@/graphql/base';
import { useList } from '@/lists/useList';
import { cn } from '@/lib/utils';
import { ImageUp } from 'lucide-react';

const getAssets = async (options: ResolverInputTypes['AssetListOptions']) => {
  const response = await adminApiQuery()({
    assets: [{ options }, { totalItems: true, items: assetsSelector }],
  });
  return response.assets;
};

export function AssetsRelationInput<T>(props: DefaultProps<T>) {
  const { value, onChange } = props;
  const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null);
  const { objects: assets, Paginate } = useList({
    route: async ({ page, perPage }) => {
      const assets = await getAssets({ skip: (page - 1) * perPage, take: perPage });
      return { items: assets.items, totalItems: assets.totalItems };
    },
    cacheKey: `modal-assets-list`,
  });

  useEffect(() => {
    if (value) {
      getAssets({ take: 1, filter: { id: { eq: value as string } } }).then((assets) => {
        setSelectedAsset(assets.items[0] || null);
      });
    }
  }, [value]);

  return (
    <Dialog>
      <div>
        <Button variant="secondary" size="sm">
          <DialogTrigger>Pick assets</DialogTrigger>
        </Button>
        <div>
          {selectedAsset && (
            <div>
              <img src={selectedAsset.preview} alt={selectedAsset.name} className="h-32 w-32 object-fill" />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedAsset(null);
                  onChange('' as T);
                }}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>
      <DialogContent className="max-w-[800px] ">
        <DialogHeader>
          <DialogTitle>Assets</DialogTitle>
          <DialogDescription>Upload and manage assets that can be used in your content.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[700px] p-2">
          <div className="flex flex-wrap">
            {assets?.map((asset) => (
              <div
                key={asset.id}
                className={cn('w-1/4 cursor-pointer border-2 p-2', selectedAsset?.id === asset.id && 'border-blue-500')}
                onClick={() => {
                  setSelectedAsset(asset);
                  onChange(asset.id as T);
                }}
              >
                <img src={asset.preview} alt={asset.name} className="h-32 w-full object-contain" />
                <span>{asset.name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <div className="flex w-full flex-col gap-2">
            {Paginate}
            <div className="flex justify-end gap-2">
              <Button
                size="lg"
                variant="secondary"
                className="flex items-center gap-2"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                  };
                  input.click();
                }}
              >
                <ImageUp className="h-4 w-4" />
                <span>Upload</span>
              </Button>
              <Button variant="secondary" size="lg">
                <DialogClose>{selectedAsset ? 'Save' : 'Cancel'}</DialogClose>
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
