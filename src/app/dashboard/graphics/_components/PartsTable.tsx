"use client";
import React, { useMemo } from "react";
import { Button } from "@/_components/ui/button";
import { Trash, Plus } from "lucide-react";
import PostItem from "../../_components/post";
import { formatCurrency } from "@/helpers/format-currency";

interface PartsTableProps {
  posts: any[];
  parts: any[];
  selectedPost: string;
  setSelectedPost: (id: string) => void;
  openEditSheet: (part: any) => void;
  handleDeletePart: (id: string) => void;
}

export default function PartsTable({
  posts,
  parts,
  selectedPost,
  setSelectedPost,
  openEditSheet,
  handleDeletePart,
}: PartsTableProps) {
  const filteredParts = useMemo(() => {
    if (!Array.isArray(parts)) return [];
    if (!selectedPost) return parts;
    return parts.filter((part) => part.postId === selectedPost);
  }, [parts, selectedPost]);

  return (
    <PostItem
      data={posts.map((post) => ({ id: post.id, title: post.title }))}
      onSelectCategory={setSelectedPost}
    >
      <div className="max-h-[200px] h-[200px] overflow-auto">
        <table className="lg:min-w-lg min-w-full w-[300px] border border-gray-300 p-6 text-sm">
          <tbody className="w-full">
            <tr>
              <th>Parte</th>
              <th>Peso</th>
              <th>Preço</th>
              <th>Post</th>
              <th>Ações</th>
            </tr>
            {filteredParts.map((part: any) => (
              <tr key={part.id} className={part.sold === part.weight ? "hidden" : ""}>
                <td className="p-2 border-r">{part.name}</td>
                <td className="p-2 border-r">{part.weight - part.sold}kg</td>
                <td className="p-2 border-r">{formatCurrency(part.sellPrice)}</td>
                <td className="p-2 border-r">{part.postTitle}</td>
                <td className="p-2 flex gap-2">
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDeletePart(part.id)}>
                    <Trash />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEditSheet(part)}>
                    <Plus />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PostItem>
  );
}
