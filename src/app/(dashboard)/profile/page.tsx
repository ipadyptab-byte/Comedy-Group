"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  LogOut, 
  Settings, 
  Users,
  Shield,
  Crown
} from "lucide-react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'captain':
        return <Shield className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'captain':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Profile Card */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-white text-3xl font-bold">
                {user?.family?.name?.charAt(0) || "F"}
              </div>
              <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-xs text-white font-medium ${getRoleBadge(user?.role || 'member')}`}>
                {getRoleIcon(user?.role || 'member')}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-4">{user?.family?.name || "Family Name"}</h2>
            <p className={`inline-block px-3 py-1 rounded-full text-xs text-white font-medium mt-2 ${getRoleBadge(user?.role || 'member')}`}>
              {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Family Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Family Name</p>
              <p className="font-medium">{user?.family?.name || "Not set"}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || "Not set"}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{user?.family?.phone || "Not set"}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{user?.family?.address || "Not set"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Info */}
      {user?.member && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Primary Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                {user.member.name?.charAt(0) || "M"}
              </div>
              <div>
                <p className="font-medium">{user.member.name}</p>
                <p className="text-sm text-muted-foreground">{user.member.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="glass-card">
        <CardContent className="pt-6 space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Comedy Group Planner</p>
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
}
