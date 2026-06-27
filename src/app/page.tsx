"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Users, Calendar, Utensils, MessageCircle, BarChart3, Smartphone, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold">
            Comedy Group
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Family Dinner & Party Planner - Plan events, manage RSVPs, and order food together
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button className="btn-primary text-lg px-8 py-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-6 animate-slide-up">
          <Card className="glass-card-hover text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Event Planning</h3>
              <p className="text-muted-foreground">
                Create birthday parties, anniversaries, holiday dinners and more
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card-hover text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-2xl gradient-secondary flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Food Orders</h3>
              <p className="text-muted-foreground">
                Place orders together with quantities for starters, mains, rotis, and more
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card-hover text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">WhatsApp Ready</h3>
              <p className="text-muted-foreground">
                Share order summaries directly to WhatsApp for easy restaurant orders
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 animate-slide-up stagger-2">
          <Card className="glass-card">
            <CardContent className="p-6 flex items-center gap-4">
              <Bell className="w-8 h-8 text-primary" />
              <div>
                <h4 className="font-semibold">Notifications</h4>
                <p className="text-sm text-muted-foreground">Get alerts for new events</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 flex items-center gap-4">
              <BarChart3 className="w-8 h-8 text-primary" />
              <div>
                <h4 className="font-semibold">Reports</h4>
                <p className="text-sm text-muted-foreground">View attendance insights</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 flex items-center gap-4">
              <Smartphone className="w-8 h-8 text-primary" />
              <div>
                <h4 className="font-semibold">Mobile PWA</h4>
                <p className="text-sm text-muted-foreground">Install on your phone</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-20 text-center text-muted-foreground">
          <p>Built for families who love to celebrate together</p>
        </div>
      </div>
    </div>
  );
}
