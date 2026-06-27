"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Search, Edit, Trash2, Loader2, Users } from "lucide-react";
import type { Family, Member } from "@/types/database";

export default function AdminFamiliesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      const { data } = await supabase
        .from("families")
        .select("*")
        .order("name");
      setFamilies(data || []);
    } catch (error) {
      console.error("Error fetching families:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      await supabase.from("families").insert({
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address || null,
      });
      setFormData({ name: "", phone: "", address: "" });
      setShowAddModal(false);
      fetchFamilies();
    } catch (error) {
      console.error("Error adding family:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingFamily || !formData.name.trim()) return;
    setSaving(true);
    try {
      await supabase
        .from("families")
        .update({
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
        })
        .eq("id", editingFamily.id);
      setEditingFamily(null);
      setShowEditModal(false);
      fetchFamilies();
    } catch (error) {
      console.error("Error updating family:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this family?")) return;
    try {
      await supabase.from("families").delete().eq("id", id);
      fetchFamilies();
    } catch (error) {
      console.error("Error deleting family:", error);
    }
  };

  const openEditModal = (family: Family) => {
    setEditingFamily(family);
    setFormData({
      name: family.name,
      phone: family.phone || "",
      address: family.address || "",
    });
    setShowEditModal(true);
  };

  const filteredFamilies = families.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Families</h1>
          <p className="text-sm text-muted-foreground">Manage family groups</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Family
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search families..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 input-field"
        />
      </div>

      {/* Families List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredFamilies.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No families found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFamilies.map((family) => (
            <Card key={family.id} className="glass-card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                      {family.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{family.name}</h3>
                      {family.phone && (
                        <p className="text-sm text-muted-foreground">{family.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(family)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(family.id)}
                      className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Family</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Family Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sharma Family"
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address"
                className="input-field"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving || !formData.name.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Family
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Family</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Family Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sharma Family"
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address"
                className="input-field"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving || !formData.name.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
