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
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Button,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  ScrollArea,
} from '@/components';
import { adminApiQuery } from '@/common/client';
import { ResolverInputTypes } from '@/zeus';
import { AssetType, assetsSelector } from '@/graphql/base';

const getAssets = async (options: ResolverInputTypes['AssetListOptions']) => {
  const response = await adminApiQuery()({
    assets: [{ options }, { totalItems: true, items: assetsSelector }],
  });
  return response.assets;
};

export const AssetsRelationInput = (props: DefaultProps<string>) => {
  const { value, onChange } = props;
  const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null);
  const [assets, setAssets] = useState<AssetType[]>([]);
  useEffect(() => {
    getAssets({ take: 10 }).then((assets) => {
      setAssets(assets.items);
    });
  }, []);
  useEffect(() => {
    if (value) {
      getAssets({ take: 1, filter: { id: { eq: value } } }).then((assets) => {
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
              <img src={selectedAsset.preview} alt={selectedAsset.name} className="object-fill w-32 h-32" />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedAsset(null);
                  onChange('');
                }}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Assets</DialogTitle>
          <DialogDescription>Upload and manage assets that can be used in your content.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[700px] p-2">
          <div className="flex flex-wrap">
            {assets?.map((asset) => (
              <div key={asset.id} className="p-2 w-1/2">
                <AspectRatio ratio={asset.height && asset.width ? asset.width / asset.height : 1} className="bg-muted">
                  <img src={asset.preview} alt={asset.name} className="object-fill" />
                </AspectRatio>
                <div className="flex items-center justify-between">
                  <span>{asset.name}</span>
                  <DialogClose asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedAsset(asset);
                        onChange(asset.id);
                      }}
                    >
                      Select
                    </Button>
                  </DialogClose>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <div className="flex flex-col w-full">
            <Pagination>
              <PaginationContent>
                <PaginationItem className="w-full">
                  <PaginationPrevious className="pl-0" href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem className="w-full">
                  <PaginationNext className="pr-0" href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <div className="flex justify-end gap-2">
              <Button size="sm">Upload</Button>
              <Button variant="secondary" size="sm">
                <DialogClose>Close</DialogClose>
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
