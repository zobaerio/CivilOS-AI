import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  featured: boolean;
}

const SponsorSlider = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("sponsors")
        .select("id, name, logo_url, website, description, featured")
        .eq("status", "active")
        .order("featured", { ascending: false });
      setSponsors((data as Sponsor[]) || []);
    })();
  }, []);

  const featured = sponsors.filter((s) => s.featured);
  const regular = sponsors.filter((s) => !s.featured);
  // Duplicate for seamless infinite scroll
  const loop = regular.length > 0 ? [...regular, ...regular, ...regular] : [];

  return (
    <section className="py-14 bg-muted/30">
      <div className="container space-y-6">
        <div className="text-center space-y-1">
          <h2 className="font-heading text-2xl md:text-3xl font-bold">Our Sponsors</h2>
          <p className="text-muted-foreground text-sm">Partners supporting affordable engineering tools.</p>
        </div>

        {featured.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
            {featured.map((s) => (
              <a key={s.id} href={s.website || "#"} target="_blank" rel="noopener noreferrer"
                className="bg-gradient-to-br from-accent/10 to-primary/5 border-2 border-accent/30 rounded-xl p-4 flex items-center gap-3 hover:shadow-lg transition-shadow">
                {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-12 w-12 object-contain" /> : <div className="h-12 w-12 rounded bg-muted flex items-center justify-center font-bold">{s.name[0]}</div>}
                <div className="min-w-0">
                  <p className="text-[10px] text-accent font-bold tracking-wide">FEATURED</p>
                  <p className="font-heading font-bold truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>}
                </div>
              </a>
            ))}
          </div>
        )}

        {loop.length > 0 ? (
          <div className="relative overflow-hidden mask-fade">
            <div className="flex gap-6 animate-marquee" style={{ width: "max-content" }}>
              {loop.map((s, i) => (
                <a key={`${s.id}-${i}`} href={s.website || "#"} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 bg-card rounded-lg p-3 w-32 h-20 flex flex-col items-center justify-center gap-1 hover:shadow-md transition-shadow border border-border">
                  {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-8 max-w-[80%] object-contain" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold">{s.name[0]}</div>}
                  <p className="text-[10px] font-medium text-center truncate w-full">{s.name}</p>
                </a>
              ))}
            </div>
          </div>
        ) : featured.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">Be our first sponsor!</p>
        ) : null}

        <div className="text-center">
          <Button asChild variant="outline" size="sm">
            <Link to="/sponsor">Become a Sponsor</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SponsorSlider;
