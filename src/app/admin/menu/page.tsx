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
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Utensils, GripVertical } from "lucide-react";
import type { MenuCategory, MenuItem } from "@/types/database";

export default function AdminMenuPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ name: "", type: "starter" });
  const [itemForm, setItemForm] = useState({ name: "", description: "", category_id: "" });

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from("menu_categories")
        .select("*")
        .order("display_order");
      
      const { data: itemsData } = await supabase
        .from("menu_items")
        .select("*")
        .order("name");

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching menu data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) return;
    setSaving(true);
    try {
      await supabase.from("menu_categories").insert({
        name: categoryForm.name,
        type: categoryForm.type as any,
        display_order: categories.length,
      });
      setCategoryForm({ name: "", type: "starter" });
      setShowAddCategoryModal(false);
      fetchData();
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !categoryForm.name.trim()) return;
    setSaving(true);
    try {
      await supabase
        .from("menu_categories")
        .update({ name: categoryForm.name })
        .eq("id", editingCategory.id);
      setEditingCategory(null);
      setShowAddCategoryModal(false);
      fetchData();
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category and all its items?")) return;
    try {
      await supabase.from("menu_categories").delete().eq("id", id);
      fetchData();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleAddItem = async () => {
    if (!itemForm.name.trim() || !itemForm.category_id) return;
    setSaving(true);
    try {
      await supabase.from("menu_items").insert({
        name: itemForm.name,
        description: itemForm.description || null,
        category_id: itemForm.category_id,
      });
      setItemForm({ name: "", description: "", category_id: "" });
      setShowAddItemModal(false);
      fetchData();
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !itemForm.name.trim()) return;
    setSaving(true);
    try {
      await supabase
        .from("menu_items")
        .update({
          name: itemForm.name,
          description: itemForm.description || null,
        })
        .eq("id", editingItem.id);
      setEditingItem(null);
      setShowAddItemModal(false);
      fetchData();
    } catch (error) {
      console.error("Error updating item:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await supabase.from("menu_items").delete().eq("id", id);
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const getCategoryItems = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
  };

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
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-sm text-muted-foreground">Manage food categories and items</p>
        </div>
        <Button onClick={() => setShowAddItemModal(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category.id} className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  {category.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingCategory(category);
                      setCategoryForm({ name: category.name, type: category.type });
                      setShowAddCategoryModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getCategoryItems(category.id).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingItem(item);
                            setItemForm({ name: item.name, description: item.description || "", category_id: item.category_id });
                            setShowAddItemModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getCategoryItems(category.id).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items in this category
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Dialog open={showAddCategoryModal && !editingItem} onOpenChange={(open) => {
        setShowAddCategoryModal(open);
        if (!open) {
          setEditingCategory(null);
          setCategoryForm({ name: "", type: "starter" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Starters"
                className="input-field"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategoryModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingCategory ? handleEditCategory : handleAddCategory}
              disabled={saving || !categoryForm.name.trim()}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingCategory ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Item Modal */}
      <Dialog open={showAddItemModal} onOpenChange={(open) => {
        setShowAddItemModal(open);
        if (!open) {
          setEditingItem(null);
          setItemForm({ name: "", description: "", category_id: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingItem && (
              <div className="space-y-2">
                <Label>Category *</Label>
                <select
                  value={itemForm.category_id}
                  onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border-2 border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g., Paneer Tikka"
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Brief description"
                className="input-field"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingItem ? handleEditItem : handleAddItem}
              disabled={saving || !itemForm.name.trim() || (!editingItem && !itemForm.category_id)}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingItem ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
