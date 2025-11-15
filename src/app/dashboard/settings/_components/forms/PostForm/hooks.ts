import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { calculatePartsFromPattern, mergeParts, MARGIN_PERCENTAGE } from "./functions";

// ... (Restante das interfaces permanece inalterado) ...
export interface Category { id: string; name: string, special?: boolean; }
export interface PatternPart { id?: string; name: string; percentage: number; }
export interface Pattern { id: string; name: string; parts: PatternPart[]; categoryId: string; }
export interface PostPart { id?: string; name: string; percentage: number; weight: number; price?: number; sellPrice?: number; isActive?: boolean; }
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

  const [form, setForm] = useState({
    id: "",
    title: "",
    weight: "",
    price: "",
    categoryId: "",
    patternId: "",
    isActive: true
  });

  const resetForm = useCallback(() => {
    setForm({ id: "", title: "", weight: "", price: "", categoryId: "", patternId: "", isActive: true });
    setParts([]);
    setSelectedPattern(null);
    setAlreadyExists(false);
    setOriginalPost(null);
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
  const data: Pattern[] = await res.json();
  setPatterns(data);

  // 🔧 Se estiver editando um post, ajusta as parts conforme o pattern
  if (originalPost && originalPost.patternId) {
    const pattern = data.find(p => p.id === originalPost.patternId);
    if (!pattern) return;

    // Garante que o peso e preço sejam numéricos, priorizando o formulário
    const numericWeight = parseFloat(form.weight) || originalPost.weight || 0;
    const numericPrice = parseFloat(form.price) || originalPost.price || 0;

    // As partes geradas pelo pattern refletem a nova distribuição do peso/preço
    const patternParts = calculatePartsFromPattern(
      pattern,
      numericWeight,
      numericPrice,
      categories
    );

    // ✅ CORREÇÃO: Utiliza `mergeParts` para somar o peso se já existir
    const updatedParts = mergeParts(
      originalPost.parts || [],
      patternParts, // As partes a serem "adicionadas" (com os novos pesos)
      numericPrice
    );

    setParts(updatedParts);
  }
}, [userId, originalPost, form.weight, form.price, categories]);

  useEffect(() => {
    if (userId) {
      fetchPosts();
      fetchCategories();
      fetchPatterns();
    }
  }, [userId, fetchPosts, fetchCategories, fetchPatterns]); // 👈 Adiciona dependências faltantes

  // --- handlers ---
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // atualiza preço e peso das partes
    if (name === "price" || name === "weight") {
      const numericPrice = name === "price" ? parseFloat(value) || 0 : parseFloat(form.price) || 0;
      const numericWeight = name === "weight" ? parseFloat(value) || 0 : parseFloat(form.weight) || 0;
      
      let newParts: PostPart[];

      if (selectedPattern) {
        // Recalcula as partes se houver um pattern selecionado
        newParts = calculatePartsFromPattern(
          selectedPattern,
          numericWeight,
          numericPrice,
          categories
        );
      } else {
        // Atualiza apenas preço e sellPrice se não houver pattern ou se as parts já existirem
        newParts = parts.map(pp => ({
          ...pp,
          price: numericPrice,
          // Recalcula o sellPrice com base no novo preço de custo
          sellPrice: parseFloat((numericPrice * (1 + MARGIN_PERCENTAGE)).toFixed(2))
        }));
      }

      setParts(newParts);
    }
  };

  const handlePatternSelect = (patternId: string) => {
    const pattern = patterns.find(p => p.id === patternId);
    setSelectedPattern(pattern || null);
    setForm(prev => ({
      ...prev,
      patternId,
      title: pattern?.name || prev.title,
      categoryId: pattern?.categoryId || prev.categoryId
    }));

    if (pattern) {
      const numericWeight = parseFloat(form.weight) || 0;
      const numericPrice = parseFloat(form.price) || 0;

      // ✅ O cálculo do sellPrice já está dentro de `calculatePartsFromPattern`
      const partsFromPattern = calculatePartsFromPattern(
        pattern,
        numericWeight,
        numericPrice,
        categories
      );

      setParts(partsFromPattern);
    }
  };

  const handleTitleSelect = (t: string) => setForm(prev => ({ ...prev, title: t }));

  const handlePartChange = (index: number, field: keyof PostPart, value: any) =>
    setParts(parts.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

  const handleSubmit = async (e: any) => {
  e.preventDefault();

  if (!form.title || !form.weight || !form.price || !form.categoryId) {
    return toast.error("Preencha todos os campos obrigatórios!");
  }

  const numericWeight = parseFloat(form.weight) || 0;
  const numericPrice = parseFloat(form.price) || 0;
  // ✅ O preço de venda do Post é 40% acima do preço de custo
  const sellPrice = parseFloat((numericPrice * (1 + MARGIN_PERCENTAGE)).toFixed(2));

  // garante sellPrice nas parts (o cálculo já está em `calculatePartsFromPattern` e `mergeParts`,
  // mas é bom garantir aqui se as partes foram inseridas manualmente)
  const adjustedParts: PostPart[] = parts.length
    ? parts.map(p => ({
        ...p,
        // Garante que o sellPrice esteja sempre calculado, se por acaso faltar
        sellPrice:
          p.sellPrice ??
          parseFloat(((p.price ?? numericPrice) * (1 + MARGIN_PERCENTAGE)).toFixed(2))
      }))
    : [
        {
          name: form.title,
          weight: numericWeight,
          price: numericPrice,
          sellPrice, // Usa o sellPrice calculado do post
          percentage: 100,
          isActive: true
        }
      ];

  // verifica se o post já existe
  const existingPost = posts.find(
    p => p.title.toLowerCase() === form.title.toLowerCase()
  );

  if (existingPost) {
    // ✅ atualiza o produto existente
    // O mergeParts já faz a soma do peso e o recálculo da porcentagem e sellPrice
    const mergedParts = mergeParts(
      existingPost.parts || [],
      adjustedParts,
      numericPrice // o preço do body, não do existente
    );

    // O peso total do post existente será o novo peso do formulário (o peso das parts reflete o total)
    const updatedPost = {
      ...existingPost,
      weight: numericWeight, // ✅ Novo peso do formulário
      price: numericPrice, // ✅ o novo preço do body
      sellPrice,
      parts: mergedParts
    };

    await fetch(`/api/posts/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPost)
    });

    toast.success("Produto existente atualizado com sucesso!");
    resetForm();
    fetchPosts();
    return;
  }

  // ✅ cria novo produto
  await fetch(`/api/posts/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...form,
      weight: numericWeight,
      price: numericPrice,
      sellPrice,
      parts: adjustedParts
    })
  });

  toast.success("Produto criado!");
  resetForm();
  fetchPosts();
};


  const handleEdit = async (post: Post) => {
  const matchedPattern = patterns.find((p) => p.name === post.title);
  setOriginalPost(post);

  setForm({
    id: post.id,
    title: post.title,
    weight: String(post.weight),
    price: String(post.price),
    categoryId: post.categoryId,
    patternId: matchedPattern?.id || post.patternId || "",
    isActive: post.isActive,
  });

  // ⚙️ se tiver pattern vinculado, busca e ajusta parts
  if (matchedPattern || post.patternId) {
    // 💡 Chamada ao fetchPatterns que agora contém a lógica para mergear as parts no modo edição
    fetchPatterns(); 
  } else {
    // Caso contrário, usa as partes existentes
    setParts(post.parts || []);
  }
};



  const handleDelete = async (id: string) => {
    await fetch(`/api/posts/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    toast.success("Excluído!");
    fetchPosts();
  };

  const isEditing = !!form.id;
  const isPatternBasedNewPost = !!selectedPattern && !isEditing;
  const uniqueTitles = useMemo(
    () =>
      Array.from(
        new Set(posts.flatMap(p => [p.title, ...(p.parts?.map(pt => pt.name) || [])]))
      ),
    [posts]
  );

  return {
    posts,
    parts,
    categories,
    patterns,
    form,
    alreadyExists,
    isEditing,
    isPatternBasedNewPost,
    uniqueTitles,
    handleChange,
    handleTitleSelect,
    handlePatternSelect,
    handlePartChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    resetForm,
    setAlreadyExists,
    setForm
  };
}