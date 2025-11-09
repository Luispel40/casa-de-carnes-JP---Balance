import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { calculatePartsFromPattern, mergeParts, MARGIN_PERCENTAGE } from "./functions";

export interface Category { id: string; name: string; }
export interface PatternPart { id?: string; name: string; percentage: number; }
export interface Pattern { id: string; name: string; parts: PatternPart[]; categoryId: string; }
export interface PostPart { id?: string; name: string; percentage: number; weight: number; price?: number; isActive?: boolean; }
export interface Post { id: string; title: string; weight: number; price: number; sellPrice?: number; sold: number; isActive: boolean; categoryId: string; category?: Category; patternId?: string | null; parts?: PostPart[]; }

export function usePostsForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [parts, setParts] = useState<PostPart[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [originalPost, setOriginalPost] = useState<Post | null>(null);

  const [form, setForm] = useState({ id: "", title: "", weight: "", price: "", categoryId: "", patternId: "", isActive: true });

  const resetForm = useCallback(() => {
    setForm({ id: "", title: "", weight: "", price: "", categoryId: "", patternId: "", isActive: true });
    setParts([]); setSelectedPattern(null); setAlreadyExists(false); setOriginalPost(null);
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/posts/${userId}`);
    setPosts(await res.json());
  }, [userId]);

  const fetchCategories = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/categories/${userId}`);
    setCategories(await res.json());
  }, [userId]);

  const fetchPatterns = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/patterns/${userId}`);
    setPatterns(await res.json());
  }, [userId]);

  useEffect(() => { if (userId) { fetchPosts(); fetchCategories(); fetchPatterns(); } }, [userId, fetchPosts]);

  // --- handlers simplificados ---
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === "price") setParts(p => p.map(pp => ({ ...pp, price: parseFloat(value) })));
  };

  const handlePatternSelect = (patternId: string) => {
    const pattern = patterns.find(p => p.id === patternId);
    setSelectedPattern(pattern || null);
    setForm(prev => ({ ...prev, patternId, title: pattern?.name || prev.title, categoryId: pattern?.categoryId || prev.categoryId }));
    if (pattern) setParts(calculatePartsFromPattern(pattern, parseFloat(form.weight) || 0, parseFloat(form.price) || 0));
  };

  const handleTitleSelect = (t: string) => setForm(prev => ({ ...prev, title: t }));

  const handlePartChange = (index: number, field: keyof PostPart, value: any) =>
    setParts(parts.map((p, i) => i === index ? { ...p, [field]: value } : p));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.title || !form.weight || !form.price || !form.categoryId) return toast.error("Campos obrigatórios!");
    const numericWeight = parseFloat(form.weight);
    const numericPrice = parseFloat(form.price);
    const sellPrice = parseFloat((numericPrice * (1 + MARGIN_PERCENTAGE)).toFixed(2));
    const adjustedParts = parts.length ? parts : [{ name: form.title, weight: numericWeight, price: numericPrice, percentage: 100, isActive: true }];

    if (form.id && originalPost) {
      await fetch(`/api/posts/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, weight: numericWeight, price: numericPrice, sellPrice, parts: adjustedParts }) });
      toast.success("Post editado!");
    } else {
      await fetch(`/api/posts/${userId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, weight: numericWeight, price: numericPrice, sellPrice, parts: adjustedParts }) });
      toast.success("Post criado!");
    }

    resetForm(); fetchPosts();
  };

  const handleEdit = (post: Post) => {
    setOriginalPost(post);
    setForm({ id: post.id, title: post.title, weight: String(post.weight), price: String(post.price), categoryId: post.categoryId, patternId: post.patternId || "", isActive: post.isActive });
    setParts(post.parts || []);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/posts/${userId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast.success("Excluído!"); fetchPosts();
  };

  const isEditing = !!form.id;
  const isPatternBasedNewPost = !!selectedPattern && !isEditing;
  const uniqueTitles = useMemo(() => Array.from(new Set(posts.flatMap(p => [p.title, ...(p.parts?.map(pt => pt.name) || [])]))), [posts]);

  return {
    posts, parts, categories, patterns, form,
    alreadyExists, isEditing, isPatternBasedNewPost, uniqueTitles,
    handleChange, handleTitleSelect, handlePatternSelect,
    handlePartChange, handleSubmit, handleEdit, handleDelete,
    resetForm, setAlreadyExists, setForm
  };
}
