"use client";

import { Button } from "@/components/ui/button";

import { deleteCategoryAction } from "./actions";

type Props = {
  categoryId: string;
};

export function DeleteCategoryButton({ categoryId }: Props) {
  return (
    <form
      action={deleteCategoryAction}
      onSubmit={(e) => {
        if (!confirm("Delete this category? It must have no users assigned.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <Button type="submit" variant="destructive" size="sm">
        Delete
      </Button>
    </form>
  );
}
