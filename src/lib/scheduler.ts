// Simple CPM scheduler: WBS tasks with FS/SS/FF/SF dependencies + lag (days)
export type DepType = "FS" | "SS" | "FF" | "SF";
export interface Dep { id: string; type: DepType; lag: number }
export interface Task { id: string; wbs: string; name: string; nameBn: string; duration: number; deps: Dep[]; progress: number }
export interface Scheduled extends Task { es: number; ef: number; ls: number; lf: number; float: number; critical: boolean }

export function schedule(tasks: Task[]): { rows: Scheduled[]; total: number; cycle: boolean } {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const es = new Map<string, number>(), ef = new Map<string, number>();
  const visiting = new Set<string>(); let cycle = false;
  const calc = (id: string): void => {
    if (ef.has(id)) return;
    if (visiting.has(id)) { cycle = true; return; }
    visiting.add(id);
    const t = byId.get(id)!; let start = 0;
    for (const d of t.deps) {
      const p = byId.get(d.id); if (!p) continue;
      calc(d.id);
      const pes = es.get(d.id) ?? 0, pef = ef.get(d.id) ?? 0;
      const s = d.type === "FS" ? pef + d.lag : d.type === "SS" ? pes + d.lag : d.type === "FF" ? pef + d.lag - t.duration : pes + d.lag - t.duration;
      start = Math.max(start, s);
    }
    es.set(id, start); ef.set(id, start + t.duration); visiting.delete(id);
  };
  tasks.forEach((t) => calc(t.id));
  const total = Math.max(0, ...tasks.map((t) => ef.get(t.id) ?? 0));
  // Backward pass
  const lf = new Map<string, number>(), ls = new Map<string, number>();
  const order = [...tasks].sort((a, b) => (ef.get(b.id)! - ef.get(a.id)!));
  for (const t of order) {
    let finish = total;
    for (const s of tasks) for (const d of s.deps) {
      if (d.id !== t.id || !ls.has(s.id)) continue;
      const sls = ls.get(s.id)!, slf = lf.get(s.id)!;
      const f = d.type === "FS" ? sls - d.lag : d.type === "SS" ? sls - d.lag + t.duration : d.type === "FF" ? slf - d.lag : slf - d.lag + t.duration;
      finish = Math.min(finish, f);
    }
    lf.set(t.id, finish); ls.set(t.id, finish - t.duration);
  }
  const rows = tasks.map((t) => {
    const fl = (ls.get(t.id) ?? 0) - (es.get(t.id) ?? 0);
    return { ...t, es: es.get(t.id)!, ef: ef.get(t.id)!, ls: ls.get(t.id)!, lf: lf.get(t.id)!, float: fl, critical: fl <= 0 };
  });
  return { rows, total, cycle };
}

export const TEMPLATE: Task[] = [
  { id: "t1", wbs: "1.1", name: "Site clearing & layout", nameBn: "সাইট পরিষ্কার ও লে-আউট", duration: 5, deps: [], progress: 0 },
  { id: "t2", wbs: "1.2", name: "Excavation", nameBn: "মাটি খনন", duration: 10, deps: [{ id: "t1", type: "FS", lag: 0 }], progress: 0 },
  { id: "t3", wbs: "2.1", name: "Piling / Foundation", nameBn: "পাইলিং / ফাউন্ডেশন", duration: 20, deps: [{ id: "t2", type: "FS", lag: 0 }], progress: 0 },
  { id: "t4", wbs: "2.2", name: "Ground floor columns & slab", nameBn: "নিচতলার কলাম ও ছাদ", duration: 21, deps: [{ id: "t3", type: "FS", lag: 0 }], progress: 0 },
  { id: "t5", wbs: "2.3", name: "Upper floors frame", nameBn: "উপরের তলার কাঠামো", duration: 60, deps: [{ id: "t4", type: "FS", lag: 7 }], progress: 0 },
  { id: "t6", wbs: "3.1", name: "Brick work", nameBn: "ইটের গাঁথুনি", duration: 45, deps: [{ id: "t5", type: "SS", lag: 21 }], progress: 0 },
  { id: "t7", wbs: "3.2", name: "Electrical & plumbing", nameBn: "ইলেকট্রিক ও প্লাম্বিং", duration: 40, deps: [{ id: "t6", type: "SS", lag: 14 }], progress: 0 },
  { id: "t8", wbs: "3.3", name: "Plaster", nameBn: "প্লাস্টার", duration: 30, deps: [{ id: "t6", type: "FS", lag: 0 }, { id: "t7", type: "FF", lag: 5 }], progress: 0 },
  { id: "t9", wbs: "4.1", name: "Flooring & tiles", nameBn: "মেঝে ও টাইলস", duration: 25, deps: [{ id: "t8", type: "FS", lag: 0 }], progress: 0 },
  { id: "t10", wbs: "4.2", name: "Paint & finishing", nameBn: "রং ও ফিনিশিং", duration: 20, deps: [{ id: "t9", type: "SS", lag: 10 }], progress: 0 },
  { id: "t11", wbs: "5.1", name: "Handover", nameBn: "হস্তান্তর", duration: 3, deps: [{ id: "t10", type: "FS", lag: 0 }], progress: 0 },
];

export interface QAItem { id: string; stage: string; en: string; bn: string; done: boolean; note: string }
export const QA_TEMPLATE: QAItem[] = [
  ["Foundation", "Soil test report checked", "মাটি পরীক্ষার রিপোর্ট যাচাই"],
  ["Foundation", "Excavation depth & level verified", "খননের গভীরতা ও লেভেল যাচাই"],
  ["Concrete", "Rebar size, spacing & cover checked", "রডের সাইজ, দূরত্ব ও কভার যাচাই"],
  ["Concrete", "Formwork alignment & props checked", "শাটারিং সোজা ও ঠেকনা যাচাই"],
  ["Concrete", "Slump test done", "স্লাম্প টেস্ট করা হয়েছে"],
  ["Concrete", "Cylinder/cube samples taken", "সিলিন্ডার/কিউব নমুনা নেওয়া"],
  ["Concrete", "Curing for minimum 7–14 days", "কমপক্ষে ৭–১৪ দিন কিউরিং"],
  ["Masonry", "Bricks soaked; mortar ratio correct", "ইট ভেজানো; মসলার অনুপাত ঠিক"],
  ["Masonry", "Wall plumb & line checked", "দেয়াল খাড়া ও সোজা যাচাই"],
  ["Finishing", "Plaster thickness & surface checked", "প্লাস্টারের পুরুত্ব ও তল যাচাই"],
  ["Finishing", "Tile level & joints checked", "টাইলসের লেভেল ও জোড় যাচাই"],
  ["Safety", "Helmets, harness & site barricade in use", "হেলমেট, হারনেস ও সাইট ঘেরা ব্যবহার"],
].map(([stage, en, bn], i) => ({ id: `q${i}`, stage, en, bn, done: false, note: "" }));
