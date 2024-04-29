import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components';
import { DraftOrderType } from '@/graphql/draft_order';
import { priceFormatter } from '@/utils';
import React from 'react';

export const TaxSummary: React.FC<{ order?: DraftOrderType }> = ({ order }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax summary</CardTitle>
        <CardDescription>Order tax summary</CardDescription>
        <Table>
          <TableHeader>
            <TableRow noHover>
              <TableHead>Description</TableHead>
              <TableHead>Tax rate</TableHead>
              <TableHead>Tax base</TableHead>
              <TableHead>Tax total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order?.taxSummary.length ? (
              order?.taxSummary.map(({ description, taxRate, taxBase, taxTotal }) => (
                <TableRow key={description} noHover>
                  <TableCell className="capitalize">{description}</TableCell>
                  <TableCell>{taxRate}%</TableCell>
                  <TableCell>{priceFormatter(taxBase)}</TableCell>
                  <TableCell>{priceFormatter(taxTotal)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow noHover>
                <TableCell colSpan={4}>No tax summary</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardHeader>
    </Card>
  );
};
