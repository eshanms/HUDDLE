/**
 * HUDDLE Budget Visualization Chart
 * Interactive SVG Donut & Category Allocation Bar Chart
 */

import React, { useState } from 'react';
import { BudgetMetrics, formatCurrency } from '../services/storage';

interface BudgetChartProps {
  metrics: BudgetMetrics;
  currency?: string;
  onSelectCategory?: (category: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Venue & Hall': '#3B1828', // Deep plum
  Venue: '#3B1828',
  'Catering, Food & Beverage': '#E06D53', // Muted coral
  'Catering & Bar': '#E06D53',
  'Decor, Stage & Floral': '#8C9A84', // Sage olive
  'Decor & Floral': '#8C9A84',
  'Photography & Cinematography': '#C59B27', // Aged brass
  'Photography & Media': '#C59B27',
  'Sound, Lighting & AV Tech': '#2E4057', // Deep slate
  'Honorariums, Guests & Entertainment': '#605B85', // Dusty lavender
  Entertainment: '#605B85',
  'Staff, Security & Volunteers': '#8A5A44', // Warm terracotta
  'Staff & Logistics': '#8A5A44',
  'Certificates, Badges & Stationery': '#D48C70', // Soft peach
  'Stationery & Favors': '#D48C70',
  'Contingency Reserve': '#4A5568',
  Contingency: '#4A5568',
  'Other Expenses': '#78716C',
  Other: '#78716C',
};

export const BudgetChart: React.FC<BudgetChartProps> = ({
  metrics,
  currency = metrics.currency || 'INR',
  onSelectCategory,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categories = Object.values(metrics.categoryBreakdown);
  const total = metrics.totalBudget || 1;

  // Include contingency in the breakdown for complete picture
  const slices = [
    ...categories.map((c) => ({
      name: c.category,
      amount: c.total,
      percent: (c.total / total) * 100,
      color: CATEGORY_COLORS[c.category] || '#78716C',
      verified: c.verifiedTotal,
      itemCount: c.itemCount,
    })),
    ...(metrics.contingencyReserve > 0
      ? [
          {
            name: 'Contingency Reserve',
            amount: metrics.contingencyReserve,
            percent: (metrics.contingencyReserve / total) * 100,
            color: '#2E4057',
            verified: metrics.contingencyReserve,
            itemCount: 1,
          },
        ]
      : []),
  ];

  // Calculate SVG donut paths
  const radius = 80;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  return (
    <div className="bg-[#FAF7F2] rounded-3xl p-6 border border-[#E8E2D8] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8E2D8] mb-6 gap-2">
        <div>
          <h3 className="text-xl font-serif text-[#3B1828]">Budget Allocation & Integrity</h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            Real-time mathematical reconciliation of quotes, estimates, and reserves
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {formatCurrency(metrics.verifiedExpenses, currency)} Verified Quotes
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {formatCurrency(metrics.estimatedExpenses, currency)} Estimates
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Donut Chart SVG */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="#EFEBE4"
                strokeWidth={strokeWidth}
              />

              {/* Slices */}
              {slices.map((slice, i) => {
                const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedAngle;
                accumulatedAngle += (slice.percent / 100) * circumference;

                const isHovered = hoveredCategory === slice.name;

                return (
                  <circle
                    key={i}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredCategory(slice.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => onSelectCategory && onSelectCategory(slice.name)}
                  />
                );
              })}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              {hoveredCategory ? (
                <>
                  <span className="text-xs uppercase tracking-wider text-[#78716C] font-semibold">
                    {hoveredCategory}
                  </span>
                  <span className="text-xl font-bold text-[#3B1828]">
                    {formatCurrency(
                      slices.find((s) => s.name === hoveredCategory)?.amount || 0,
                      currency
                    )}
                  </span>
                  <span className="text-[11px] text-[#A89F91]">
                    {(slices.find((s) => s.name === hoveredCategory)?.percent || 0).toFixed(1)}% of budget
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs uppercase tracking-wider text-[#78716C] font-medium">
                    Total Budget
                  </span>
                  <span className="text-2xl font-serif font-bold text-[#3B1828]">
                    {formatCurrency(metrics.totalBudget, currency)}
                  </span>
                  <span
                    className={`text-[11px] font-medium mt-0.5 ${
                      metrics.isOverBudget ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {metrics.isOverBudget
                      ? `Over by ${formatCurrency(metrics.overspendAmount, currency)}`
                      : `${formatCurrency(metrics.remainingBalance, currency)} Unallocated`}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar under Chart */}
          <div className="grid grid-cols-3 gap-2 w-full mt-4 text-center">
            <div className="bg-white/80 p-2.5 rounded-xl border border-[#E8E2D8]">
              <span className="block text-[11px] text-[#78716C]">Committed</span>
              <span className="text-sm font-semibold text-[#3B1828]">
                {formatCurrency(metrics.allocatedExpenses, currency)}
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-[#E8E2D8]">
              <span className="block text-[11px] text-[#78716C]">Reserve</span>
              <span className="text-sm font-semibold text-[#2E4057]">
                {formatCurrency(metrics.contingencyReserve, currency)}
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-[#E8E2D8]">
              <span className="block text-[11px] text-[#78716C]">Per Guest</span>
              <span className="text-sm font-semibold text-[#E06D53]">
                {formatCurrency(metrics.costPerGuest, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Bars */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-[#78716C] pb-1 border-b border-[#E8E2D8]">
            <span>Category</span>
            <span>Allocated / Share</span>
          </div>

          <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
            {slices.map((slice) => {
              const color = slice.color;
              const isSelected = hoveredCategory === slice.name;

              return (
                <div
                  key={slice.name}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white border-[#3B1828]/30 shadow-sm'
                      : 'bg-white/50 border-transparent hover:bg-white/80 hover:border-[#E8E2D8]'
                  }`}
                  onMouseEnter={() => setHoveredCategory(slice.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => onSelectCategory && onSelectCategory(slice.name)}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-md shrink-0"
                        style={{ backgroundColor: color }}
                      ></span>
                      <span className="font-semibold text-[#3B1828]">{slice.name}</span>
                      <span className="text-[11px] text-[#A89F91]">
                        ({slice.itemCount} {slice.itemCount === 1 ? 'item' : 'items'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#3B1828]">
                        {formatCurrency(slice.amount, currency)}
                      </span>
                      <span className="text-[#78716C] font-mono text-[11px]">
                        {slice.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#EFEBE4] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, slice.percent)}%`,
                        backgroundColor: color,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {metrics.isOverBudget && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
              <span className="font-bold text-sm">⚠️ Budget Exceeded:</span>
              <span>
                Allocated expenses and contingency exceed your total budget by{' '}
                <strong>{formatCurrency(metrics.overspendAmount, currency)}</strong>. Run{' '}
                <strong className="underline">Audit My Event</strong> to rebalance allocations.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
