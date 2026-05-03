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

const SponsorsSection = () => {
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

  return (
    <section className="py-16">
      <div className="container space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-heading text-3xl font-bold">Our Sponsors</h2>
          <p className="text-muted-foreground text-sm">Partners supporting affordable engineering tools for Bangladesh.</p>
        </div>

        {sponsors.length > 0 ? (
          <>
            {sponsors.some((s) => s.featured) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sponsors.filter((s) => s.featured).map((s) => (
                  <a key={s.id} href={s.website || "#"} target="_blank" rel="noopener noreferrer"
                    className="bg-gradient-to-br from-accent/10 to-primary/5 border-2 border-accent/30 rounded-xl p-6 flex items-center gap-4 hover:shadow-lg transition-shadow">
                    {s.logo_url && <img src={s.logo_url} alt={s.name} className="h-16 w-16 object-contain" />}
                    <div>
                      <p className="text-xs text-accent font-bold">FEATURED SPONSOR</p>
                      <p className="font-heading font-bold text-lg">{s.name}</p>
                      {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                    </div>
                  </a>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sponsors.filter((s) => !s.featured).map((s) => (
                <a key={s.id} href={s.website || "#"} target="_blank" rel="noopener noreferrer"
                  className="bg-card rounded-lg p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.name} className="h-12 w-12 object-contain" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center font-bold">{s.name[0]}</div>
                  )}
                  <p className="text-xs font-medium text-center">{s.name}</p>
                </a>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground text-sm">Be our first sponsor!</p>
        )}

        <div className="text-center">
          <Button asChild variant="outline">
            <Link to="/sponsor">Become a Sponsor</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SponsorsSection;
