import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Utensils, Users, Flame, Dumbbell, Truck, Flag, Moon,
  Clock, ArrowRight, MapPin, Calendar, Shield, Info,
  RefreshCw, CheckCircle, AlertCircle, ExternalLink,
  ChevronRight, Waves, ClipboardList, Radio,
} from "lucide-react";

const cn = (...a: Parameters<typeof clsx>) => twMerge(clsx(a));

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = "meal" | "free" | "spirit" | "activity" | "travel" | "milestone" | "lights";
type LeaderKey = "meal" | "spirit" | "ranch" | "beach" | "travel" | "logistics" | "comms";

type ScheduleBlock = {
  day: number;
  start: string;
  end: string;
  cat: Category;
  title: string;
  sub: string;
  lead?: string;
  owner?: string;
};

// ─── URLs ────────────────────────────────────────────────────────────────────

const SHEET_ID = "1KBPmsddghMRosRAf0L31yuiZrcX6XMFboQEelxFayPU";
const SHEET_CSV_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Schedule`;
const SHEET_EDIT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing`;

// ─── Schedule data ───────────────────────────────────────────────────────────

const DEFAULT_SCHEDULE: ScheduleBlock[] = [
  { day:0, start:"07:00", end:"07:30", cat:"milestone", title:"Depart for Restoration Ranch",                sub:"Caravan rolls out — meet at church parking lot 6:30 for loading.",                  lead:"travel"    },
  { day:0, start:"07:30", end:"12:00", cat:"travel",    title:"Travel — caravan to Midfield, TX",            sub:"~5 hr drive · 6 vehicles · gas stop midway. Save fuel receipts only.",             lead:"travel"    },
  { day:0, start:"12:00", end:"13:00", cat:"meal",      title:"Lunch on the road",                           sub:"Sack lunches packed by food team.",                                                owner:"Food team" },
  { day:0, start:"13:00", end:"15:00", cat:"milestone", title:"Arrive Restoration Ranch · unpack & explore", sub:"Self check-in via keypad. Settle into Main Lodge, Liberty House, and 3 cabins.",   lead:"logistics" },
  { day:0, start:"15:00", end:"17:00", cat:"activity",  title:"Ice Breaker Games",                           sub:"Missionary Tag · Human Knot · Silent line-up challenges.",                         lead:"ranch"     },
  { day:0, start:"17:00", end:"18:00", cat:"free",      title:"Dinner prep / downtime",                      sub:"Crew on duty sets up. Others: pool, gym, walks, lake."                                              },
  { day:0, start:"18:00", end:"19:00", cat:"meal",      title:"Dinner — Pizza Night",                        sub:"Set tables for ~40.",                                                             owner:"YW 12-14"  },
  { day:0, start:"19:00", end:"20:00", cat:"spirit",    title:"Spiritual Activity / Workshop",               sub:"Kick-off devotional — Walking With Him theme.",                                   lead:"spirit"    },
  { day:0, start:"20:00", end:"22:00", cat:"activity",  title:"Ghost in the Graveyard",                      sub:"Wide-area night game on the lawn. Adults patrol perimeter.",                       lead:"ranch"     },
  { day:0, start:"22:00", end:"22:30", cat:"lights",    title:"Lights Out",                                  sub:"Bed check by cabin/room leaders.",                                                lead:"logistics" },
  { day:1, start:"08:00", end:"09:00", cat:"meal",      title:"Breakfast — Pancakes & Bacon",                sub:"Set up at the lodge kitchen.",                                                    owner:"YW 15-18"       },
  { day:1, start:"09:00", end:"10:00", cat:"spirit",    title:"Spiritual Activity / Workshop",               sub:"Morning devotional — building daily habits.",                                     lead:"spirit"          },
  { day:1, start:"10:00", end:"12:00", cat:"activity",  title:"Team Building Games",                         sub:"Balloon Stampede · Balloon Chase · Human Foosball · Partner Ball.",               lead:"ranch"           },
  { day:1, start:"12:00", end:"13:00", cat:"meal",      title:"Lunch — Sandwiches & Chips",                  sub:"",                                                                               owner:"Deacons Quorum"  },
  { day:1, start:"13:00", end:"15:00", cat:"free",      title:"Downtime",                                    sub:"Swim · gym · basketball · volleyball · pickleball · ultimate · 4-square · board games."              },
  { day:1, start:"15:00", end:"17:00", cat:"activity",  title:"Slip-n-Slide Kickball + Water Volleyball",    sub:"South lawn. Towels at the pool deck.",                                            lead:"ranch"           },
  { day:1, start:"17:00", end:"18:00", cat:"free",      title:"Dinner prep / downtime",                      sub:"Teachers' crew on grill duty."                                                                       },
  { day:1, start:"18:00", end:"19:00", cat:"meal",      title:"Dinner — Burgers & Hot Dogs",                 sub:"Grill on the patio.",                                                            owner:"Teachers Quorum" },
  { day:1, start:"19:00", end:"20:00", cat:"spirit",    title:"Spiritual Activity / Workshop",               sub:"Evening devotional.",                                                            lead:"spirit"          },
  { day:1, start:"20:00", end:"22:00", cat:"activity",  title:"Sports Rotations + Game Room",                sub:"Volleyball · basketball · pickleball · cards · Heads Up. Glow-in-the-dark optional.", lead:"ranch"        },
  { day:1, start:"22:00", end:"22:30", cat:"lights",    title:"Lights Out",                                  sub:"Bed check.",                                                                     lead:"logistics"       },
  { day:2, start:"08:00", end:"09:00", cat:"meal",      title:"Breakfast — Breakfast Burritos & Fruit",      sub:"",                                                                               owner:"Priests Quorum"  },
  { day:2, start:"09:00", end:"11:00", cat:"activity",  title:"Nature Walk · Hike",                          sub:"Walking paths across the 67-acre property. Sunscreen + water bottles.",           lead:"ranch"           },
  { day:2, start:"12:00", end:"13:00", cat:"meal",      title:"Lunch — Chicken Sandwiches",                  sub:"Chips, apples/oranges.",                                                         owner:"YW 12-14"       },
  { day:2, start:"13:00", end:"14:00", cat:"free",      title:"Downtime",                                    sub:"Open recreation."                                                                                    },
  { day:2, start:"14:00", end:"15:00", cat:"spirit",    title:'Spiritual Workshop — "What is a testimony?"', sub:"Small-group breakouts.",                                                         lead:"spirit"          },
  { day:2, start:"15:00", end:"17:00", cat:"activity",  title:"Partner Portrait Painting",                   sub:"Lodge common area. Tarps down.",                                                 lead:"ranch"           },
  { day:2, start:"17:00", end:"18:00", cat:"free",      title:"Dinner prep / downtime",                      sub:"YW 15-18 crew preps pasta bar."                                                                       },
  { day:2, start:"18:00", end:"19:00", cat:"meal",      title:"Dinner — Pasta Bar",                          sub:"French bread, salad, grapes.",                                                   owner:"YW 15-18"       },
  { day:2, start:"19:00", end:"20:00", cat:"spirit",    title:"Testimony Meeting",                            sub:"Lodge living room. Tissues stocked.",                                            lead:"spirit"          },
  { day:2, start:"20:00", end:"22:00", cat:"activity",  title:"Movie Night + Sports Rotations",              sub:"Theatre room running · outdoor sports for the rest.",                            lead:"ranch"           },
  { day:2, start:"22:00", end:"22:30", cat:"lights",    title:"Lights Out",                                  sub:"Last bed check before departure day.",                                           lead:"logistics"       },
  { day:3, start:"08:00", end:"09:00", cat:"meal",      title:"Breakfast — Cereal, leftovers, yogurt & berries", sub:"",                                                                          owner:"Deacons"    },
  { day:3, start:"09:00", end:"10:00", cat:"milestone", title:"Check-out — final clean & pack",              sub:"Ask host for late checkout. Cabin clean-check by Logistics.",                    lead:"logistics"   },
  { day:3, start:"10:00", end:"10:30", cat:"milestone", title:"Depart Restoration Ranch",                    sub:"Caravan re-forms. Final headcount before rolling.",                              lead:"travel"      },
  { day:3, start:"10:30", end:"12:00", cat:"travel",    title:"Travel — northbound",                         sub:"Drive home leg.",                                                               lead:"travel"      },
  { day:3, start:"12:00", end:"13:00", cat:"meal",      title:"Lunch on the road",                           sub:"Sack lunches packed before departure.",                                         owner:"Food team"  },
  { day:3, start:"13:00", end:"15:00", cat:"travel",    title:"Travel — final stretch",                      sub:"ETA back at FTW around 3 PM.",                                                 lead:"travel"      },
  { day:3, start:"15:00", end:"15:30", cat:"milestone", title:"Arrive FTW · parent pickup",                  sub:"Unload trailers · return rental van · final gear check.",                       lead:"logistics"   },
];

// ─── Leaders ─────────────────────────────────────────────────────────────────

const LEADERS: Record<LeaderKey, { label: string; names: string; Icon: React.ComponentType<{ size?: number }> }> = {
  meal:      { label: "Food & Meals",      names: "Lynette Ballard · Ashley Harrington · Jamison Rousculp", Icon: Utensils     },
  spirit:    { label: "Spiritual",          names: "Nick Taylor · Caroline Sagers",                          Icon: Flame        },
  ranch:     { label: "Ranch Activities",   names: "Charlton Castlemain · Megan Garrett · Jennie Williams",  Icon: Dumbbell     },
  beach:     { label: "Beach / Lake",       names: "Sara Mefford · Oscar Castro",                            Icon: Waves        },
  travel:    { label: "Travel Planner",     names: "Laurence Hill · Paul Zahrabelny",                        Icon: Truck        },
  logistics: { label: "Logistics & Safety", names: "Michelle Smith · Chandler Holmes · Spencer Crichton",    Icon: ClipboardList },
  comms:     { label: "Communications",     names: "Ricardo Merino",                                         Icon: Radio        },
};

const LEADER_CAT: Partial<Record<LeaderKey, Category>> = {
  meal: "meal", spirit: "spirit", ranch: "activity",
  beach: "free", travel: "travel", logistics: "milestone",
};

const DAY_LEADERS: Record<number, LeaderKey[]> = {
  0: ["travel", "logistics", "ranch", "spirit", "meal"],
  1: ["ranch", "spirit", "meal", "logistics"],
  2: ["ranch", "spirit", "meal", "logistics"],
  3: ["travel", "logistics", "meal", "comms"],
};

// ─── Category metadata ───────────────────────────────────────────────────────

const CAT_LABEL: Record<Category, string> = {
  meal: "Meal", free: "Free Time", spirit: "Spiritual",
  activity: "Activity", travel: "Travel", milestone: "Milestone", lights: "Lights Out",
};

const CAT_ICON: Record<Category, React.ComponentType<{ size?: number }>> = {
  meal: Utensils, free: Users, spirit: Flame, activity: Dumbbell,
  travel: Truck, milestone: Flag, lights: Moon,
};

const DAY_LABELS = [
  { full: "Monday, June 1",    short: "Drive Down",  num: "1", mo: "Mon · Jun" },
  { full: "Tuesday, June 2",   short: "Ranch Day 1", num: "2", mo: "Tue · Jun" },
  { full: "Wednesday, June 3", short: "Ranch Day 2", num: "3", mo: "Wed · Jun" },
  { full: "Thursday, June 4",  short: "Drive Back",  num: "4", mo: "Thu · Jun" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  const min = m === 0 ? "" : `:${String(m).padStart(2, "0")}`;
  return { h12, min, ampm, full: `${h12}${min} ${ampm}` };
}

function fmtDuration(start: string, end: string) {
  const mins = toMin(end) - toMin(start);
  if (mins <= 0) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtClock(d: Date) {
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getTripDay(now: Date) {
  const d0 = new Date(2026, 5, 1);
  const diff = Math.floor((now.getTime() - d0.getTime()) / 86400000);
  if (diff >= 0 && diff <= 3) return diff;
  return null;
}

// All colour helpers reference CSS variables from theme.css
const cc   = (cat: Category) => `var(--cat-${cat})`;
const cbg  = (cat: Category) => `var(--cat-${cat}-bg)`;
const ctext = (cat: Category) => `var(--cat-${cat}-text)`;

// ─── CSV parser ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let field = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { field += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      result.push(field); field = "";
    } else field += ch;
  }
  result.push(field);
  return result;
}

function parseSheetCSV(csv: string): ScheduleBlock[] {
  const lines = csv.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) throw new Error("Sheet appears empty (fewer than 2 rows)");

  const strip = (s: string) => s.replace(/^"+|"+$/g, "").trim();
  const norm  = (s: string) => strip(s).toLowerCase().replace(/[\s\-./\\()+#]+/g, "_").replace(/_+/g, "_");

  const rawHeaders = parseCSVLine(lines[0]).map(strip);
  const headers    = rawHeaders.map(norm);

  console.log("[Sync] Raw headers:", rawHeaders);
  console.log("[Sync] First data row:", lines[1]);

  const findCol = (...tokens: string[]): number => {
    const normTokens = tokens.map(norm);
    for (const t of normTokens) {
      const i = headers.indexOf(t);
      if (i !== -1) return i;
    }
    for (const t of normTokens) {
      const i = headers.findIndex(h => h.includes(t) || t.includes(h));
      if (i !== -1) return i;
    }
    return -1;
  };

  const iDay   = findCol("day", "day #", "day number", "date", "day_num");
  const iStart = findCol("start", "start time", "start_time", "begin", "time");
  const iEnd   = findCol("end", "end time", "end_time", "finish", "stop");
  const iCat   = findCol("category", "cat", "type", "kind", "block type");
  const iTitle = findCol("title", "name", "event", "activity", "item");
  const iSub   = findCol("description", "notes", "sub", "detail", "summary");
  const iLead  = findCol("leader", "lead", "point", "point person", "staff");
  const iOwner = findCol("owner", "crew", "group", "team", "assigned", "responsible");

  if (iTitle === -1) {
    throw new Error(
      `No title column found. Sheet has: "${rawHeaders.join('", "')}". ` +
      `Add a column named "Title" (or Event, Name, Activity).`
    );
  }

  const val = (cols: string[], i: number) =>
    i === -1 ? "" : strip(cols[i] ?? "");

  const VALID_CATS = new Set<string>(["meal","free","spirit","activity","travel","milestone","lights"]);

  return lines.slice(1)
    .map(line => {
      const cols  = parseCSVLine(line);
      const title = val(cols, iTitle);
      if (!title) return null;
      const rawCat = val(cols, iCat).toLowerCase();
      const cat = VALID_CATS.has(rawCat) ? (rawCat as Category) : "activity";
      return {
        day:   Math.max(0, Math.min(3, parseInt(val(cols, iDay)) || 0)),
        start: val(cols, iStart),
        end:   val(cols, iEnd),
        cat, title,
        sub:   val(cols, iSub),
        lead:  val(cols, iLead) || undefined,
        owner: val(cols, iOwner) || undefined,
      };
    })
    .filter((b): b is ScheduleBlock => b !== null);
}

// ─── CatBadge ────────────────────────────────────────────────────────────────

function CatBadge({ cat }: { cat: Category }) {
  return (
    <span
      className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shrink-0"
      style={{ background: cbg(cat), color: ctext(cat) }}
    >
      {CAT_LABEL[cat]}
    </span>
  );
}

// ─── BlockCard ───────────────────────────────────────────────────────────────
// Flex layout so nothing squishes on narrow screens.

function BlockCard({
  block, isNow = false, isPast = false,
}: { block: ScheduleBlock; isNow?: boolean; isPast?: boolean }) {
  const CatIcon  = CAT_ICON[block.cat];
  const leader   = block.lead ? LEADERS[block.lead as LeaderKey] : null;
  const duration = fmtDuration(block.start, block.end);

  return (
    <div
      className={cn(
        "flex items-start gap-3 border rounded-lg p-3 transition-all duration-150",
        isNow  ? "border-[color:var(--cat-free)] shadow-[0_0_0_3px_var(--cat-free-bg)]"
               : isPast ? "border-border opacity-40"
               : "border-border hover:border-[color:var(--muted-foreground)] hover:shadow-sm",
      )}
    >
      {/* Category icon — fixed size, never shrinks */}
      <div
        className="w-8 h-8 rounded-md grid place-items-center shrink-0 mt-px"
        style={{ background: cbg(block.cat), color: cc(block.cat) }}
      >
        <CatIcon size={16} />
      </div>

      {/* Content — min-w-0 lets it shrink and wrap correctly */}
      <div className="min-w-0 flex-1">
        {/* Title row: title + badge */}
        <div className="flex items-start gap-2">
          <p className="text-[14px] font-semibold text-foreground leading-snug tracking-tight m-0 min-w-0 flex-1">
            {block.title}
          </p>
          <CatBadge cat={block.cat} />
        </div>

        {/* Description */}
        {block.sub && (
          <p className="text-[13px] text-muted-foreground mt-1 leading-snug m-0">
            {block.sub}
          </p>
        )}

        {/* Footer: duration + tags */}
        {(duration || block.owner || leader) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {duration && (
              <span className="text-[11px] text-muted-foreground/60 font-medium tabular-nums">
                {duration}
              </span>
            )}
            {block.owner && (
              <span className="inline-flex items-center gap-1 bg-muted border border-border rounded-[4px] px-1.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                <Users size={10} className="shrink-0 opacity-60" />
                <span className="truncate max-w-[180px]">{block.owner}</span>
              </span>
            )}
            {leader && (
              <span className="inline-flex items-center gap-1 bg-muted border border-border rounded-[4px] px-1.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                <leader.Icon size={10} className="shrink-0 opacity-60" />
                <span className="truncate max-w-[180px] sm:max-w-none">{leader.names}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TimelineRow ─────────────────────────────────────────────────────────────

function TimelineRow({
  time, blocks, nowMin, dayIdx, tripDay,
}: {
  time: string;
  blocks: ScheduleBlock[];
  nowMin: number | null;
  dayIdx: number;
  tripDay: number | null;
}) {
  const t      = fmtTime(time);
  const rowMin = toMin(time);
  const onTrip = tripDay === dayIdx;
  const isNow  = onTrip && nowMin !== null &&
    blocks.some(b => toMin(b.start) <= nowMin! && nowMin! < toMin(b.end));
  const isPast = onTrip && nowMin !== null && !isNow && rowMin < nowMin;

  return (
    <div
      className={cn(
        "grid border-l-2",
        isNow ? "border-l-[color:var(--cat-free)]" : "border-l-transparent",
      )}
      // 76px is wide enough for "10:30 AM" without wrapping
      style={{ gridTemplateColumns: "76px 1fr" }}
    >
      {/* Time column */}
      <div className="relative px-2 py-4 text-right border-r border-dashed border-border shrink-0">
        <div
          className={cn(
            "text-[13px] font-semibold tabular-nums leading-none",
            isNow ? "text-[color:var(--cat-free)]" : "text-foreground",
            isPast && "opacity-40",
          )}
        >
          {t.h12}{t.min}
        </div>
        <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mt-1">
          {t.ampm}
        </div>
        {/* Timeline node dot — sits on the dashed divider */}
        <div
          className={cn(
            "absolute right-[-5px] top-[20px] w-[9px] h-[9px] rounded-full border-2 z-10",
            isNow
              ? "border-[color:var(--cat-free)] shadow-[0_0_0_4px_var(--cat-free-bg)]"
              : "border-border bg-background",
          )}
          style={isNow ? { background: "var(--cat-free)" } : {}}
        />
      </div>

      {/* Blocks column — padding clears the 5px dot overhang */}
      <div className="py-2 px-3 flex flex-col gap-2 min-w-0">
        {blocks.map((b, i) => (
          <BlockCard
            key={`${b.day}-${b.start}-${i}`}
            block={b}
            isNow={isNow && i === 0}
            isPast={isPast}
          />
        ))}
      </div>
    </div>
  );
}

// ─── DayPane ─────────────────────────────────────────────────────────────────

function DayPane({
  dayIdx, schedule, nowMin, tripDay,
}: {
  dayIdx: number;
  schedule: ScheduleBlock[];
  nowMin: number | null;
  tripDay: number | null;
}) {
  const blocks = useMemo(() => schedule.filter(b => b.day === dayIdx), [schedule, dayIdx]);
  const groups = useMemo(() => {
    const g: Record<string, ScheduleBlock[]> = {};
    blocks.forEach(b => { (g[b.start] = g[b.start] || []).push(b); });
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [blocks]);

  const d     = DAY_LABELS[dayIdx];
  const first = blocks[0] ? fmtTime(blocks[0].start).full : null;
  const last  = blocks[blocks.length - 1] ? fmtTime(blocks[blocks.length - 1].start).full : null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Pane header */}
      <div className="px-4 py-3.5 border-b border-border flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground m-0">{d.full}</h2>
          <span className="text-[13px] text-muted-foreground font-medium">{d.short}</span>
        </div>
        {first && last && (
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Clock size={12} className="opacity-50 shrink-0" />
            <span>{blocks.length} blocks · {first} – {last}</span>
          </div>
        )}
      </div>

      {/* Timeline rows */}
      <div className="py-2">
        {groups.map(([time, grp]) => (
          <TimelineRow
            key={time}
            time={time}
            blocks={grp}
            nowMin={nowMin}
            dayIdx={dayIdx}
            tripDay={tripDay}
          />
        ))}
      </div>
    </div>
  );
}

// ─── NowNextStrip ────────────────────────────────────────────────────────────

function NowNextStrip({
  schedule, nowMin, tripDay,
}: { schedule: ScheduleBlock[]; nowMin: number; tripDay: number }) {
  const todays = useMemo(() => schedule.filter(b => b.day === tripDay), [schedule, tripDay]);

  let current: ScheduleBlock | null = null;
  let next: ScheduleBlock | null = null;
  for (let i = 0; i < todays.length; i++) {
    const b = todays[i];
    if (toMin(b.start) <= nowMin && nowMin < toMin(b.end)) { current = b; next = todays[i + 1] || null; break; }
    if (toMin(b.start) > nowMin) { next = b; break; }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      {/* Happening now */}
      <div
        className="border rounded-lg p-4 flex flex-col gap-2"
        style={{ background: "var(--cat-free-bg)", borderColor: "rgba(13,153,255,0.2)" }}
      >
        <div
          className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--cat-free)" }}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "var(--cat-free)" }} />
            <span className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: "var(--cat-free)" }} />
          </span>
          Happening now
        </div>
        <p className="text-[17px] font-semibold tracking-tight text-foreground leading-snug m-0">
          {current ? current.title : "Between blocks"}
        </p>
        {current && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 bg-white/70 border border-[rgba(13,153,255,0.2)] rounded-full px-2.5 py-0.5 text-[12px] font-medium text-foreground">
              <Clock size={11} className="shrink-0" />
              {fmtTime(current.start).full} – {fmtTime(current.end).full}
            </span>
            <span className="inline-flex items-center gap-1 bg-white/70 border border-[rgba(13,153,255,0.2)] rounded-full px-2.5 py-0.5 text-[12px] font-medium text-foreground">
              {CAT_LABEL[current.cat]}
            </span>
          </div>
        )}
      </div>

      {/* Up next */}
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <ArrowRight size={13} className="shrink-0" />
          Up next
        </div>
        <p className="text-[17px] font-semibold tracking-tight text-foreground leading-snug m-0">
          {next ? next.title : "Day complete"}
        </p>
        {next && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 bg-muted border border-border rounded-full px-2.5 py-0.5 text-[12px] font-medium text-muted-foreground">
              <Clock size={11} className="shrink-0" />
              {fmtTime(next.start).full}
            </span>
            <span className="inline-flex items-center gap-1 bg-muted border border-border rounded-full px-2.5 py-0.5 text-[12px] font-medium text-muted-foreground">
              {CAT_LABEL[next.cat]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar panels ──────────────────────────────────────────────────────────

function PanelHeader({ icon, title, count }: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
      <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-1.5 m-0">
        {icon}
        {title}
      </h3>
      {count !== undefined && (
        <span className="bg-muted rounded-full px-2 py-0.5 text-[11px] text-muted-foreground font-semibold tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

function LeadersPanel({ dayIdx }: { dayIdx: number }) {
  const keys = DAY_LEADERS[dayIdx] || [];
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <PanelHeader
        icon={<Users size={14} className="text-muted-foreground shrink-0" />}
        title="Leaders on Point"
        count={keys.length}
      />
      <div className="flex flex-col divide-y divide-border">
        {keys.map(key => {
          const L   = LEADERS[key];
          const cat = LEADER_CAT[key];
          return (
            <div key={key} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
              <div
                className="w-6 h-6 rounded-sm grid place-items-center shrink-0 mt-0.5"
                style={{
                  background: cat ? cbg(cat) : "var(--muted)",
                  color:      cat ? cc(cat)  : "var(--muted-foreground)",
                }}
              >
                <L.Icon size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground m-0">
                  {L.label}
                </p>
                <p className="text-[13px] text-foreground font-medium mt-0.5 leading-snug m-0">
                  {L.names}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickReferencePanel() {
  const items = [
    { k: "Check-in",    v: "Mon · 3:00 PM"  },
    { k: "Check-out",   v: "Thu · 10:00 AM" },
    { k: "Lights out",  v: "10:00 PM"        },
    { k: "Pool",        v: "10 AM – 9 PM"    },
    { k: "Spa",         v: "5 – 8 PM"        },
    { k: "Project Mgr", v: "Ricardo Merino"  },
  ];
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <PanelHeader
        icon={<Info size={14} className="text-muted-foreground shrink-0" />}
        title="Quick Reference"
      />
      <div className="flex flex-col divide-y divide-border">
        {items.map(({ k, v }) => (
          <div key={k} className="flex items-center justify-between py-2 first:pt-0 last:pb-0 gap-4">
            <span className="text-[13px] text-muted-foreground">{k}</span>
            <span className="text-[13px] text-foreground font-medium tabular-nums text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SafetyPanel() {
  const AlertTag = ({ label }: { label: string }) => (
    <span
      className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold mr-1"
      style={{ background: "var(--cat-milestone-bg)", color: "var(--cat-milestone-text)" }}
    >
      {label}
    </span>
  );
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <PanelHeader
        icon={<Shield size={14} style={{ color: "var(--cat-meal)" }} className="shrink-0" />}
        title="Safety Notes"
      />
      <div className="flex flex-col gap-3 text-[13px] text-muted-foreground leading-relaxed">
        <p className="m-0">
          <AlertTag label="Lake" />
          Buddy system in effect · life vests required for kayaks & pedal boats.
        </p>
        <p className="m-0">
          <AlertTag label="Allergies" />
          <strong className="text-foreground font-semibold">Kaidyn</strong> peanut/tree nut (anaphylaxis),{" "}
          <strong className="text-foreground font-semibold">Merritt</strong> red dye 40,{" "}
          <strong className="text-foreground font-semibold">Lincoln</strong> apples,{" "}
          <strong className="text-foreground font-semibold">Mia</strong> hydrogenated oils + penicillin,{" "}
          <strong className="text-foreground font-semibold">Parker</strong> environmental + ants.
        </p>
        <p className="m-0">
          <AlertTag label="Wildlife" />
          2 longhorns + donkey "Jill" on property — feed carrots, no petting.
        </p>
      </div>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function Legend() {
  const cats: Category[] = ["meal","free","spirit","activity","travel","milestone","lights"];
  return (
    <div className="mt-4 bg-card border border-border rounded-lg px-4 py-3 flex flex-wrap gap-x-4 gap-y-2 items-center">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Legend
      </span>
      {cats.map(cat => {
        const CatIcon = CAT_ICON[cat];
        return (
          <span key={cat} className="inline-flex items-center gap-1.5 text-[12px] text-foreground font-medium">
            <span
              className="w-[18px] h-[18px] rounded-sm grid place-items-center shrink-0"
              style={{ background: cbg(cat), color: cc(cat) }}
            >
              <CatIcon size={11} />
            </span>
            {CAT_LABEL[cat]}
          </span>
        );
      })}
    </div>
  );
}

// ─── SyncButton ──────────────────────────────────────────────────────────────

type SyncStatus = "idle" | "loading" | "success" | "error";

function SyncButton({
  status, lastSync, onSync,
}: { status: SyncStatus; lastSync: Date | null; onSync: () => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={onSync}
        disabled={status === "loading"}
        className={cn(
          "inline-flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer",
          status === "error"   ? "bg-card border-[color:var(--cat-milestone)] text-[color:var(--cat-milestone-text)]"
          : status === "success" ? "bg-card border-[color:var(--cat-activity)] text-[color:var(--cat-activity-text)]"
          : "bg-card border-border text-foreground hover:border-muted-foreground",
          status === "loading" && "opacity-60 cursor-wait",
        )}
      >
        {status === "loading" ? <RefreshCw size={12} className="animate-spin shrink-0" />
         : status === "success" ? <CheckCircle size={12} className="shrink-0" />
         : status === "error"   ? <AlertCircle size={12} className="shrink-0" />
         : <RefreshCw size={12} className="shrink-0" />}
        {status === "loading" ? "Syncing…"
         : status === "success" ? "Synced"
         : status === "error"   ? "Sync failed"
         : "Sync from Sheet"}
      </button>
      {lastSync && status !== "loading" && (
        <span className="text-[11px] text-muted-foreground">
          {lastSync.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
      )}
      <a
        href={SHEET_EDIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink size={11} className="shrink-0" />
        Open Sheet
      </a>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [now, setNow]             = useState(new Date());
  const [currentDay, setCurrentDay] = useState(() => getTripDay(new Date()) ?? 0);
  const [schedule, setSchedule]   = useState<ScheduleBlock[]>(DEFAULT_SCHEDULE);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSync, setLastSync]   = useState<Date | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const tripDay = getTripDay(now);
  const nowMin  = now.getHours() * 60 + now.getMinutes();

  const handleSync = async () => {
    setSyncStatus("loading");
    try {
      const res = await fetch(SHEET_CSV_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csv = await res.text();
      if (csv.trim().startsWith("<")) {
        throw new Error("Sheet returned HTML — change sharing to 'Anyone with the link'");
      }
      const parsed = parseSheetCSV(csv);
      setLastSync(new Date());
      if (parsed.length === 0) {
        setSyncStatus("success");
        toast.info(
          "Sheet connected ✓ — Schedule tab has no events yet. Fill in rows then sync again.",
          { duration: 8000 }
        );
      } else {
        setSchedule(parsed);
        setSyncStatus("success");
        toast.success(`Synced ${parsed.length} items from Sheet`);
      }
    } catch (err: unknown) {
      setSyncStatus("error");
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Sync failed: ${msg}`, { duration: 7000 });
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontSize: "14px", lineHeight: "1.5" }}>
      <Toaster position="top-center" richColors />

      {/* Page wrapper — tight on mobile, comfortable on desktop */}
      <div className="max-w-[1200px] mx-auto px-4 pt-5 pb-24 sm:px-6 sm:pt-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:mb-5">
          <div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-1">
              <MapPin size={12} className="opacity-60 shrink-0" />
              <span>Restoration Ranch · Midfield, TX</span>
              <ChevronRight size={11} className="opacity-40 shrink-0" />
              <span>2026 High Adventure</span>
            </div>
            <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-foreground m-0 p-0 leading-tight">
              Daily Schedule
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5 m-0">
              28 youth · 11 adult leaders · 4 days · June 1 – 4, 2026
            </p>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <SyncButton status={syncStatus} lastSync={lastSync} onSync={handleSync} />
            <span className="inline-flex items-center gap-1.5 bg-card border border-border rounded-md px-2.5 py-1.5 text-[12px] font-medium text-foreground">
              <Calendar size={12} className="text-muted-foreground shrink-0" />
              Jun 1 – 4
            </span>
            <span className="inline-flex items-center gap-1.5 bg-foreground text-background rounded-md px-2.5 py-1.5 text-[12px] font-medium tabular-nums">
              <Clock size={12} className="opacity-80 shrink-0" />
              {fmtClock(now)}
            </span>
          </div>
        </header>

        {/* ── Day tabs — 2 cols mobile → 4 cols sm+ ──────────── */}
        <nav className="bg-card border border-border rounded-lg p-1 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-0.5">
          {DAY_LABELS.map((d, i) => {
            const isActive = currentDay === i;
            const isToday  = tripDay === i;
            return (
              <button
                key={i}
                onClick={() => setCurrentDay(i)}
                className={cn(
                  "relative text-left rounded-md px-3 py-2.5 transition-all duration-150 cursor-pointer border-none font-[inherit]",
                  isActive
                    ? "bg-background shadow-sm text-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {isToday && (
                  <span
                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--cat-free)" }}
                  />
                )}
                <span className="flex items-baseline gap-1">
                  <span className="text-[17px] font-semibold tracking-tight leading-none">{d.num}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{d.mo}</span>
                </span>
                <p className={cn("text-[12px] font-medium mt-0.5 m-0", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {d.short}
                </p>
              </button>
            );
          })}
        </nav>

        {/* ── Now / Next (only during trip) ──────────────────── */}
        {tripDay !== null && (
          <NowNextStrip schedule={schedule} nowMin={nowMin} tripDay={tripDay} />
        )}

        {/* ── Main layout: stacked on mobile → side-by-side on lg ── */}
        <div className="flex flex-col gap-4 lg:grid lg:gap-5" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>

          {/* Timeline — full width on mobile, 1fr on desktop */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDay}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="min-w-0"
            >
              <DayPane
                dayIdx={currentDay}
                schedule={schedule}
                nowMin={tripDay === currentDay ? nowMin : null}
                tripDay={tripDay}
              />
            </motion.div>
          </AnimatePresence>

          {/* Sidebar — below timeline on mobile, fixed column on desktop */}
          <aside className="flex flex-col gap-3">
            <LeadersPanel dayIdx={currentDay} />
            <QuickReferencePanel />
            <SafetyPanel />
          </aside>
        </div>

        {/* ── Legend ─────────────────────────────────────────── */}
        <Legend />

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="mt-4 flex items-center justify-between text-[12px] text-muted-foreground/50 py-3 px-1">
          <span className="text-muted-foreground font-medium">Bonds Ranch · 2026 High Adventure</span>
          <span>Updated 5 · 23 · 26</span>
        </footer>
      </div>
    </div>
  );
}
