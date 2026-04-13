import React from "react";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

/**
 * PaymentHistoryTableSkeleton Component
 * 
 * Skeleton loader for payment history table while data is being fetched
 * Shows skeleton rows matching the table structure
 */
const PaymentHistoryTableSkeleton = ({ rows = 5 }) => {
  return (
    <Table className="w-full">
      {/* Table Header - Same as actual table */}
      <TableHeader className="primary_bg_color text-white hover:!text-white">
        <TableRow className="text-white hover:!bg-transparent border-none">
          <TableHead className="px-6 py-4 font-semibold text-center text-white">
            <Skeleton className="h-4 w-20 mx-auto bg-white/20" />
          </TableHead>
          <TableHead className="px-6 py-4 font-semibold text-center text-white">
            <Skeleton className="h-4 w-24 mx-auto bg-white/20" />
          </TableHead>
          <TableHead className="px-6 py-4 font-semibold text-center text-white">
            <Skeleton className="h-4 w-28 mx-auto bg-white/20" />
          </TableHead>
          <TableHead className="px-6 py-4 font-semibold text-center text-white">
            <Skeleton className="h-4 w-32 mx-auto bg-white/20" />
          </TableHead>
          <TableHead className="px-6 py-4 font-semibold text-center text-white">
            <Skeleton className="h-4 w-20 mx-auto bg-white/20" />
          </TableHead>
          <TableHead className="px-6 py-4 font-semibold text-center text-white">
            <Skeleton className="h-4 w-16 mx-auto bg-white/20" />
          </TableHead>
        </TableRow>
      </TableHeader>

      {/* Table Body - Skeleton Rows */}
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow
            key={index}
            className={`card_bg ${index === rows - 1 ? "last-row" : "border-b"}`}
          >
            <TableCell className="px-6 py-4">
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell className="px-6 py-4 text-center">
              <Skeleton className="h-4 w-24 mx-auto" />
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-[4px]" />
                <Skeleton className="h-4 w-20" />
              </div>
            </TableCell>
            <TableCell className="px-6 py-4 text-center">
              <Skeleton className="h-4 w-32 mx-auto" />
            </TableCell>
            <TableCell className="px-6 py-4 text-center">
              <Skeleton className="h-4 w-20 mx-auto" />
            </TableCell>
            <TableCell className="px-6 py-4 text-center">
              <Skeleton className="h-6 w-16 mx-auto rounded-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PaymentHistoryTableSkeleton;

