import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Rating {
  id: string;
  display_name: string | null;
  stars: number;
  comment: string | null;
  created_at: string;
}

const Stars = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        onClick={() => onChange?.(n)}
        className={`h-4 w-4 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} ${onChange ? "cursor-pointer" : ""}`}
      />
    ))}
  </div>
);

const RatingsSection = () => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [idx, setIdx] = useState(0);

  const load = async () => {
    const { data } = await supabase.from("ratings").select("*").order("created_at", { ascending: false }).limit(30);
    setRatings((data as Rating[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (ratings.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ratings.length), 4000);
    return () => clearInterval(t);
  }, [ratings.length]);

  const submit = async () => {
    if (!user) return toast.info("Please sign in to rate");
    if (comment.length > 280) return toast.error("Comment too long");
    setSubmitting(true);
    const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("ratings").insert({
      user_id: user.id,
      stars,
      comment: comment.trim() || null,
      display_name: prof?.display_name || user.email?.split("@")[0] || "User",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for your rating!");
    setComment("");
    setStars(5);
    load();
  };

  const avg = ratings.length ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1) : "—";

  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-heading text-3xl font-bold">User Ratings</h2>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Stars value={Math.round(parseFloat(avg) || 0)} />
            <span className="font-semibold">{avg}</span>
            <span className="text-muted-foreground">({ratings.length} ratings)</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : ratings.length > 0 ? (
          <div className="relative max-w-md mx-auto">
            <div className="bg-card rounded-xl shadow-card p-4 min-h-[120px]">
              <Stars value={ratings[idx].stars} />
              <p className="text-sm mt-2 text-foreground/90 line-clamp-3">{ratings[idx].comment || "No comment"}</p>
              <p className="text-xs text-muted-foreground mt-2">— {ratings[idx].display_name || "Anonymous"}</p>
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {ratings.slice(0, 8).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx % 8 ? "w-6 bg-accent" : "w-1.5 bg-muted-foreground/30"}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm">No ratings yet. Be the first!</p>
        )}

        <div className="bg-card rounded-xl shadow-card p-5 max-w-md mx-auto space-y-3">
          <h3 className="font-semibold text-sm">Leave a rating</h3>
          {user ? (
            <>
              <Stars value={stars} onChange={setStars} />
              <Input
                placeholder="Your feedback (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 280))}
                maxLength={280}
              />
              <Button onClick={submit} disabled={submitting} size="sm" className="w-full">
                {submitting ? "Submitting…" : "Submit rating"}
              </Button>
            </>
          ) : (
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/auth">Sign in to rate</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default RatingsSection;
