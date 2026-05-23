import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ForkKnife, Users, Fire, Barbell, Truck, Flag, Moon,
  Clock, ArrowRight, MapPin, ShieldCheck, Info,
  ArrowClockwise, CheckCircle, WarningCircle, ArrowSquareOut,
  CaretRight, Waves, ClipboardText, Radio, UserList,
  ArrowFatUp, GearSix, CopySimple, X, Link,
} from "@phosphor-icons/react";

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

// ─── Google Apps Script to deploy on the Sheet ───────────────────────────────
// Deploy as Web App: Execute as = Me, Who has access = Anyone
const GAS_SCRIPT = `function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Schedule');
    if (!sheet) sheet = ss.insertSheet('Schedule');
    const headers = ['Day','Start','End','Cat','Title','Sub','Lead','Owner'];
    sheet.clearContents();
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    if (payload.rows && payload.rows.length > 0) {
      const rows = payload.rows.map(r =>
        [r.day, r.start, r.end, r.cat, r.title, r.sub, r.lead||'', r.owner||'']
      );
      sheet.getRange(2,1,rows.length,headers.length).setValues(rows);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, written: payload.rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet() {
  return ContentService.createTextOutput('Schedule webhook active');
}`;

// ─── Schedule data ───────────────────────────────────────────────────────────

const DEFAULT_SCHEDULE: ScheduleBlock[] = [
  { day:0, start:"07:00", end:"07:30", cat:"milestone", title:"Depart for Restoration Ranch",                sub:"Caravan rolls out — meet at church parking lot 6:30 for loading.",                  lead:"travel"    },
  { day:0, start:"07:30", end:"12:00", cat:"travel",    title:"Travel — caravan to Midfield, TX",            sub:"~5 hr drive · 6 vehicles · gas stop midway. Save fuel receipts only.",             lead:"travel"    },
  { day:0, start:"12:00", end:"13:00", cat:"meal",      title:"Lunch on the road",                           sub:"Sack lunches packed by food team.",                                                owner:"Food team" },
  { day:0, start:"13:00", end:"15:00", cat:"milestone", title:"Arrive Restoration Ranch · unpack & explore", sub:"Self check-in via keypad. Settle into Main Lodge, Liberty House, and 3 cabins.",   lead:"logistics" },
  { day:0, start:"15:00", end:"17:00", cat:"activity",  title:"Ice Breaker Games",                           sub:"Missionary Tag · Human Knot · Silent line-up challenges.",                         lead:"ranch"     },
  { day:0, start:"17:00", end:"18:00", cat:"free",      title:"Dinner prep / downtime",                      sub:"Crew on duty sets up. Others: pool, gym, walks, lake."                                              },
  { day:0, start:"18:00", end:"19:00", cat:"meal",      title:"Dinner — Pizza Night",                        sub:"Set tables for ~40.",                                                             owner:"YW 12–14"  },
  { day:0, start:"19:00", end:"20:00", cat:"spirit",    title:"Spiritual Activity / Workshop",               sub:"Kick-off devotional — Walking With Him theme.",                                   lead:"spirit"    },
  { day:0, start:"20:00", end:"22:00", cat:"activity",  title:"Ghost in the Graveyard",                      sub:"Wide-area night game on the lawn. Adults patrol perimeter.",                       lead:"ranch"     },
  { day:0, start:"22:00", end:"22:30", cat:"lights",    title:"Lights Out",                                  sub:"Bed check by cabin/room leaders.",                                                lead:"logistics" },
  { day:1, start:"08:00", end:"09:00", cat:"meal",      title:"Breakfast — Pancakes & Bacon",                sub:"Set up at the lodge kitchen.",                                                    owner:"YW 15–18"       },
  { day:1, start:"09:00", end:"10:00", cat:"spirit",    title:"Spiritual Activity / Workshop",               sub:"Morning devotional — building daily habits.",                                     lead:"spirit"          },
  { day:1, start:"10:00", end:"12:00", cat:"activity",  title:"Team Building Games",                         sub:"Balloon Stampede · Balloon Chase · Human Foosball · Partner Ball.",               lead:"ranch"           },
  { day:1, start:"12:00", end:"13:00", cat:"meal",      title:"Lunch — Sandwiches & Chips",                  sub:"",                                                                               owner:"Deacons Quorum"  },
  { day:1, start:"13:00", end:"15:00", cat:"free",      title:"Downtime",                                    sub:"Swim · gym · basketball · volleyball · pickleball · ultimate · 4-square · board games."              },
  { day:1, start:"15:00", end:"17:00", cat:"activity",  title:"Slip-n-Slide Kickball + Water Volleyball",    sub:"South lawn. Towels at the pool deck.",                                            lead:"ranch"           },
  { day:1, start:"17:00", end:"18:00", cat:"free",      title:"Dinner prep / downtime",                      sub:"Teachers' crew on grill duty."                                                                       },
  { day:1, start:"18:00", end:"19:00", cat:"meal",      title:"Dinner — Burgers & Hot Dogs",                 sub:"Grill on the patio.",                                                            owner:"Teachers Quorum" },
  { day:1, start:"19:00", end:"20:00", cat:"spirit",    title:"Spiritual Activity / Workshop",               sub:"Evening devotional.",                                                            lead:"spirit"          },
  { day:1, start:"20:00", end:"22:00", cat:"activity",  title:"Sports Rotations + Game Room",                sub:"Volleyball · basketball · pickleball · cards · Heads Up.",                        lead:"ranch"           },
  { day:1, start:"22:00", end:"22:30", cat:"lights",    title:"Lights Out",                                  sub:"Bed check.",                                                                     lead:"logistics"       },
  { day:2, start:"08:00", end:"09:00", cat:"meal",      title:"Breakfast — Breakfast Burritos & Fruit",      sub:"",                                                                               owner:"Priests Quorum"  },
  { day:2, start:"09:00", end:"11:00", cat:"activity",  title:"Nature Walk · Hike",                          sub:"Walking paths across the 67-acre property. Sunscreen + water bottles.",           lead:"ranch"           },
  { day:2, start:"12:00", end:"13:00", cat:"meal",      title:"Lunch — Chicken Sandwiches",                  sub:"Chips, apples/oranges.",                                                         owner:"YW 12–14"       },
  { day:2, start:"13:00", end:"14:00", cat:"free",      title:"Downtime",                                    sub:"Open recreation."                                                                                    },
  { day:2, start:"14:00", end:"15:00", cat:"spirit",    title:'Spiritual Workshop — "What is a testimony?"', sub:"Small-group breakouts.",                                                         lead:"spirit"          },
  { day:2, start:"15:00", end:"17:00", cat:"activity",  title:"Partner Portrait Painting",                   sub:"Lodge common area. Tarps down.",                                                 lead:"ranch"           },
  { day:2, start:"17:00", end:"18:00", cat:"free",      title:"Dinner prep / downtime",                      sub:"YW 15–18 crew preps pasta bar."                                                                       },
  { day:2, start:"18:00", end:"19:00", cat:"meal",      title:"Dinner — Pasta Bar",                          sub:"French bread, salad, grapes.",                                                   owner:"YW 15–18"       },
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

type PhosphorIcon = React.ComponentType<{ size?: number; weight?: string; className?: string; style?: React.CSSProperties }>;

const LEADERS: Record<LeaderKey, { label: string; names: string; Icon: PhosphorIcon }> = {
  meal:      { label: "Food & Meals",      names: "Lynette Ballard · Ashley Harrington · Jamison Rousculp", Icon: ForkKnife   },
  spirit:    { label: "Spiritual",          names: "Nick Taylor · Caroline Sagers",                          Icon: Fire        },
  ranch:     { label: "Ranch Activities",   names: "Charlton Castlemain · Megan Garrett · Jennie Williams",  Icon: Barbell     },
  beach:     { label: "Beach / Lake",       names: "Sara Mefford · Oscar Castro",                            Icon: Waves       },
  travel:    { label: "Travel Planner",     names: "Laurence Hill · Paul Zahrabelny",                        Icon: Truck       },
  logistics: { label: "Logistics & Safety", names: "Michelle Smith · Chandler Holmes · Spencer Crichton",    Icon: ClipboardText },
  comms:     { label: "Communications",     names: "Ricardo Merino",                                         Icon: Radio       },
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

const CAT_ICON: Record<Category, PhosphorIcon> = {
  meal: ForkKnife, free: Users, spirit: Fire, activity: Barbell,
  travel: Truck, milestone: Flag, lights: Moon,
};

const DAY_LABELS = [
  { full: "Monday, June 1",    short: "Drive Down",  num: "1", tag: "Mon Jun 1" },
  { full: "Tuesday, June 2",   short: "Ranch Day 1", num: "2", tag: "Tue Jun 2" },
  { full: "Wednesday, June 3", short: "Ranch Day 2", num: "3", tag: "Wed Jun 3" },
  { full: "Thursday, June 4",  short: "Drive Back",  num: "4", tag: "Thu Jun 4" },
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

// All color helpers reference CSS variables from theme.css
const cc    = (cat: Category) => `var(--cat-${cat})`;
const cbg   = (cat: Category) => `var(--cat-${cat}-bg)`;
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

// ─── CatChip ─────────────────────────────────────────────────────────────────
// Color-coded pill chip — primary category signal throughout the UI

function CatChip({ cat, size = "sm" }: { cat: Category; size?: "sm" | "xs" }) {
  const CatIcon = CAT_ICON[cat];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider whitespace-nowrap shrink-0",
        size === "xs" ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]",
      )}
      style={{ background: cbg(cat), color: ctext(cat) }}
    >
      <CatIcon size={size === "xs" ? 8 : 9} weight="bold" />
      {CAT_LABEL[cat]}
    </span>
  );
}

// ─── BlockRow ────────────────────────────────────────────────────────────────
// Flat row with 3px category left-border — no card depth

function BlockRow({
  block, isNow = false, isPast = false,
}: { block: ScheduleBlock; isNow?: boolean; isPast?: boolean }) {
  const CatIcon  = CAT_ICON[block.cat];
  const leader   = block.lead ? LEADERS[block.lead as LeaderKey] : null;
  const duration = fmtDuration(block.start, block.end);

  return (
    <div
      className={cn(
        "relative flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted/50",
        isPast && "opacity-35",
      )}
      style={{
        borderLeft: `3px solid var(--cat-${block.cat})`,
        background: isNow ? "var(--cat-free-bg)" : undefined,
      }}
    >
      {/* Category icon chip */}
      <div
        className="flex items-center justify-center w-[18px] h-[18px] rounded shrink-0 mt-[2px]"
        style={{ color: cc(block.cat), background: cbg(block.cat) }}
      >
        <CatIcon size={10} weight="bold" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span className="text-[13px] font-semibold text-foreground leading-snug tracking-tight min-w-0 flex-1">
            {block.title}
          </span>
          <CatChip cat={block.cat} />
        </div>

        {block.sub && (
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
            {block.sub}
          </p>
        )}

        {(duration || block.owner || leader) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {duration && (
              <span
                className="text-[10px] font-medium text-muted-foreground/60 tabular-nums"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {duration}
              </span>
            )}
            {block.owner && (
              <span className="inline-flex items-center gap-1 rounded bg-muted border border-border px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                <Users size={9} weight="bold" className="shrink-0 opacity-60" />
                {block.owner}
              </span>
            )}
            {leader && (
              <span
                title={`${leader.label}: ${leader.names}`}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted border border-border text-muted-foreground"
              >
                <Users size={10} weight="regular" className="shrink-0" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TimelineGroup ───────────────────────────────────────────────────────────

function TimelineGroup({
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
    <div className="flex border-b border-border last:border-b-0">
      {/* Time gutter */}
      <div className="w-[60px] sm:w-[72px] shrink-0 pt-3 pb-2 px-2 text-right border-r border-border">
        {isNow && (
          <div className="flex justify-end mb-1">
            <span className="relative inline-flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--cat-free)" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--cat-free)" }} />
            </span>
          </div>
        )}
        <div
          className={cn(
            "text-[12px] font-medium leading-none tabular-nums",
            isPast && "opacity-40",
          )}
          style={{ fontFamily: "var(--font-mono)", color: isNow ? "var(--cat-free)" : undefined }}
        >
          {t.h12}{t.min}
        </div>
        <div className={cn("text-[9px] uppercase tracking-wider mt-0.5 text-muted-foreground/40", isPast && "opacity-40")}>
          {t.ampm}
        </div>
      </div>

      {/* Block rows */}
      <div className="flex-1 flex flex-col divide-y divide-border min-w-0">
        {blocks.map((b, i) => (
          <BlockRow
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
    <div className="bg-card border border-border rounded overflow-hidden">
      <div
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between px-3 py-2 border-b border-border bg-muted/30"
        style={{ borderLeft: "4px solid var(--cat-activity)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground tracking-tight">{d.full}</span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-px rounded text-muted-foreground"
            style={{ background: "var(--accent)" }}
          >
            {d.short}
          </span>
        </div>
        {first && last && (
          <div
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Clock size={10} weight="regular" className="opacity-50 shrink-0" />
            {blocks.length} events · {first} – {last}
          </div>
        )}
      </div>

      <div className="divide-y divide-border">
        {groups.map(([time, grp]) => (
          <TimelineGroup
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
      <div
        className="border rounded p-3 flex flex-col gap-1.5"
        style={{ borderColor: "rgba(13,153,255,0.25)", background: "var(--cat-free-bg)" }}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--cat-free)" }}>
          <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--cat-free)" }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "var(--cat-free)" }} />
          </span>
          Now
        </div>
        <p className="text-[15px] font-semibold tracking-tight text-foreground leading-snug">
          {current ? current.title : "Between blocks"}
        </p>
        {current && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <Clock size={10} weight="regular" />
              {fmtTime(current.start).full} – {fmtTime(current.end).full}
            </span>
            <CatChip cat={current.cat} size="xs" />
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded p-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <ArrowRight size={11} weight="bold" />
          Up Next
        </div>
        <p className="text-[15px] font-semibold tracking-tight text-foreground leading-snug">
          {next ? next.title : "Day complete"}
        </p>
        {next && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <Clock size={10} weight="regular" />
              {fmtTime(next.start).full}
            </span>
            <CatChip cat={next.cat} size="xs" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar panels ──────────────────────────────────────────────────────────

function SidePanel({ children }: { children: React.ReactNode }) {
  return <div className="bg-card border border-border rounded overflow-hidden">{children}</div>;
}

function SidePanelHeader({ icon, title, count }: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </div>
      {count !== undefined && (
        <span
          className="text-[10px] font-semibold text-muted-foreground px-1.5 py-px rounded"
          style={{ background: "var(--accent)", fontFamily: "var(--font-mono)" }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function LeadersPanel({ dayIdx }: { dayIdx: number }) {
  const keys = DAY_LEADERS[dayIdx] || [];
  return (
    <SidePanel>
      <SidePanelHeader
        icon={<UserList size={11} weight="bold" style={{ color: "var(--cat-spirit)" }} />}
        title="Leaders on Point"
        count={keys.length}
      />
      <div className="divide-y divide-border">
        {keys.map(key => {
          const L   = LEADERS[key];
          const cat = LEADER_CAT[key];
          return (
            <div key={key} className="flex items-start gap-2.5 px-3 py-2">
              <div
                className="w-[18px] h-[18px] flex items-center justify-center rounded shrink-0 mt-px"
                style={{
                  background: cat ? cbg(cat) : "var(--muted)",
                  color:      cat ? cc(cat)  : "var(--muted-foreground)",
                }}
              >
                <L.Icon size={10} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {L.label}
                </p>
                <p className="text-[12px] text-foreground font-medium mt-px leading-snug">
                  {L.names}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SidePanel>
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
    <SidePanel>
      <SidePanelHeader
        icon={<Info size={11} weight="bold" style={{ color: "var(--cat-free)" }} />}
        title="Quick Reference"
      />
      <div className="divide-y divide-border">
        {items.map(({ k, v }) => (
          <div key={k} className="flex items-center justify-between px-3 py-1.5 gap-4">
            <span className="text-[12px] text-muted-foreground">{k}</span>
            <span
              className="text-[11px] font-medium text-right"
              style={{ fontFamily: "var(--font-mono)", color: "var(--cat-free-text)" }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>
    </SidePanel>
  );
}

function SafetyPanel() {
  return (
    <SidePanel>
      <SidePanelHeader
        icon={<ShieldCheck size={11} weight="bold" style={{ color: "var(--cat-milestone)" }} />}
        title="Safety Notes"
      />
      <div className="divide-y divide-border text-[12px] text-muted-foreground">
        <div className="px-3 py-2.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <CatChip cat="free" size="xs" />
            <span className="font-semibold text-foreground text-[11px]">Lake / Water</span>
          </div>
          <p>Buddy system in effect. Life vests required for kayaks and pedal boats.</p>
        </div>
        <div className="px-3 py-2.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <CatChip cat="milestone" size="xs" />
            <span className="font-semibold text-foreground text-[11px]">Allergies</span>
          </div>
          <p>
            <strong className="text-foreground">Kaidyn</strong> peanut/tree nut (anaphylaxis) ·{" "}
            <strong className="text-foreground">Merritt</strong> red dye 40 ·{" "}
            <strong className="text-foreground">Lincoln</strong> apples ·{" "}
            <strong className="text-foreground">Mia</strong> hydrogenated oils + penicillin ·{" "}
            <strong className="text-foreground">Parker</strong> environmental + ants.
          </p>
        </div>
        <div className="px-3 py-2.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <CatChip cat="activity" size="xs" />
            <span className="font-semibold text-foreground text-[11px]">Wildlife</span>
          </div>
          <p>2 longhorns + donkey "Jill" on property — feed carrots, no petting.</p>
        </div>
      </div>
    </SidePanel>
  );
}

// ─── WebhookSetupPanel ───────────────────────────────────────────────────────

function WebhookSetupPanel({
  webhookUrl, onSave, onClose,
}: { webhookUrl: string; onSave: (url: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(webhookUrl);

  const copyScript = () => {
    navigator.clipboard.writeText(GAS_SCRIPT).then(() => {
      toast.success("Script copied — paste it into Apps Script editor");
    });
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Link size={11} weight="bold" />
            Push to Sheet — Webhook Setup
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Steps */}
        <ol className="flex flex-col gap-2 text-[12px] text-muted-foreground">
          <li className="flex items-start gap-2">
            <span
              className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-px"
              style={{ background: "var(--cat-free-bg)", color: "var(--cat-free-text)" }}
            >1</span>
            <span>Open your Google Sheet → <strong className="text-foreground">Extensions → Apps Script</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-px"
              style={{ background: "var(--cat-free-bg)", color: "var(--cat-free-text)" }}
            >2</span>
            <span>Paste the script below, then click <strong className="text-foreground">Deploy → New deployment → Web App</strong>. Set <em>Execute as = Me</em> and <em>Who has access = Anyone</em>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-px"
              style={{ background: "var(--cat-free-bg)", color: "var(--cat-free-text)" }}
            >3</span>
            <span>Copy the <strong className="text-foreground">Web App URL</strong> and paste it below, then save.</span>
          </li>
        </ol>

        {/* Script copy */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 truncate text-[10px] text-muted-foreground border border-border rounded px-2 py-1.5 min-w-0"
            style={{ fontFamily: "var(--font-mono)", background: "var(--muted)" }}
          >
            function doPost(e) {"{"} … {"}"}
          </div>
          <button
            onClick={copyScript}
            className="inline-flex items-center gap-1.5 border border-border rounded px-2 py-1.5 text-[11px] font-medium text-foreground bg-card hover:bg-muted transition-colors cursor-pointer shrink-0"
          >
            <CopySimple size={11} weight="bold" />
            Copy Script
          </button>
        </div>

        {/* URL input + save */}
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="https://script.google.com/macros/s/…/exec"
            className="flex-1 min-w-0 border border-border rounded px-2 py-1.5 text-[12px] text-foreground bg-card placeholder:text-muted-foreground outline-none focus:border-foreground transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <button
            onClick={() => { onSave(draft.trim()); onClose(); }}
            disabled={!draft.trim()}
            className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-40"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            <CheckCircle size={11} weight="bold" />
            Save URL
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── PushButton ──────────────────────────────────────────────────────────────

function PushButton({
  status, lastPush, hasWebhook, onPush, onSetup,
}: {
  status: SyncStatus;
  lastPush: Date | null;
  hasWebhook: boolean;
  onPush: () => void;
  onSetup: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={hasWebhook ? onPush : onSetup}
        disabled={status === "loading"}
        className={cn(
          "inline-flex items-center gap-1.5 border rounded px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer bg-card",
          status === "loading" && "opacity-60 cursor-wait",
        )}
        style={
          !hasWebhook
            ? { borderColor: "var(--border)", color: "var(--muted-foreground)" }
            : status === "error"
            ? { borderColor: "var(--cat-milestone)", color: "var(--cat-milestone-text)" }
            : status === "success"
            ? { borderColor: "var(--cat-activity)", color: "var(--cat-activity-text)" }
            : { borderColor: "var(--cat-spirit)", color: "var(--cat-spirit-text)" }
        }
      >
        {status === "loading"  ? <ArrowClockwise size={11} weight="bold" className="animate-spin shrink-0" />
         : status === "success" ? <CheckCircle    size={11} weight="bold" className="shrink-0" />
         : status === "error"   ? <WarningCircle  size={11} weight="bold" className="shrink-0" />
         : !hasWebhook          ? <GearSix        size={11} weight="bold" className="shrink-0" />
         : <ArrowFatUp          size={11} weight="bold" className="shrink-0" />}
        {status === "loading" ? "Pushing…"
         : status === "success" ? "Pushed"
         : status === "error"   ? "Push failed"
         : !hasWebhook          ? "Setup push"
         : "Push to Sheet"}
      </button>
      {hasWebhook && lastPush && status !== "loading" && (
        <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
          {lastPush.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
      )}
      {hasWebhook && (
        <button
          onClick={onSetup}
          title="Edit webhook URL"
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <GearSix size={11} weight="bold" />
        </button>
      )}
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
          "inline-flex items-center gap-1.5 border rounded px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer bg-card",
          status === "loading" && "opacity-60 cursor-wait",
        )}
        style={
          status === "error"
            ? { borderColor: "var(--cat-milestone)", color: "var(--cat-milestone-text)" }
            : status === "success"
            ? { borderColor: "var(--cat-activity)", color: "var(--cat-activity-text)" }
            : {}
        }
      >
        {status === "loading"  ? <ArrowClockwise size={11} weight="bold" className="animate-spin shrink-0" />
         : status === "success" ? <CheckCircle    size={11} weight="bold" className="shrink-0" />
         : status === "error"   ? <WarningCircle  size={11} weight="bold" className="shrink-0" />
         : <ArrowClockwise size={11} weight="bold" className="shrink-0" />}
        {status === "loading" ? "Syncing…" : status === "success" ? "Synced" : status === "error" ? "Retry" : "Sync Sheet"}
      </button>
      {lastSync && status !== "loading" && (
        <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
          {lastSync.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
      )}
      <a
        href={SHEET_EDIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowSquareOut size={11} weight="bold" className="shrink-0" />
        Sheet
      </a>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [now, setNow]               = useState(new Date());
  const [currentDay, setCurrentDay] = useState(() => getTripDay(new Date()) ?? 0);
  const [schedule, setSchedule]     = useState<ScheduleBlock[]>(DEFAULT_SCHEDULE);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSync, setLastSync]     = useState<Date | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>(() => localStorage.getItem("schedule-webhook-url") ?? "");
  const [pushStatus, setPushStatus] = useState<SyncStatus>("idle");
  const [lastPush, setLastPush]     = useState<Date | null>(null);
  const [showWebhookSetup, setShowWebhookSetup] = useState(false);

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
        throw new Error("Sheet returned HTML — set sharing to 'Anyone with the link'");
      }
      const parsed = parseSheetCSV(csv);
      setLastSync(new Date());
      if (parsed.length === 0) {
        setSyncStatus("success");
        toast.info("Sheet connected — no rows yet. Fill in the Schedule tab and sync again.", { duration: 8000 });
      } else {
        setSchedule(parsed);
        setSyncStatus("success");
        toast.success(`Synced ${parsed.length} events from Sheet`);
      }
    } catch (err: unknown) {
      setSyncStatus("error");
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Sync failed: ${msg}`, { duration: 7000 });
      console.error(err);
    }
  };

  const saveWebhookUrl = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem("schedule-webhook-url", url);
    if (url) toast.success("Webhook URL saved");
  };

  const handlePush = async () => {
    if (!webhookUrl) { setShowWebhookSetup(true); return; }
    setPushStatus("loading");
    try {
      const rows = schedule.map(b => ({
        day:   b.day + 1,
        start: b.start,
        end:   b.end,
        cat:   b.cat,
        title: b.title,
        sub:   b.sub,
        lead:  b.lead  ?? "",
        owner: b.owner ?? "",
      }));
      // Use text/plain to avoid CORS preflight; GAS can still parse e.postData.contents
      await fetch(webhookUrl, {
        method:   "POST",
        headers:  { "Content-Type": "text/plain;charset=utf-8" },
        body:     JSON.stringify({ rows }),
        redirect: "follow",
        mode:     "no-cors", // GAS redirects strip CORS; fire-and-forget is fine
      });
      setLastPush(new Date());
      setPushStatus("success");
      toast.success(`Pushed ${rows.length} events to Sheet`, { duration: 5000 });
    } catch (err: unknown) {
      setPushStatus("error");
      toast.error(`Push failed: ${err instanceof Error ? err.message : "Network error"}`, { duration: 7000 });
    }
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "var(--font-primary)", fontSize: "14px" }}
    >
      <Toaster position="top-center" richColors />

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <header className="bg-card border-b border-border sticky top-0 z-20">
        {/* Brand accent strip — color from --cat-milestone in theme.css */}
        <div style={{ height: "3px", background: "var(--cat-milestone)" }} />
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
              <MapPin size={12} weight="fill" style={{ color: "var(--cat-milestone)" }} className="shrink-0" />
              <span className="hidden sm:inline text-muted-foreground font-normal">Restoration Ranch ·</span>
              <span>2026 High Adventure</span>
            </div>
            <span className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground">
              <CaretRight size={9} weight="bold" />
              28 youth · 11 leaders · Jun 1–4
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <SyncButton status={syncStatus} lastSync={lastSync} onSync={handleSync} />
            {/* Divider */}
            <div className="w-px h-4 bg-border shrink-0" />
            <PushButton
              status={pushStatus}
              lastPush={lastPush}
              hasWebhook={!!webhookUrl}
              onPush={handlePush}
              onSetup={() => setShowWebhookSetup(v => !v)}
            />
            <div
              className="hidden sm:flex items-center gap-1.5 bg-muted rounded px-2 py-1 text-[11px] font-medium text-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <Clock size={11} weight="regular" className="text-muted-foreground" />
              {fmtClock(now)}
            </div>
          </div>
        </div>
      </header>

      {/* ── Webhook setup panel (slides in below toolbar) ─────────── */}
      {showWebhookSetup && (
        <WebhookSetupPanel
          webhookUrl={webhookUrl}
          onSave={saveWebhookUrl}
          onClose={() => setShowWebhookSetup(false)}
        />
      )}

      {/* ── Page body ────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-3 pb-20">

        {/* ── Day tabs — underline indicator style ─────────────────── */}
        <div className="bg-card border border-border rounded overflow-hidden mb-3">
          <nav className="flex border-b border-border overflow-x-auto">
            {DAY_LABELS.map((d, i) => {
              const isActive = currentDay === i;
              const isToday  = tripDay === i;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentDay(i)}
                  className={cn(
                    "relative flex flex-col items-start px-4 py-2.5 shrink-0 transition-colors cursor-pointer font-[inherit]",
                    isActive
                      ? "text-foreground bg-transparent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                  style={{ borderBottom: isActive ? "2px solid var(--cat-free)" : "2px solid transparent" }}
                >
                  {isToday && (
                    <span
                      className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "var(--cat-free)" }}
                    />
                  )}
                  <span
                    className="text-[13px] font-semibold leading-none"
                    style={isActive ? { color: "var(--cat-free-text)" } : {}}
                  >
                    {d.short}
                  </span>
                  <span
                    className="text-[10px] mt-0.5 opacity-55"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {d.tag}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Category key */}
          <div className="px-3 py-1.5 flex flex-wrap gap-x-2 gap-y-1 items-center">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mr-0.5">Key</span>
            {(["meal","free","spirit","activity","travel","milestone","lights"] as Category[]).map(cat => (
              <CatChip key={cat} cat={cat} size="xs" />
            ))}
          </div>
        </div>

        {/* ── Now/Next (only during trip) ──────────────────────────── */}
        {tripDay !== null && (
          <NowNextStrip schedule={schedule} nowMin={nowMin} tripDay={tripDay} />
        )}

        {/* ── Main: Timeline + Sidebar ─────────────────────────────── */}
        <div className="flex flex-col gap-3 lg:grid lg:gap-4" style={{ gridTemplateColumns: "minmax(0,1fr) 290px" }}>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentDay}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.14 }}
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

          <aside className="flex flex-col gap-3">
            <LeadersPanel dayIdx={currentDay} />
            <QuickReferencePanel />
            <SafetyPanel />
          </aside>
        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground/40 py-2">
          <span>Bonds Ranch · 2026 High Adventure</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>Updated 5·23·26</span>
        </div>
      </div>
    </div>
  );
}
