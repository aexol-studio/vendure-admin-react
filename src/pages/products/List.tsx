import { adminApiQuery } from '@/common/client';
import { ProductTileSelector } from '@/graphql/products';
import { useList } from '@/lists/useList';
import { ResolverInputTypes } from '@/zeus';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EllipsisVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getProducts = async (paginate: ResolverInputTypes['ProductListOptions']) => {
  const response = await adminApiQuery({
    products: [{ options: paginate }, { items: ProductTileSelector, totalItems: true }],
  });
  return response.products;
};

export const ProductListPage = () => {
  const { objects: products, Paginate } = useList({
    route: async ({ page, perPage, sort }) => {
      return getProducts({
        take: perPage,
        skip: (page - 1) * perPage,
        ...(sort && { sort: { [sort.key]: sort.sortDir } }),
      });
    },

    listType: 'products',
  });
  const { t } = useTranslation('products');

  return (
    <Table>
      <colgroup>
        <col span={1} style={{ width: '10%' }} />
        <col span={1} style={{ width: '35%' }} />
        <col span={1} style={{ width: '35%' }} />
        <col span={1} style={{ width: '10%' }} />
        <col span={1} style={{ width: '10%' }} />
      </colgroup>
      <TableCaption>{t('name')}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{t('image')}</TableHead>
          {/* <TableHead onClick={() => sort('name')}>{t('name')}</TableHead> */}
          <TableHead>{t('slug')}</TableHead>
          <TableHead>{t('variants')}</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {products?.map((p) => {
          return (
            <TableRow key={p.slug}>
              <TableCell>
                <img className="h-8" src={p.featuredAsset?.preview + '?preset=tiny'} />
              </TableCell>
              <TableCell>
                <Link to={`/products/${p.slug}/`}>
                  <b>{p.name}</b>
                </Link>
              </TableCell>
              <TableCell>{p.slug}</TableCell>
              <TableCell>{p.variantList.totalItems}</TableCell>
              <TableCell>
                <ProductMenu editHref={`/products/${p.slug}/`} onDelete={() => {}} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>{Paginate}</TableFooter>
    </Table>
  );
};

const ProductMenu = ({ onDelete, editHref }: { editHref: string; onDelete: () => void }) => {
  const { t } = useTranslation('products');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Link to={editHref}>{t('editProduct')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>{t('deleteProduct')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
