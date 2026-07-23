import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper
} from "@tanstack/react-table";
import type { DirectiveDetail, ActionStatus } from "@artixio/shared";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { DataHealthBadge } from "@/components/data-health-badge";
import { RiskBadge } from "@/components/risk-badge";
import { StatusSelect } from "@/components/status-select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format";

const columnHelper = createColumnHelper<DirectiveDetail>();

type TriageTableProps = {
  data: DirectiveDetail[];
  onOpenDirective: (directiveId: string) => void;
  onStatusChange: (actionItemId: string, status: ActionStatus) => void;
};

export function TriageTable({ data, onOpenDirective, onStatusChange }: TriageTableProps) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => (
          <Checkbox
            checked={Object.keys(rowSelection).length > 0 && Object.values(rowSelection).every(Boolean)}
            onCheckedChange={(checked) => {
              const next: Record<string, boolean> = {};
              data.forEach((directive) => {
                next[directive.id] = Boolean(checked);
              });
              setRowSelection(next);
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={rowSelection[row.original.id] ?? false}
            onCheckedChange={(checked) =>
              setRowSelection((current) => ({
                ...current,
                [row.original.id]: Boolean(checked)
              }))
            }
            aria-label={`Select ${row.original.title}`}
          />
        ),
        size: 32
      }),
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => <span className="font-mono text-xs text-slate-600">{info.getValue().slice(0, 10)}</span>,
        size: 100
      }),
      columnHelper.accessor("title", {
        header: "Directive Title",
        cell: ({ row, getValue }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="max-w-[320px] truncate text-left font-medium text-slate-900 hover:text-slate-700"
                  onClick={() => onOpenDirective(row.original.id)}
                >
                  {getValue()}
                </button>
              </TooltipTrigger>
              <TooltipContent>{getValue()}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        size: 320
      }),
      columnHelper.accessor((row) => row.authority.code, {
        id: "authority",
        header: "Authority",
        cell: (info) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{info.getValue()}</span>,
        size: 90
      }),
      columnHelper.accessor("riskLevel", {
        header: "Risk",
        cell: (info) => <RiskBadge riskLevel={info.getValue()} />,
        size: 90
      }),
      columnHelper.display({
        id: "status",
        header: "Action Status",
        cell: ({ row }) =>
          row.original.primaryActionItem ? (
            <StatusSelect
              value={row.original.primaryActionItem.status}
              onChange={(status) => onStatusChange(row.original.primaryActionItem!.id, status)}
            />
          ) : (
            <span className="text-xs text-slate-500">No action items</span>
          ),
        size: 160
      }),
      columnHelper.accessor(
        (row) => row.primaryActionItem?.dueDate ?? row.effectiveDate,
        {
          id: "dueDate",
          header: "Due Date",
          cell: (info) => (
            <span className={info.getValue() ? "text-slate-700" : "font-medium text-amber-700"}>
              {formatDate(info.getValue())}
            </span>
          ),
          size: 110
        }
      ),
      columnHelper.accessor("health", {
        header: "Data Health",
        cell: (info) => <DataHealthBadge health={info.getValue()} />,
        size: 160
      })
    ],
    [data, onOpenDirective, onStatusChange, rowSelection]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel">
      <Table>
        <TableHeader className="bg-slate-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-slate-50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-slate-500">
                No directives matched the current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

